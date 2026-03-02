import { useEffect } from 'react';
import type { Theme } from '../types';
import { useLocalStorage } from './useLocalStorage';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('dday-theme');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useLocalStorage<Theme>('dday-theme', getInitialTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return [theme, toggleTheme];
}
