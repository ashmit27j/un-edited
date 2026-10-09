import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { BackHeader, Screen, Segmented } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

/** You › Reading: theme, reading font and home view, with a live preview (as onboarding step 2, OB3Reading). */
export default function Reading() {
  const { colors, preference, setPreference } = useTheme();
  const t = useT();
  const { prefs, setPrefs } = useReader();

  return (
    <Screen maxWidth={720} header={<BackHeader title="You" />}>
      <Text variant="display" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.4 }}>
        {t('you.reading')}
      </Text>
      <Text variant="meta" color="muted" style={styles.label}>
        {t('you.theme')}
      </Text>
      <Segmented
        value={preference}
        onChange={setPreference}
        options={[
          { value: 'paper', label: 'Light' },
          { value: 'system', label: 'System' },
          { value: 'ink', label: 'Dark' },
        ]}
      />
      <Text variant="meta" color="muted" style={styles.label}>
        Reading font
      </Text>
      <Segmented
        value={prefs.readFont}
        onChange={(readFont) => setPrefs({ readFont })}
        options={[
          { value: 'serif', label: 'Serif' },
          { value: 'sans', label: 'Sans serif' },
        ]}
      />
      <Text variant="meta" color="muted" style={styles.label}>
        Home view
      </Text>
      <Segmented
        value={prefs.homeView}
        onChange={(homeView) => setPrefs({ homeView })}
        options={[
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'focused', label: 'Focused' },
        ]}
      />
      <View style={[styles.preview, { borderColor: colors.rule, backgroundColor: colors.surface }]}>
        <Text variant="label" color="muted">
          Preview
        </Text>
        <Text variant="headline">Water board clears a 24-hour supply pilot for three wards</Text>
        <Text variant="body" color="muted">
          The city water board on Monday approved a six-month pilot that will move three wards to round-the-clock water.
        </Text>
      </View>
      <Text variant="meta" color="muted" style={{ marginTop: 12 }}>
        Text size, line spacing and the dyslexia-friendly font are in You › Accessibility.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 20, marginBottom: 6 },
  preview: { marginTop: 20, padding: 18, gap: 6, borderWidth: StyleSheet.hairlineWidth },
});
