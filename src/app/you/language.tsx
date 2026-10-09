import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { BackHeader, Screen, Segmented, SettingRow } from '@/components/ui';
import { useTarget } from '@/hooks/use-a11y';
import type { LanguageCode } from '@/data/sample';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const LANGS: { code: LanguageCode; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिंदी', english: 'Hindi' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
];
const FONT_NOTE = {
  match: 'Follows your Serif or Sans choice in You › Reading.',
  serif: 'Tiro Devanagari, a book serif for Hindi and Marathi.',
  sans: 'Mukta, a clear sans for Hindi and Marathi.',
};

/** You › Language (YouLanguage board): app language, source languages, Hindi and Marathi reading font. */
export default function Language() {
  const { colors } = useTheme();
  const toast = useToast();
  const target = useTarget();
  const { prefs, setPrefs } = useReader();
  const onCount = prefs.sourceLanguages.length;

  return (
    <Screen maxWidth={720} header={<BackHeader title="You" />}>
      <Text variant="display" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.4 }}>
        Language
      </Text>

      <Section title="App language" note="Menus, buttons and settings. Stories always stay in the language they were published in.">
        <View accessibilityRole="radiogroup" accessibilityLabel="App language">
          {LANGS.map((l) => {
            const on = prefs.appLanguage === l.code;
            return (
              <Pressable
                key={l.code}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPrefs({ appLanguage: l.code })}
                style={[styles.radioRow, { minHeight: target + 12, borderBottomColor: colors.rule }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="headline" lang={l.code !== 'en' ? l.code : undefined} style={{ fontSize: 20, lineHeight: 26 }}>
                    {l.native}
                  </Text>
                  <Text variant="meta" color="muted">
                    {l.english}
                  </Text>
                </View>
                <View style={[styles.radio, { borderColor: on ? colors.ink : colors.muted }]}>
                  {on ? <View style={[styles.dot, { backgroundColor: colors.ink }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {prefs.appLanguage !== 'en' ? (
          <Text variant="meta" color="muted" style={{ marginTop: 10, lineHeight: 19 }}>
            Draft: only the main menus and buttons are translated so far, and they still need a native speaker’s review.
          </Text>
        ) : null}
      </Section>

      <Section title="Source languages" note="Home, Feed and Search show outlets that publish in these languages. Keep at least one on.">
        {LANGS.map((l) => {
          const on = prefs.sourceLanguages.includes(l.code);
          const locked = on && onCount === 1;
          return (
            <SettingRow
              key={l.code}
              label={l.native}
              desc={locked ? 'Last one on. Keep at least one.' : `${l.english}-language outlets`}
              on={on}
              onChange={() => {
                if (locked) return toast.show('At least one language stays on.');
                setPrefs({ sourceLanguages: on ? prefs.sourceLanguages.filter((c) => c !== l.code) : [...prefs.sourceLanguages, l.code] });
              }}
            />
          );
        })}
      </Section>

      <Section title="Hindi and Marathi text">
        <View style={{ paddingVertical: 12, gap: 10 }}>
          <Text variant="ui">Reading font</Text>
          <Segmented
            value={prefs.devanagariFont}
            onChange={(devanagariFont) => setPrefs({ devanagariFont })}
            options={[
              { value: 'match', label: 'Match Font' },
              { value: 'serif', label: 'Serif' },
              { value: 'sans', label: 'Sans' },
            ]}
          />
          <Text variant="meta" color="muted">
            {FONT_NOTE[prefs.devanagariFont]}
          </Text>
        </View>
        <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
          <Text variant="label" color="muted">
            Preview
          </Text>
          <Text variant="body" lang="hi">
            शहर के जल बोर्ड ने सोमवार को तीन वार्डों में चौबीस घंटे जलापूर्ति का छह महीने का पायलट मंज़ूर किया।
          </Text>
          <Text variant="body" lang="mr">
            शहराच्या जल मंडळाने सोमवारी तीन प्रभागांत चोवीस तास पाणीपुरवठ्याचा सहा महिन्यांचा प्रयोग मंजूर केला.
          </Text>
        </View>
        <Text variant="meta" color="muted" style={{ marginTop: 10 }}>
          Tiro Devanagari only comes in one weight, so bolder text uses Mukta Medium.
        </Text>
      </Section>
    </Screen>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 26 }}>
      <View style={{ paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.ink }}>
        <Text variant="label" medium accessibilityRole="header">
          {title}
        </Text>
      </View>
      {note ? (
        <Text variant="meta" color="muted" style={{ marginTop: 8, lineHeight: 19 }}>
          {note}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 11, height: 11, borderRadius: 6 },
  preview: { marginTop: 4, padding: 14, gap: 8, borderWidth: 1 },
});
