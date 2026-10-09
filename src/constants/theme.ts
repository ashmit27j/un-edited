/**
 * Design tokens. Source of truth: docs/current-config.md §3.
 * Paper = light, Ink = dark (low contrast).
 */

export const Palettes = {
  paper: {
    bg: '#F1EBE0',
    surface: '#F8F3EA',
    ink: '#1C1A17',
    muted: '#6B645A',
    rule: '#DDD4C4',
    accent: '#A8372A',
    accentSoft: '#EBD5CC',
    photo: '#DCD2C1',
  },
  ink: {
    bg: '#1E1C19',
    surface: '#262320',
    ink: '#C9C0B0',
    muted: '#8E8678',
    rule: '#38332D',
    accent: '#C8705F',
    accentSoft: '#3A2924',
    photo: '#2D2924',
  },
} as const;

export type ThemeName = keyof typeof Palettes;
export type Colors = { [K in keyof typeof Palettes.paper]: string };
export type ThemePreference = 'system' | ThemeName;

/**
 * Font family names as registered by useFonts in the root layout.
 * Weights are 400 and 500 only (700 for the wordmark). Custom fonts get one
 * family per weight, so never pair these with fontWeight.
 */
export const Fonts = {
  serif: 'Baskervville_400Regular',
  serifMedium: 'Baskervville_500Medium',
  serifItalic: 'Baskervville_400Regular_Italic',
  serifMediumItalic: 'Baskervville_500Medium_Italic',
  wordmark: 'Baskervville_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  hindi: 'TiroDevanagariHindi_400Regular',
  marathi: 'TiroDevanagariMarathi_400Regular',
  devanagariSans: 'Mukta_400Regular',
  devanagariSansMedium: 'Mukta_500Medium',
  /** Dyslexia-friendly option (You › Accessibility; the setting itself is not built yet). */
  dyslexic: 'AtkinsonHyperlegible_400Regular',
  dyslexicBold: 'AtkinsonHyperlegible_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24, // phone margin
  five: 32,
  six: 64,
} as const;

export const TouchTarget = 44;
export const MaxContentWidth = 1200;
/** Web switches from a bottom tab bar to a top nav at this width. */
export const WideBreakpoint = 768;
