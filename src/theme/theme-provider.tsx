import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { Palettes, type Colors, type ThemeName, type ThemePreference } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const STORAGE_KEY = 'unedited.theme';

type ThemeValue = {
  name: ThemeName;
  colors: Colors;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'paper' || saved === 'ink' || saved === 'system') setPreferenceState(saved);
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const name: ThemeName = preference === 'system' ? (scheme === 'dark' ? 'ink' : 'paper') : preference;
    return { name, colors: Palettes[name], preference, setPreference };
  }, [preference, scheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
