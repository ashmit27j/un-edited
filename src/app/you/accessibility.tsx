import { StyleSheet, View } from 'react-native';

import { AccessibilityPreview, ColourModes, useAccessibilitySections } from '@/components/accessibility';
import { Text } from '@/components/text';
import { BackHeader, Screen, Segmented, SettingRow } from '@/components/ui';
import { useTheme } from '@/theme/theme-provider';

/** You › Accessibility (YouAccessibility board). Every setting applies at once; the preview follows them. */
export default function Accessibility() {
  const { colors } = useTheme();
  const sections = useAccessibilitySections();

  return (
    <Screen maxWidth={720} header={<BackHeader title="You" />}>
      <Text variant="display" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.4 }}>
        Accessibility
      </Text>
      <AccessibilityPreview />
      {sections.map((section) => (
        <View key={section.id} style={{ marginTop: 26 }}>
          <View style={[styles.head, { borderBottomColor: colors.ink }]}>
            <Text variant="label" medium accessibilityRole="header">
              {section.title}
            </Text>
          </View>
          {section.rows.map((row) => {
            if (row.kind === 'seg')
              return (
                <View key={row.key} style={[styles.seg, { borderBottomColor: colors.rule }]}>
                  <Text variant="ui">{row.label}</Text>
                  <Segmented value={row.value} onChange={row.set} options={row.options} />
                  {row.desc ? (
                    <Text variant="meta" color="muted">
                      {row.desc}
                    </Text>
                  ) : null}
                </View>
              );
            if (row.kind === 'switch')
              return (
                <SettingRow
                  key={row.key}
                  label={row.label}
                  desc={row.locked ? `${row.desc} On with Black and white only.` : row.desc}
                  on={row.on}
                  onChange={row.locked ? () => {} : row.set}
                />
              );
            if (row.kind === 'colour') return <ColourModes key={row.key} value={row.value} set={row.set} />;
            return (
              <Text key={row.key} variant="meta" color="muted" style={{ paddingVertical: 10, lineHeight: 19 }}>
                {row.text}
              </Text>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingBottom: 8, borderBottomWidth: 1 },
  seg: { paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
});
