import { useEffect, useRef, useState, useCallback } from 'react';

const SYNC_KEYS = ['dday-list', 'kanban-data', 'kanban-range', 'emotion-log', 'dday-archive'];
const SYNC_URL = '/api/sync';
const DEBOUNCE_MS = 1500;
const MAX_PENDING_CHANGES = 99;

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'disabled' | 'error';

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

export function useSync(): {
  status: SyncStatus;
  lastSynced: number | null;
  forceSync: () => void;
  pendingChanges: number;
  isOnline: boolean;
} {
  const [status, setStatus] = useState<SyncStatus>(() => window.navigator.onLine ? 'idle' : 'offline');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);
  const [remoteSyncEnabled, setRemoteSyncEnabled] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pushingRef = useRef(false);
  const queuePendingChange = useCallback(() => {
    setPendingChanges(prev => Math.min(prev + 1, MAX_PENDING_CHANGES));
  }, []);

  const disableRemoteSync = useCallback(() => {
    setRemoteSyncEnabled(false);
    setPendingChanges(0);
    setStatus('disabled');
  }, []);

  // Pull from server
  const pull = useCallback(async () => {
    if (!remoteSyncEnabled) return;
    if (!window.navigator.onLine) {
      setIsOnline(false);
      setStatus('offline');
      return;
    }

    try {
      setIsOnline(true);
      setStatus('syncing');
      const res = await fetch(SYNC_URL);
      if (res.status === 404 || res.status === 405 || res.status === 501) {
        disableRemoteSync();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        applySyncData(data);
      }
      setStatus('synced');
      setLastSynced(Date.now());
    } catch {
      if (!window.navigator.onLine) {
        setIsOnline(false);
        setStatus('offline');
        return;
      }
      setStatus('error');
    }
  }, [disableRemoteSync, remoteSyncEnabled]);

  // Push to server
  const push = useCallback(async () => {
    if (!remoteSyncEnabled) return;
    if (pushingRef.current) return;
    if (!window.navigator.onLine) {
      setIsOnline(false);
      setStatus('offline');
      return;
    }

    pushingRef.current = true;
    try {
      setIsOnline(true);
      setStatus('syncing');
      const payload = getSyncPayload();
      const res = await fetch(SYNC_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 404 || res.status === 405 || res.status === 501) {
        disableRemoteSync();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('synced');
      setLastSynced(Date.now());
      setPendingChanges(0);
    } catch {
      if (!window.navigator.onLine) {
        setIsOnline(false);
        setStatus('offline');
        return;
      }
      queuePendingChange();
      setStatus('error');
    } finally {
      pushingRef.current = false;
    }
  }, [disableRemoteSync, queuePendingChange, remoteSyncEnabled]);

  // Debounced push
  const debouncedPush = useCallback(() => {
    if (!remoteSyncEnabled) return;
    if (!window.navigator.onLine) {
      setIsOnline(false);
      queuePendingChange();
      setStatus('offline');
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void push();
    }, DEBOUNCE_MS);
  }, [push, queuePendingChange, remoteSyncEnabled]);

  // Pull on mount
  useEffect(() => {
    void pull();
  }, [pull]);

  // Listen for local storage changes and push
  useEffect(() => {
    const handleChange = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (SYNC_KEYS.includes(key) && remoteSyncEnabled) {
        debouncedPush();
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (!remoteSyncEnabled) return;
      if (pendingChanges > 0) {
        void push();
        return;
      }
      void pull();
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (remoteSyncEnabled) {
        setStatus('offline');
      }
    };

    window.addEventListener('local-storage-change', handleChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('local-storage-change', handleChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [debouncedPush, pendingChanges, pull, push, remoteSyncEnabled]);

  const forceSync = useCallback(async () => {
    if (!remoteSyncEnabled) return;
    if (!window.navigator.onLine) {
      setIsOnline(false);
      setStatus('offline');
      return;
    }
    if (pendingChanges > 0) {
      await push();
    }
    await pull();
  }, [pendingChanges, pull, push, remoteSyncEnabled]);

  return { status, lastSynced, forceSync, pendingChanges, isOnline };
}
