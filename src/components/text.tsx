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

/**
 * Text size S to XXL (You › Accessibility): body 15 / 17 / 19.5 / 22 / 28px, so M (17) is the standard size.
 * Mono labels stay at their minimum.
 */
export const TEXT_SCALES = [15 / 17, 1, 19.5 / 17, 22 / 17, 28 / 17] as const;

/** Line spacing for body text: Normal 1.55, Relaxed 1.75, Loose 1.95 (as a factor on the designed line height). */
const LINE_SPACING = { normal: 1, relaxed: 1.75 / 1.55, loose: 1.95 / 1.55 } as const;
/** Letter spacing in em: Normal, Wide, Wider. */
const TRACKING = { normal: 0, wide: 0.02, wider: 0.05 } as const;

const READING: TextVariant[] = ['display', 'headline', 'body'];

/**
 * Reading text is sized for Baskervville. Inter and Atkinson have a taller x-height, so the same px reads
 * about 25% bigger (HANDOFF §2): Sans = serif size × 0.88, dyslexia-friendly (Atkinson) = × 0.9,
 * rounded to 0.5px, with the line height scaled to keep the same multiplier. UI text never changes.
 */
export const READING_FACTOR = { serif: 1, sans: 0.88, dyslexic: 0.9 } as const;

export function readingSize(serifPx: number, font: keyof typeof READING_FACTOR) {
  return Math.round(serifPx * READING_FACTOR[font] * 2) / 2;
}

const DEVANAGARI = /[ऀ-ॿ]/;

export function Text({ variant = 'body', color = 'ink', medium, lang: given, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const { prefs } = useReader();
  // Devanagari text without a lang (translated menus, Hindi/Marathi outlet names) still gets its fonts and spacing.
  const lang =
    given ?? (typeof rest.children === 'string' && DEVANAGARI.test(rest.children) ? (prefs.appLanguage === 'mr' ? 'mr' : 'hi') : undefined);
  const base = styles[variant];
  // "Match my phone's text size" hands sizing to the system (font scaling stays on), so the S–XXL step is ignored.
  const scale = variant === 'label' || prefs.matchSystemSize ? 1 : TEXT_SCALES[prefs.textSize] ?? 1;
  // Bolder text: the medium weight everywhere text would be regular.
  const weight = medium || prefs.boldText;

  let family: string = weight ? mediumFamily[variant] : base.fontFamily;
  const reading = READING.includes(variant);
  const own = StyleSheet.flatten(style) ?? {};
  // A style with its own fontFamily (wordmark, avatar letters) keeps its size and face.
  let readFace: keyof typeof READING_FACTOR = 'serif';
  if (reading && !own.fontFamily) {
    if (prefs.dyslexiaFont) readFace = 'dyslexic';
    else if (prefs.readFont === 'sans') readFace = 'sans';
  }
  if (readFace === 'sans') family = weight ? Fonts.sansMedium : Fonts.sans;
  // Atkinson ships 400 and 700 only; 700 would break the 400/500 rule, so it stays regular.
  if (readFace === 'dyslexic') family = Fonts.dyslexic;

  // Custom fonts have one family per style: italic serif text needs the italic cut, not a slanted regular.
  // fontStyle goes back to normal so web doesn't slant the italic cut a second time.
  let italic: { fontFamily: string; fontStyle: 'normal' } | null = null;
  if ((family === Fonts.serif || family === Fonts.serifMedium) && own.fontStyle === 'italic') {
    italic = { fontFamily: family === Fonts.serif ? Fonts.serifItalic : Fonts.serifMediumItalic, fontStyle: 'normal' };
  }

  let spacing: { letterSpacing?: number; textTransform?: 'none' } | null = null;
  const devanagari = lang === 'hi' || lang === 'mr';
  if (devanagari) {
    // Interface text is always Mukta; reading text follows You › Language › Hindi and Marathi font.
    const sans = !reading || (prefs.devanagariFont === 'match' ? prefs.readFont === 'sans' : prefs.devanagariFont === 'sans');
    family = sans ? (weight ? Fonts.devanagariSansMedium : Fonts.devanagariSans) : lang === 'hi' ? Fonts.hindi : Fonts.marathi;
    spacing = { letterSpacing: 0, textTransform: 'none' };
    // Devanagari keeps its own faces, so it doesn't take the Sans / Atkinson size factor.
    readFace = 'serif';
  }

  // Final size: text-size step × reading-face factor, applied after any size the caller set.
  const fontSize = (own.fontSize ?? base.fontSize) * scale;
  const factor = READING_FACTOR[readFace];
  // Devanagari needs more room for its marks: line height +0.1 of the font size.
  const spacingFactor = variant === 'body' ? LINE_SPACING[prefs.lineSpacing] : 1;
  const lineHeight = (own.lineHeight ?? base.lineHeight) * scale * spacingFactor + (devanagari ? fontSize * 0.1 : 0);
  const tracking = devanagari ? 0 : TRACKING[prefs.tracking];
  const sized =
    scale !== 1 || factor !== 1 || devanagari || spacingFactor !== 1 || tracking
      ? {
          fontSize: Math.round(fontSize * factor * 2) / 2,
          lineHeight: Math.round(lineHeight * factor),
          ...(tracking ? { letterSpacing: Math.round(fontSize * tracking * 10) / 10 + (own.letterSpacing ?? ('letterSpacing' in base ? base.letterSpacing : 0)) } : null),
        }
      : null;

  return (
    <RNText
      lang={lang}
      style={[
        base,
        { color: colors[color], fontFamily: family },
        spacing,
        style,
        sized,
        italic,
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
