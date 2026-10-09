import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { BookmarkIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { useColourCues, useTarget, useUnderlineLinks } from '@/hooks/use-a11y';
import { useReader, type Prefs } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

export type A11yRow =
  | { kind: 'seg'; key: string; label: string; desc?: string; value: string; options: { value: string; label: string }[]; set: (v: string) => void }
  | { kind: 'switch'; key: string; label: string; desc: string; on: boolean; locked?: boolean; set: (v: boolean) => void }
  | { kind: 'colour'; key: string; value: Prefs['colourMode']; set: (v: Prefs['colourMode']) => void }
  | { kind: 'note'; key: string; text: string };

export type A11ySection = { id: string; title: string; rows: A11yRow[] };

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

/**
 * Every accessibility setting (YouAccessibility / WebYou), grouped as on the boards. One list, rendered by the
 * phone screen (/you/accessibility) and the web You page.
 */
export function useAccessibilitySections(): A11ySection[] {
  const { prefs, setPrefs } = useReader();
  const web = Platform.OS === 'web';
  const mono = prefs.colourMode === 'mono';
  const sw = (key: keyof Prefs, label: string, desc: string, locked = false): A11yRow => ({
    kind: 'switch',
    key,
    label,
    desc,
    on: !!prefs[key] || locked,
    locked,
    set: (v) => setPrefs({ [key]: v } as Partial<Prefs>),
  });

  return [
    {
      id: 'text',
      title: 'Text',
      rows: [
        {
          kind: 'seg',
          key: 'textSize',
          label: 'Text size',
          desc: 'XXL goes up to about 200% of the standard size.',
          value: String(prefs.textSize),
          options: SIZES.map((label, i) => ({ value: String(i), label })),
          set: (v) => setPrefs({ textSize: Number(v) }),
        },
        {
          kind: 'seg',
          key: 'lineSpacing',
          label: 'Line spacing',
          value: prefs.lineSpacing,
          options: [
            { value: 'normal', label: 'Normal' },
            { value: 'relaxed', label: 'Relaxed' },
            { value: 'loose', label: 'Loose' },
          ],
          set: (v) => setPrefs({ lineSpacing: v as Prefs['lineSpacing'] }),
        },
        sw(
          'matchSystemSize',
          web ? 'Match my browser’s text size' : 'Match my phone’s text size',
          web ? 'Uses the zoom and font size set in your browser.' : 'Overrides the size above with the one set on your phone.',
        ),
      ],
    },
    {
      id: 'colour',
      title: 'Colour vision',
      rows: [
        { kind: 'colour', key: 'colourMode', value: prefs.colourMode, set: (colourMode) => setPrefs({ colourMode }) },
        {
          kind: 'note',
          key: 'tritan',
          text: 'Blue-yellow colour blindness (tritanopia): Standard already works. Un:edited uses no blue, green or yellow. The stamps keep their print colour; they are decoration, never a signal.',
        },
        sw('colourCues', 'Don’t rely on colour alone', 'Adds labels, underlines and shapes wherever colour carries meaning, like Saved and the active tab.', mono),
        sw('underlineLinks', 'Underline links', 'Links stay underlined, not just coloured.', mono),
      ],
    },
    {
      id: 'low',
      title: 'Low vision',
      rows: [
        sw('higherContrast', 'Higher contrast', 'Darker text and stronger lines on both Paper and Ink.'),
        sw('boldText', 'Bolder text', 'Uses the medium weight for body text and labels.'),
        sw(
          'strongFocus',
          'Stronger focus outline',
          web ? 'A thick outline shows where you are when using the keyboard.' : 'A thick outline shows where you are when using a keyboard or switch.',
        ),
      ],
    },
    {
      id: 'read',
      title: 'Reading and focus',
      rows: [
        sw('dyslexiaFont', 'Dyslexia-friendly font', 'Reads in Atkinson Hyperlegible, a typeface designed for low vision. Devanagari keeps Tiro or Mukta.'),
        sw('readingLine', 'Reading line', 'Dims the lines above and below the one you are reading.'),
        {
          kind: 'seg',
          key: 'tracking',
          label: 'Letter and word spacing',
          value: prefs.tracking,
          options: [
            { value: 'normal', label: 'Normal' },
            { value: 'wide', label: 'Wide' },
            { value: 'wider', label: 'Wider' },
          ],
          set: (v) => setPrefs({ tracking: v as Prefs['tracking'] }),
        },
      ],
    },
    {
      id: 'touch',
      title: web ? 'Pointer and keyboard' : 'Touch and movement',
      rows: [
        sw(
          'largeTargets',
          web ? 'Larger click targets' : 'Larger touch targets',
          'Buttons and rows grow from 44 to 56 pixels tall.',
        ),
        sw(
          'swipeButtons',
          'Buttons instead of swiping',
          web
            ? 'Shows Previous and Next in Feed instead of relying on swipes or trackpad gestures.'
            : 'Shows Previous and Next in Feed and Article instead of relying on swipes.',
        ),
      ],
    },
    {
      id: 'motion',
      title: 'Motion',
      rows: [
        sw(
          'reduceMotion',
          'Reduce motion',
          `Turns off stamps, wipes and page animations. On automatically if your ${web ? 'system' : 'phone'} asks for it.`,
        ),
      ],
    },
    {
      id: 'readers',
      title: 'Screen readers',
      rows: [
        sw('readCredits', 'Read image credits aloud', 'Reads the photographer and agency line from the publisher before the story.'),
        {
          kind: 'note',
          key: 'sr',
          text: 'Un:edited works with VoiceOver and TalkBack. Stories are read in the language they were published in, and every button has a spoken label.',
        },
      ],
    },
  ];
}

const MODES: { value: Prefs['colourMode']; label: string; desc: string; swatch: { paper: string; ink: string } }[] = [
  { value: 'standard', label: 'Standard', desc: 'Oxblood accent on Paper, coral on Ink.', swatch: { paper: '#A8372A', ink: '#C8705F' } },
  {
    value: 'redgreen',
    label: 'Red-green friendly',
    desc: 'Blue accent instead of red. For protanopia and deuteranopia.',
    swatch: { paper: '#1F5C99', ink: '#7DB0E6' },
  },
  {
    value: 'mono',
    label: 'Black and white only',
    desc: 'No accent colour. Emphasis comes from underlines, labels and icons.',
    swatch: { paper: '#1C1A17', ink: '#C9C0B0' },
  },
];

/** Colour mode as three radio cards with a swatch of each accent (YouAccessibility). */
export function ColourModes({ value, set }: { value: Prefs['colourMode']; set: (v: Prefs['colourMode']) => void }) {
  const { colors, name } = useTheme();
  const target = useTarget();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Colour mode" style={{ gap: 8, paddingVertical: 12 }}>
      {MODES.map((m) => {
        const on = m.value === value;
        return (
          <Pressable
            key={m.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${m.label}. ${m.desc}`}
            onPress={() => set(m.value)}
            style={[styles.mode, { minHeight: target + 16, borderColor: on ? colors.ink : colors.rule, borderWidth: on ? 1.5 : 1 }]}>
            <View style={[styles.radio, { borderColor: on ? colors.ink : colors.muted }]}>
              {on ? <View style={[styles.radioDot, { backgroundColor: colors.ink }]} /> : null}
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="ui">{m.label}</Text>
              <Text variant="meta" color="muted">
                {m.desc}
              </Text>
            </View>
            <View aria-hidden style={[styles.swatch, { backgroundColor: m.swatch[name] }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Live preview that follows every setting (YouAccessibility). */
export function AccessibilityPreview() {
  const { colors } = useTheme();
  const cues = useColourCues();
  const underline = useUnderlineLinks();
  return (
    <View accessibilityLiveRegion="polite" style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
      <Text variant="label" color="accent">
        Preview · City · Covered by 4 of your sources
      </Text>
      <Text variant="body">
        The city water board on Monday approved a six-month pilot that will move three wards to{' '}
        <Text variant="body" color="accent" style={underline ? { textDecorationLine: 'underline' } : null}>
          round-the-clock water
        </Text>
        .
      </Text>
      <View style={styles.previewByline}>
        <Text variant="meta" color="muted">
          Morning Ledger · 2h
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <BookmarkIcon size={18} color={colors.accent} filled />
          {cues ? (
            <Text variant="meta" color="accent" medium>
              Saved
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mode: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  swatch: { width: 22, height: 22, borderRadius: 11 },
  preview: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 16, gap: 8, borderWidth: 1 },
  previewByline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
