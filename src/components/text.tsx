import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Fonts, type Colors } from '@/constants/theme';
import type { LanguageCode } from '@/data/sample';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * Type rules (docs/current-config.md §3): mono labels >= 11px, Inter meta >= 12px,
 * body serif 16.5-18px at 1.55-1.6, mobile display 30px, sentence case.
 */
export type TextVariant = 'display' | 'headline' | 'body' | 'ui' | 'meta' | 'label';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: keyof Colors;
  /** Medium weight (500). Regular is 400. */
  medium?: boolean;
  /** Set on Hindi and Marathi text so it gets the Devanagari fonts. */
  lang?: LanguageCode;
};

/** Text size S to XXL (You › Reading). Mono labels stay at their minimum. */
export const TEXT_SCALES = [0.9, 0.95, 1, 1.12, 1.25] as const;

const READING: TextVariant[] = ['display', 'headline', 'body'];

export function Text({ variant = 'body', color = 'ink', medium, lang, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const { prefs } = useReader();
  const base = styles[variant];
  const scale = variant === 'label' ? 1 : TEXT_SCALES[prefs.textSize] ?? 1;

  let family: string = medium ? mediumFamily[variant] : base.fontFamily;
  const reading = READING.includes(variant);
  if (reading && prefs.readFont === 'sans') family = medium ? Fonts.sansMedium : Fonts.sans;

  let spacing: { letterSpacing?: number; textTransform?: 'none' } | null = null;
  if (lang === 'hi' || lang === 'mr') {
    const sans = prefs.devanagariFont === 'match' ? prefs.readFont === 'sans' : prefs.devanagariFont === 'sans';
    family = sans ? (medium ? Fonts.devanagariSansMedium : Fonts.devanagariSans) : lang === 'hi' ? Fonts.hindi : Fonts.marathi;
    spacing = { letterSpacing: 0, textTransform: 'none' };
  }

  return (
    <RNText
      lang={lang}
      style={[
        base,
        { color: colors[color], fontFamily: family },
        scale !== 1 ? { fontSize: Math.round(base.fontSize * scale * 10) / 10, lineHeight: Math.round(base.lineHeight * scale) } : null,
        spacing,
        style,
      ]}
      {...rest}
    />
  );
}

const mediumFamily: Record<TextVariant, string> = {
  display: Fonts.serifMedium,
  headline: Fonts.serifMedium,
  body: Fonts.serifMedium,
  ui: Fonts.sansMedium,
  meta: Fonts.sansMedium,
  label: Fonts.monoMedium,
};

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.serif, fontSize: 30, lineHeight: 34, letterSpacing: -0.3 },
  headline: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 27 },
  body: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 27 },
  ui: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 21 },
  meta: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 17 },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
