import { useEffect, useRef, useState, useCallback } from 'react';

const SYNC_KEYS = ['dday-list', 'kanban-data', 'kanban-range', 'emotion-log', 'dday-archive'];
const SYNC_URL = '/api/sync';
const DEBOUNCE_MS = 1500;

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'pending' | 'error';

function isOnline() {
  return navigator.onLine;
}

function getSyncPayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try { payload[key] = JSON.parse(raw); } catch { /* skip */ }
    }
  }
  return payload;
}

function applySyncData(data: Record<string, unknown>) {
  for (const key of SYNC_KEYS) {
    if (key in data) {
      const value = data[key];
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('sync-update', { detail: { key, value } }));
    }
  }
}

export function useSync(): { status: SyncStatus; lastSynced: number | null; forceSync: () => void } {
  const [status, setStatus] = useState<SyncStatus>(() => (isOnline() ? 'idle' : 'offline'));
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pushingRef = useRef(false);
  const pendingPushRef = useRef(false);

  const setOfflineStatus = useCallback(() => {
    setStatus(pendingPushRef.current ? 'pending' : 'offline');
  }, []);

  // Pull from server
  const pull = useCallback(async () => {
    if (!isOnline()) {
      setOfflineStatus();
      return;
    }

    try {
      setStatus('syncing');
      const res = await fetch(SYNC_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        applySyncData(data);
      }
      setStatus('synced');
      setLastSynced(Date.now());
    } catch {
      if (isOnline()) {
        setStatus('error');
      } else {
        setOfflineStatus();
      }
    }
  }, [setOfflineStatus]);

  // Push to server
  const push = useCallback(async () => {
    if (!isOnline()) {
      pendingPushRef.current = true;
      setStatus('pending');
      return;
    }

    if (pushingRef.current) return;
    pushingRef.current = true;
    try {
      setStatus('syncing');
      const payload = getSyncPayload();
      const res = await fetch(SYNC_URL, {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pendingPushRef.current = false;
      setStatus('synced');
      setLastSynced(Date.now());
    } catch {
      pendingPushRef.current = true;
      if (isOnline()) {
        setStatus('error');
      } else {
        setStatus('pending');
      }
    } finally {
      pushingRef.current = false;
    }
  }, []);

  // Debounced push
  const debouncedPush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(push, DEBOUNCE_MS);
  }, [push]);

  // Pull on mount
  useEffect(() => {
    if (isOnline()) {
      void pull();
      return;
    }

    setOfflineStatus();
  }, [pull, setOfflineStatus]);

  // Listen for local storage changes and push
  useEffect(() => {
    const handleChange = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (typeof key !== 'string' || !SYNC_KEYS.includes(key)) {
        return;
      }

      pendingPushRef.current = true;

      if (!isOnline()) {
        setStatus('pending');
        return;
      }

      debouncedPush();
    };
    window.addEventListener('local-storage-change', handleChange);
    return () => {
      window.removeEventListener('local-storage-change', handleChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [debouncedPush]);

  useEffect(() => {
    const handleOnline = () => {
      if (pendingPushRef.current) {
        void push();
        return;
      }

      void pull();
    };

    const handleOffline = () => {
      setOfflineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pull, push, setOfflineStatus]);

  const forceSync = useCallback(() => {
    if (pendingPushRef.current) {
      void push();
      return;
    }

    void pull();
  }, [pull, push]);

  return { status, lastSynced, forceSync };
}
