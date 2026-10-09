import { StyleSheet, View } from 'react-native';

import { StoryRow } from '@/components/story';
import { Text } from '@/components/text';
import { BackHeader, Screen } from '@/components/ui';
import { storyById, type Story } from '@/data/sample';
import { HISTORY_LIMIT, useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const DAY = 86_400_000;

/** Recently viewed (History board): the last 20 stories opened, grouped by day, on this device only. */
export default function History() {
  const { colors } = useTheme();
  const { recent, viewedAt } = useReader();
  const stories = recent.map((id) => storyById(id)).filter((s): s is Story => !!s);

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const start = midnight.getTime();
  const groups: { label: string; items: Story[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier this week', items: [] },
    { label: 'Older', items: [] },
  ];
  for (const s of stories) {
    const at = viewedAt[s.id] ?? start;
    const g = at >= start ? 0 : at >= start - DAY ? 1 : at >= start - 6 * DAY ? 2 : 3;
    groups[g].items.push(s);
  }

  return (
    <Screen maxWidth={720} header={<BackHeader title="Library" />}>
      <Text variant="display" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.4 }}>
        Recently viewed
      </Text>
      <View style={[styles.meta, { borderBottomColor: colors.ink }]}>
        <Text variant="label" color="muted">
          {stories.length} of {HISTORY_LIMIT} loaded
        </Text>
        <Text variant="label" color="muted">
          Newest first
        </Text>
      </View>

      {stories.length === 0 ? (
        <Text variant="body" color="muted" style={{ paddingVertical: 32 }}>
          Stories you open will be listed here.
        </Text>
      ) : (
        groups
          .filter((g) => g.items.length)
          .map((g) => (
            <View key={g.label} style={{ marginTop: 22 }}>
              <Text variant="label" medium accessibilityRole="header">
                {g.label}
              </Text>
              {g.items.map((s) => (
                <StoryRow key={s.id} story={s} />
              ))}
            </View>
          ))
      )}

      {stories.length ? (
        <Text variant="body" color="muted" style={styles.end}>
          That’s all {stories.length}. Your history keeps the last {HISTORY_LIMIT} articles you opened, on this device only.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { marginTop: 6, paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1 },
  end: { marginTop: 24, textAlign: 'center', fontStyle: 'italic', fontSize: 14, lineHeight: 21 },
});
