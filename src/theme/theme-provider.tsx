import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { Palettes, type Colors, type ThemeName, type ThemePreference } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const STORAGE_KEY = 'unedited.theme';

/** Light (Paper) unless the reader picks Ink or System. */
const DEFAULT_PREFERENCE: ThemePreference = 'paper';

type ThemeValue = {
  name: ThemeName;
  colors: Colors;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'paper' || saved === 'ink' || saved === 'system') setPreferenceState(saved);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const name: ThemeName = preference === 'system' ? (scheme === 'dark' ? 'ink' : 'paper') : preference;
    return { name, colors: Palettes[name], preference, setPreference };
  }, [preference, scheme, setPreference]);

  // Web: keep <html data-theme> (CSS tokens, landing page) and the browser theme colour in step.
  // Waits for the saved choice so it never overrides what the head script already set.
  useEffect(() => {
    if (Platform.OS !== 'web' || !loaded || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', value.name);
    root.style.colorScheme = value.name === 'ink' ? 'dark' : 'light';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', value.colors.bg);
  }, [loaded, value.name, value.colors.bg]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
