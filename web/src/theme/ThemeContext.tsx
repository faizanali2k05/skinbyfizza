import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readSync, storage } from '../platform/storage';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'app.themeMode';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Dark is the brand default, matching the Expo app. */
function initialMode(): ThemeMode {
  const saved = readSync(STORAGE_KEY);
  return saved === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  // Theme switching is a single attribute swap — the CSS variables in
  // index.css do the rest, so nothing re-renders for colour.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0A0A0C' : '#F4F1EA');
  }, [mode]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void storage.set(STORAGE_KEY, next);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      setMode,
      toggle: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
