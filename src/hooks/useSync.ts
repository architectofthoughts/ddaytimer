import { useEffect, useRef, useState, useCallback } from 'react';

const SYNC_KEYS = ['dday-list', 'kanban-data', 'kanban-range', 'emotion-log', 'dday-archive'];
const SYNC_URL = '/api/sync';
const DEBOUNCE_MS = 1500;

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

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
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pushingRef = useRef(false);

  // Pull from server
  const pull = useCallback(async () => {
    try {
      setStatus('syncing');
      const res = await fetch(SYNC_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        applySyncData(data);
      }
      setStatus('synced');
      setLastSynced(Date.now());
    } catch {
      setStatus('error');
    }
  }, []);

  // Push to server
  const push = useCallback(async () => {
    if (pushingRef.current) return;
    pushingRef.current = true;
    try {
      setStatus('syncing');
      const payload = getSyncPayload();
      const res = await fetch(SYNC_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('synced');
      setLastSynced(Date.now());
    } catch {
      setStatus('error');
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
    pull();
  }, [pull]);

  // Listen for local storage changes and push
  useEffect(() => {
    const handleChange = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (SYNC_KEYS.includes(key)) {
        debouncedPush();
      }
    };
    window.addEventListener('local-storage-change', handleChange);
    return () => {
      window.removeEventListener('local-storage-change', handleChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [debouncedPush]);

  const forceSync = useCallback(async () => {
    await pull();
  }, [pull]);

  return { status, lastSynced, forceSync };
}
