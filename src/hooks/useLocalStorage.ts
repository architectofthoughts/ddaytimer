import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const initialValueRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key, value: valueToStore } }));
      return valueToStore;
    });
  }, [key]);

  // Listen for cross-tab storage events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValueRef.current);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  // Listen for same-tab local storage writes from other hook instances.
  useEffect(() => {
    const handleLocalStorageChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string; value?: T }>).detail;
      if (detail?.key !== key) return;

      if (detail.value !== undefined) {
        setStoredValue(detail.value);
        return;
      }

      try {
        const item = localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValueRef.current);
      } catch {
        setStoredValue(initialValueRef.current);
      }
    };

    window.addEventListener('local-storage-change', handleLocalStorageChange);
    return () => window.removeEventListener('local-storage-change', handleLocalStorageChange);
  }, [key]);

  // Listen for sync-update events (from server sync)
  useEffect(() => {
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.key === key) {
        setStoredValue(detail.value);
      }
    };
    window.addEventListener('sync-update', handleSync);
    return () => window.removeEventListener('sync-update', handleSync);
  }, [key]);

  return [storedValue, setValue];
}
