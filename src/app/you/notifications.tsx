import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DAYS, TIMES, useNotificationSettings } from '@/components/notification-settings';
import { Text } from '@/components/text';
import { BackHeader, Chip, Screen, Segmented, SettingRow } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { useTarget } from '@/hooks/use-a11y';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';

/** You › Notifications (Notifications board: 10-09 settings combined with Pass 6). */
export default function NotificationsScreen() {
  const { colors, name } = useTheme();
  const t = useT();
  const target = useTarget();
  const s = useNotificationSettings();
  const { n } = s;
  const dim = s.blocked ? 0.45 : 1;

  return (
    <Screen maxWidth={720} header={<BackHeader title="You" />}>
      <Text variant="display" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.4 }}>
        {t('you.notifications')}
      </Text>
      <Text variant="meta" color="muted" style={{ fontSize: 13, marginTop: 6 }}>
        Never ads, never “you might like”. Nothing is picked for you.
      </Text>

      {s.blocked ? (
        <View accessibilityRole="alert" style={[styles.blocked, { borderColor: colors.ink }]}>
          <Text variant="ui" style={{ fontSize: 14, lineHeight: 20 }}>
            Notifications are turned off for Un:edited in your {s.web ? 'browser' : 'phone'} settings, so nothing below will reach
            you yet.
          </Text>
          <Pressable accessibilityRole="link" onPress={s.openSettings} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
            <Text variant="ui" medium color="accent" style={{ fontSize: 14, textDecorationLine: 'underline' }}>
              Open {s.web ? 'browser' : 'phone'} settings
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* What it will look like: plain text, never a headline. */}
      <View accessibilityLabel="Preview of the notification" style={[styles.preview, { backgroundColor: colors.surface, borderColor: name === 'ink' ? '#4A443C' : '#C2B6A2' }]}>
        <View style={[styles.icon, { backgroundColor: name === 'ink' ? '#1C1A17' : colors.surface, borderColor: colors.rule }]}>
          <Text numberOfLines={1} style={{ fontFamily: Fonts.wordmark, fontSize: 25, lineHeight: 30, width: 48, color: colors.accent }}>
            Un
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="label" color="muted">
              Un:edited
            </Text>
            <Text variant="label" color="muted">
              {s.shownTime}
            </Text>
          </View>
          <Text variant="headline" style={{ fontSize: 17, lineHeight: 22 }}>
            {s.headline}
          </Text>
          <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
            Tap to read today’s stories from the outlets you chose.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: colors.ink }}>
        <SettingRow
          label="Allow notifications"
          desc={`Your ${s.web ? 'browser' : 'phone'} asks once. You can change it here or in your ${s.web ? 'browser' : 'phone'}’s settings.`}
          on={n.all}
          onChange={s.setAll}
        />
      </View>

      {!n.all ? (
        <View style={[styles.off, { borderColor: colors.rule }]}>
          <Text variant="headline" style={{ fontSize: 20, lineHeight: 25 }}>
            Notifications are off.
          </Text>
          <Text variant="ui" color="muted" style={{ fontSize: 13.5, lineHeight: 20 }}>
            Your edition is still printed at 6:00 every morning. Open the app whenever you like.
          </Text>
        </View>
      ) : (
        <View style={{ opacity: dim }}>
          <Section title="New edition">
            <SettingRow
              label="Tell me when my edition is ready"
              desc="One notification a day. The edition is printed at 6:00 AM IST."
              on={n.edition}
              onChange={(edition) => s.set({ edition })}
            />
            {n.edition ? (
              <>
                <Block label="When" note="An edition can’t arrive before it is printed, so 6:00 AM is the earliest.">
                  <View style={styles.grid3}>
                    {TIMES.map((o) => {
                      const on = o.value === n.time;
                      return (
                        <Pressable
                          key={o.value}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on }}
                          onPress={() => s.set({ time: o.value })}
                          style={[styles.time, { minHeight: target, backgroundColor: on ? colors.ink : 'transparent', borderColor: colors.rule }]}>
                          <Text variant="ui" medium={on} style={{ fontSize: 14, color: on ? colors.bg : colors.ink }}>
                            {o.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Block>
                <Block label="Days" note={s.daysNote}>
                  <View style={styles.days}>
                    {DAYS.map((d) => {
                      const on = n.days.includes(d.short);
                      return (
                        <Pressable
                          key={d.short}
                          accessibilityRole="checkbox"
                          accessibilityLabel={d.full}
                          accessibilityState={{ checked: on }}
                          onPress={() => s.toggleIn('days', d.short)}
                          style={[styles.day, { minHeight: target, borderColor: on ? colors.ink : colors.rule, backgroundColor: on ? colors.ink : 'transparent' }]}>
                          <Text variant="ui" medium={on} style={{ fontSize: 13.5, color: on ? colors.bg : colors.ink }}>
                            {d.short}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Block>
              </>
            ) : null}
          </Section>

          <Section title="Sound and quiet hours">
            <SettingRow label="Sound" desc={`Plays the ${s.web ? 'system' : 'phone'}’s default notification sound.`} on={n.sound} onChange={(sound) => s.set({ sound })} />
            {s.web ? null : (
              <SettingRow label="Vibration" desc="A short buzz when the edition arrives." on={n.vibrate} onChange={(vibrate) => s.set({ vibrate })} />
            )}
            <SettingRow label="Quiet hours" desc="Hold notifications overnight." on={n.quiet} onChange={(quiet) => s.set({ quiet })} />
            {n.quiet ? (
              <View style={{ paddingVertical: 12, gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Field label="From" value="10:00 PM" />
                  <Field label="Until" value="7:00 AM" />
                </View>
                <Text variant="meta" color="muted">
                  An edition due inside quiet hours arrives when they end. Nothing is lost.
                </Text>
              </View>
            ) : null}
          </Section>

          {s.guest ? (
            <Text variant="meta" color="muted" style={{ marginTop: 26, lineHeight: 19 }}>
              Guests get the edition notification only, kept on this {s.web ? 'browser' : 'phone'}. Sign in for Big stories and alerts.
            </Text>
          ) : (
            <>
              <Section title="During the day">
                <SettingRow
                  label="Big stories"
                  desc="Off by default. Only when at least 5 of your sources (or 60%, whichever is lower) cover the same story within 6 hours. Once per story."
                  on={n.big}
                  onChange={(big) => s.set({ big })}
                />
                <SettingRow
                  label="Papers & Reports"
                  desc="A Sunday note when your sources linked new research or official reports."
                  on={n.papers}
                  onChange={(papers) => s.set({ papers })}
                />
                <SettingRow
                  label="Downloads finished"
                  desc="When a folder you downloaded is ready to read offline."
                  on={n.folder}
                  onChange={(folder) => s.set({ folder })}
                />
              </Section>

              <Section title="Topic and source alerts">
                <SettingRow
                  label="Alert me between editions"
                  desc="Off by default. Only the topics and outlets you tick below, shown with the publisher’s own headline. Nothing is picked for you."
                  on={n.alerts}
                  onChange={(alerts) => s.set({ alerts })}
                />
                {n.alerts ? (
                  <>
                    <Block label="Topics">
                      <View style={styles.chips}>
                        {s.topics.map((topic) => (
                          <Chip key={topic} label={topic} on={n.alertTopics.includes(topic)} onPress={() => s.toggleIn('alertTopics', topic)} />
                        ))}
                      </View>
                    </Block>
                    <Block label="Outlets">
                      <View style={styles.chips}>
                        {s.outlets.map((o) => (
                          <Chip key={o.id} label={o.name} on={n.alertSources.includes(o.id)} onPress={() => s.toggleIn('alertSources', o.id)} />
                        ))}
                      </View>
                    </Block>
                    <Block
                      label="At most per day"
                      note="Counts topic, source and Big story alerts together. Alerts follow your sound and quiet-hour choices above. The edition and Downloads finished never count towards this number.">
                      <Segmented
                        value={String(n.cap)}
                        onChange={(v) => s.set({ cap: Number(v) as 1 | 3 | 5 })}
                        options={['1', '3', '5'].map((v) => ({ value: v, label: v }))}
                      />
                    </Block>
                  </>
                ) : null}
              </Section>
            </>
          )}
        </View>
      )}

      <Text variant="meta" color="muted" style={{ marginTop: 22, lineHeight: 19 }}>
        On iPhone, notifications only work once Un:edited is on your Home Screen (Share, then Add to Home Screen). In a browser tab
        they aren’t available. On Android and desktop browsers, allow notifications when asked.
      </Text>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 26 }}>
      <View style={{ paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.ink }}>
        <Text variant="label" medium accessibilityRole="header">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Block({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.rule }}>
      <Text variant="ui">{label}</Text>
      {children}
      {note ? (
        <Text variant="meta" color="muted">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text variant="meta" color="muted">
        {label}
      </Text>
      <View style={[styles.field, { borderColor: colors.ink }]}>
        <Text variant="ui">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blocked: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 8, borderWidth: 1 },
  preview: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1 },
  icon: { width: 36, height: 36, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', paddingLeft: 4 },
  off: { marginTop: 22, padding: 16, gap: 10, borderWidth: 1 },
  grid3: { flexDirection: 'row', flexWrap: 'wrap' },
  time: { width: '33.333%', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  days: { flexDirection: 'row', gap: 4 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { height: 44, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
});
