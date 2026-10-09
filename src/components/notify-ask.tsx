import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useNotificationSettings } from '@/components/notification-settings';
import { Text } from '@/components/text';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const DAY = 86_400_000;

/**
 * "Want a nudge when your edition is ready?" (NotificationDelivery board). Shown once, from the reader's second
 * day, above the Home edition strip. Never during onboarding, never again after either answer.
 */
export function NotifyAsk() {
  const { colors } = useTheme();
  const { firstSeen, prefs } = useReader();
  const s = useNotificationSettings();
  const n = prefs.notify;
  const [now] = useState(() => Date.now());
  const due = !!firstSeen && now - firstSeen >= DAY && n.askedOn === null && !n.all && !s.blocked && !s.unsupported;
  if (!due) return null;

  return (
    <View style={[styles.ask, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="ui" medium>
          Want a nudge when your edition is ready?
        </Text>
        <Text variant="meta" color="muted">
          One notification at 6:00. Nothing else unless you turn it on.
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => s.setAll(true)} style={[styles.button, { backgroundColor: colors.ink }]}>
          <Text variant="ui" medium style={{ fontSize: 14, color: colors.bg }}>
            Turn on
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => s.set({ askedOn: Date.now() })} style={styles.button}>
          <Text variant="ui" color="muted" style={{ fontSize: 14 }}>
            Not now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ask: { marginBottom: 12, padding: 14, gap: 12, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  button: { height: 44, paddingHorizontal: 16, justifyContent: 'center' },
});
