import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { Palettes, type Colors, type ThemeName, type ThemePreference } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReader, type Prefs } from '@/store/reader-provider';
import { fadeTheme } from '@/theme/fade-theme';

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

/** Mix two #rrggbb colours: t = 0 gives a, t = 1 gives b. */
function mix(a: string, b: string, t: number) {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Accessibility colour settings (YouAccessibility). Colour-vision modes change the accent only; stamps keep
 * their print colour. Higher contrast darkens text and strengthens rules on both Paper and Ink.
 */
function adjust(name: ThemeName, base: Colors, prefs: Prefs): Colors {
  const ink = name === 'ink';
  const colors = { ...base };
  if (prefs.colourMode === 'redgreen') colors.accent = ink ? '#7DB0E6' : '#1F5C99';
  if (prefs.colourMode === 'mono') colors.accent = base.ink;
  if (prefs.colourMode !== 'standard') colors.accentSoft = mix(colors.surface, colors.accent, 0.18);
  if (prefs.higherContrast) {
    colors.ink = ink ? '#E8E1D4' : '#000000';
    colors.muted = mix(base.muted, colors.ink, 0.35);
    colors.rule = ink ? '#4A443C' : '#C2B6A2';
    if (prefs.colourMode === 'mono') colors.accent = colors.ink;
  }
  return colors;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const { prefs } = useReader();
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

  const setPreference = useCallback(
    (next: ThemePreference) => {
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      fadeTheme(() => {
        setPreferenceState(next);
        // Web: update <html data-theme> inside the fade too, so the CSS-variable pages (landing) fade with it.
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const name: ThemeName = next === 'system' ? (scheme === 'dark' ? 'ink' : 'paper') : next;
          document.documentElement.setAttribute('data-theme', name);
          document.documentElement.style.colorScheme = name === 'ink' ? 'dark' : 'light';
        }
      });
    },
    [scheme],
  );

  const value = useMemo<ThemeValue>(() => {
    const name: ThemeName = preference === 'system' ? (scheme === 'dark' ? 'ink' : 'paper') : preference;
    return { name, colors: adjust(name, Palettes[name], prefs), preference, setPreference };
  }, [preference, scheme, setPreference, prefs]);

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
