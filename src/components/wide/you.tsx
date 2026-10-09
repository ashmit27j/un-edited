import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { AccessibilityPreview, ColourModes, useAccessibilitySections } from '@/components/accessibility';
import { DAYS, TIMES, useNotificationSettings } from '@/components/notification-settings';
import { SignOutPrompt } from '@/components/sign-out';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { TwoColumn, WidePage, WideSectionTitle } from '@/components/wide/page';
import { Fonts } from '@/constants/theme';
import type { LanguageCode } from '@/data/sample';
import { useT } from '@/lib/i18n';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const SECTIONS = [
  { id: 'reading', label: 'Reading' },
  { id: 'news', label: 'Your news' },
  { id: 'language', label: 'Language' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'front', label: 'Front page' },
  { id: 'access', label: 'Accessibility' },
  { id: 'storage', label: 'Storage' },
  { id: 'about', label: 'About' },
] as const;

const SIZES = ['Small', 'Medium', 'Large', 'Extra large', 'Huge'];
const SPACING = [
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'loose', label: 'Loose' },
] as const;
const LANGS: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
];

/** Jump to a settings section. Web only: nativeID becomes the element id. */
function jump(id: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(`you-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** You on web at 768px and wider (WebYou): account and section links on the left, settings on the right. */
export function WideYou({ onClearDownloads }: { onClearDownloads: () => void }) {
  const { colors, preference, setPreference } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { status, email } = useSession();
  const { prefs, setPrefs, downloaded, resetAll } = useReader();
  const [asking, setAsking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const a11y = useAccessibilitySections();
  const notify = useNotificationSettings();
  const t = useT();

  const signedIn = status === 'signedIn';
  const toggleLang = (code: LanguageCode) => {
    const on = prefs.sourceLanguages.includes(code);
    if (on && prefs.sourceLanguages.length === 1) return toast.show('At least one language stays on.');
    setPrefs({ sourceLanguages: on ? prefs.sourceLanguages.filter((c) => c !== code) : [...prefs.sourceLanguages, code] });
  };
  const front = (key: keyof typeof prefs.front) => ({
    on: prefs.front[key],
    onChange: (v: boolean) => setPrefs({ front: { ...prefs.front, [key]: v } }),
  });

  const side = (
    <View style={{ gap: 22 }}>
      <Text variant="display" accessibilityRole="header" style={{ fontSize: 48, lineHeight: 52, letterSpacing: -0.6 }}>
        You
      </Text>
      <View style={[styles.account, { borderTopColor: colors.ink, borderBottomColor: colors.rule }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
          <Text style={{ fontFamily: Fonts.wordmark, fontSize: 18, lineHeight: 22, color: colors.accent }}>
            {signedIn ? (email?.[0] ?? 'Y').toUpperCase() : 'G'}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="ui" medium numberOfLines={1}>
            {signedIn ? (email ?? 'Signed in') : 'Reading as a guest'}
          </Text>
          <Text variant="meta" color="muted">
            {signedIn ? 'Library and settings sync' : 'Settings stay on this browser'}
          </Text>
        </View>
      </View>
      {!signedIn ? <Button label="Sign in" onPress={() => router.push('/sign-in')} /> : null}
      <View accessibilityRole="menu">
        {SECTIONS.map((s) => (
          <Pressable key={s.id} accessibilityRole="link" onPress={() => jump(s.id)} style={styles.navLink}>
            <Text variant="ui" style={{ fontSize: 14.5 }}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <WidePage>
      <TwoColumn side={side} gap={64}>
        <View style={{ gap: 40 }}>
          <Section id="reading" title={t('you.reading')}>
            <SegRow
              label="Font"
              value={prefs.readFont}
              onChange={(readFont) => setPrefs({ readFont })}
              options={[
                { value: 'serif', label: 'Serif' },
                { value: 'sans', label: 'Sans' },
              ]}
            />
            <SegRow
              label="Text size"
              value={String(prefs.textSize)}
              onChange={(v) => setPrefs({ textSize: Number(v) })}
              options={SIZES.map((label, i) => ({ value: String(i), label }))}
            />
            <SegRow
              label="Line spacing"
              value={prefs.lineSpacing}
              onChange={(lineSpacing) => setPrefs({ lineSpacing })}
              options={[...SPACING]}
            />
            <SegRow
              label="Theme"
              value={preference}
              onChange={setPreference}
              options={[
                { value: 'paper', label: 'Light' },
                { value: 'ink', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
            <SegRow
              label="Home view"
              value={prefs.homeView}
              onChange={(homeView) => setPrefs({ homeView })}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'focused', label: 'Focused' },
              ]}
            />
            <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
              <Text variant="body" style={{ fontSize: 19, lineHeight: 29 }}>
                Preview: The city water board on Monday approved a six-month pilot that will move three wards to round-the-clock water.
              </Text>
            </View>
          </Section>

          <Section id="news" title="Your news">
            <LinkRow label="Who you trust" value={`${prefs.sources.length} sources`} action="Edit" onPress={() => router.push('/manage')} />
            <LinkRow label="Topics" value={String(prefs.topics.length)} action="Edit" onPress={() => router.push('/manage')} />
            <LinkRow label="Places" value={String(prefs.regions.length)} action="Edit" onPress={() => router.push('/manage')} />
          </Section>

          <Section id="language" title="Language">
            <SegRow
              label="App language"
              desc={
                prefs.appLanguage === 'en'
                  ? 'Menus, buttons and settings. Stories stay in the language they were published in.'
                  : 'Draft: only the main menus and buttons are translated so far, pending a native speaker’s review.'
              }
              value={prefs.appLanguage}
              onChange={(appLanguage) => setPrefs({ appLanguage })}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'हिंदी' },
                { value: 'mr', label: 'मराठी' },
              ]}
            />
            {LANGS.map((l) => (
              <SwitchRow
                key={l.code}
                label={`${l.label} sources`}
                desc={`Show outlets that publish in ${l.code === 'en' ? 'English' : l.code === 'hi' ? 'Hindi' : 'Marathi'}.`}
                on={prefs.sourceLanguages.includes(l.code)}
                onChange={() => toggleLang(l.code)}
              />
            ))}
            <SegRow
              label="Hindi and Marathi font"
              desc="Tiro Devanagari (serif) or Mukta (sans). Match Font follows your Serif or Sans choice."
              value={prefs.devanagariFont}
              onChange={(devanagariFont) => setPrefs({ devanagariFont })}
              options={[
                { value: 'match', label: 'Match Font' },
                { value: 'serif', label: 'Serif' },
                { value: 'sans', label: 'Sans' },
              ]}
            />
          </Section>

          <Section id="notifications" title={t('you.notifications')}>
            <SwitchRow
              label="Allow notifications"
              desc={
                notify.blocked
                  ? 'Blocked in your browser’s settings. Allow notifications for this site there first.'
                  : 'Your browser asks once. On iPhone, add Un:edited to your Home Screen first.'
              }
              on={notify.n.all}
              onChange={notify.setAll}
            />
            {notify.n.all ? (
              <>
                <SwitchRow
                  label="Morning Edition is ready"
                  desc="One notification a day, never with a headline. The edition is printed at 6:00 AM IST."
                  on={notify.n.edition}
                  onChange={(edition) => notify.set({ edition })}
                />
                <SegRow
                  label="When"
                  desc="An edition can’t arrive before it is printed, so 6:00 AM is the earliest."
                  value={notify.n.time}
                  onChange={(time) => notify.set({ time })}
                  options={TIMES}
                />
                <ChipRow
                  label="Days"
                  desc={notify.daysNote}
                  items={DAYS.map((d) => ({ value: d.short, label: d.short, a11y: d.full }))}
                  on={notify.n.days}
                  toggle={(v) => notify.toggleIn('days', v)}
                />
                <SwitchRow label="Sound" desc="Plays your system’s notification sound." on={notify.n.sound} onChange={(sound) => notify.set({ sound })} />
                <SwitchRow
                  label="Quiet hours, 10:00 PM to 7:00 AM"
                  desc="Notifications wait until quiet hours end. Nothing is lost."
                  on={notify.n.quiet}
                  onChange={(quiet) => notify.set({ quiet })}
                />
                {notify.guest ? (
                  <LinkRow label="Big stories and alerts" desc="Guests get the edition notification only. Sign in for the rest." />
                ) : (
                  <>
                    <SwitchRow
                      label="Big stories"
                      desc="Off by default. Only when at least 5 of your sources (or 60%, whichever is lower) cover the same story within 6 hours. Once per story."
                      on={notify.n.big}
                      onChange={(big) => notify.set({ big })}
                    />
                    <SwitchRow
                      label="Papers & Reports"
                      desc="A Sunday note when your sources linked new research or official reports."
                      on={notify.n.papers}
                      onChange={(papers) => notify.set({ papers })}
                    />
                    <SwitchRow
                      label="Downloads finished"
                      desc="When a folder you downloaded is ready to read offline."
                      on={notify.n.folder}
                      onChange={(folder) => notify.set({ folder })}
                    />
                    <SwitchRow
                      label="Topic and source alerts"
                      desc="Off by default. Only the topics and outlets you tick, shown with the publisher’s own headline."
                      on={notify.n.alerts}
                      onChange={(alerts) => notify.set({ alerts })}
                    />
                    {notify.n.alerts ? (
                      <>
                        <ChipRow
                          label="Topics"
                          items={notify.topics.map((x) => ({ value: x, label: x }))}
                          on={notify.n.alertTopics}
                          toggle={(v) => notify.toggleIn('alertTopics', v)}
                        />
                        <ChipRow
                          label="Outlets"
                          items={notify.outlets.map((o) => ({ value: o.id, label: o.name }))}
                          on={notify.n.alertSources}
                          toggle={(v) => notify.toggleIn('alertSources', v)}
                        />
                        <SegRow
                          label="At most per day"
                          desc="Big story, topic and source alerts together. The edition and downloads don’t count."
                          value={String(notify.n.cap)}
                          onChange={(v) => notify.set({ cap: Number(v) as 1 | 3 | 5 })}
                          options={['1', '3', '5'].map((v) => ({ value: v, label: v }))}
                        />
                      </>
                    ) : null}
                  </>
                )}
              </>
            ) : null}
          </Section>

          <Section id="front" title="Front page">
            <SwitchRow label="Trending" desc="Stories the most of your outlets are covering." {...front('trending')} />
            <SwitchRow label="Papers & Reports" desc="Research and official documents." {...front('papers')} />
            <SwitchRow label="Outside your sources" desc="A few stories from outlets you haven’t chosen." {...front('outside')} />
            <SwitchRow label="Continue reading" desc="Articles you started." {...front('continueReading')} />
          </Section>

          {a11y.map((section, n) => (
            <Section key={section.id} id={n === 0 ? 'access' : `access-${section.id}`} title={`Accessibility · ${section.title}`}>
              {n === 0 ? <AccessibilityPreview /> : null}
              {section.rows.map((row) =>
                row.kind === 'seg' ? (
                  <SegRow key={row.key} label={row.label} desc={row.desc} value={row.value} onChange={row.set} options={row.options} />
                ) : row.kind === 'switch' ? (
                  <SwitchRow
                    key={row.key}
                    label={row.label}
                    desc={row.locked ? `${row.desc} On with Black and white only.` : row.desc}
                    on={row.on}
                    onChange={row.locked ? () => {} : row.set}
                  />
                ) : row.kind === 'colour' ? (
                  <ColourModes key={row.key} value={row.value} set={row.set} />
                ) : (
                  <Text key={row.key} variant="meta" color="muted" style={{ paddingVertical: 10, fontSize: 13, lineHeight: 19 }}>
                    {row.text}
                  </Text>
                ),
              )}
            </Section>
          ))}

          <Section id="storage" title="Storage">
            <SwitchRow
              label="Auto-download saved articles"
              desc={
                prefs.autoDownload
                  ? 'New saves download to this browser as you save them.'
                  : 'Off. Saving does not download. Use ⋯ › Download on a story, or a folder’s Download. Already-downloaded stories stay.'
              }
              on={prefs.autoDownload}
              onChange={(autoDownload) => setPrefs({ autoDownload })}
            />
            <LinkRow
              label="Downloaded"
              value={`${downloaded.length} ${downloaded.length === 1 ? 'article' : 'articles'}`}
              action="Open"
              onPress={() => router.push('/library')}
            />
            <Row>
              <View style={{ paddingVertical: 8, gap: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: asking }}
                  onPress={() => (downloaded.length ? setAsking(!asking) : toast.show('No downloads to clear.'))}
                  style={{ minHeight: 56, justifyContent: 'center', gap: 3 }}>
                  <Text variant="ui" color="accent">
                    Clear all downloads
                  </Text>
                  <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
                    Removes every downloaded article from this browser.
                  </Text>
                </Pressable>
                {asking ? (
                  <View accessibilityRole="alert" style={[styles.confirm, { borderColor: colors.ink }]}>
                    <Text variant="ui" style={{ fontSize: 14.5 }}>
                      Remove the {downloaded.length} downloaded articles from this browser? Your saved articles stay in your Library
                      and can be downloaded again.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          onClearDownloads();
                          setAsking(false);
                        }}
                        style={[styles.confirmButton, { backgroundColor: colors.ink }]}>
                        <Text variant="ui" medium style={{ color: colors.bg, fontSize: 14.5 }}>
                          Clear all downloads
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setAsking(false)}
                        style={[styles.confirmButton, { borderWidth: 1, borderColor: colors.ink }]}>
                        <Text variant="ui" medium style={{ fontSize: 14.5 }}>
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            </Row>
          </Section>

          <Section id="about" title="About">
            <LinkRow
              label="Start over"
              desc="Clears your choices on this browser and replays the setup."
              action="Start"
              onPress={() => {
                resetAll();
                router.replace('/onboarding');
              }}
            />
            <LinkRow label="Sample data" desc="Stories come from made-up outlets. Live feeds are not connected yet." />
          </Section>

          <View style={styles.footer}>
            {signedIn ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSigningOut(true)}
                style={[styles.signOut, { borderColor: colors.rule }]}>
                <Text variant="ui" color="accent">
                  Sign out
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Text variant="headline" color="muted" style={{ fontSize: 14, lineHeight: 20, fontStyle: 'italic' }}>
              Un:edited 1.0 · No AI, no algorithm, no fee.
            </Text>
          </View>
        </View>
      </TwoColumn>
      <SignOutPrompt visible={signingOut} onClose={() => setSigningOut(false)} />
    </WidePage>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <View nativeID={`you-${id}`}>
      <WideSectionTitle title={title} />
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ borderBottomWidth: 1, borderBottomColor: colors.rule }}>{children}</View>;
}

const DEVANAGARI = /[ऀ-ॿ]/;

function Label({ label, desc }: { label: string; desc?: string }) {
  return (
    <View style={{ gap: 3, flexShrink: 1 }}>
      <Text variant="ui" lang={DEVANAGARI.test(label) ? 'hi' : undefined}>
        {label}
      </Text>
      {desc ? (
        <Text variant="meta" color="muted" style={{ fontSize: 13, lineHeight: 18 }}>
          {desc}
        </Text>
      ) : null}
    </View>
  );
}

function SegRow<T extends string>({
  label,
  desc,
  value,
  onChange,
  options,
}: {
  label: string;
  desc?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const { colors } = useTheme();
  return (
    <Row>
      <View style={styles.segRow}>
        <Label label={label} desc={desc} />
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.seg, { borderColor: colors.rule }]}>
          {options.map((o) => {
            const on = o.value === value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => onChange(o.value)}
                style={[styles.segOption, { backgroundColor: on ? colors.ink : 'transparent' }]}>
                <Text variant="ui" medium={on} style={{ fontSize: 14, color: on ? colors.bg : colors.ink }}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Row>
  );
}

function ChipRow({
  label,
  desc,
  items,
  on,
  toggle,
}: {
  label: string;
  desc?: string;
  items: { value: string; label: string; a11y?: string }[];
  on: string[];
  toggle: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Row>
      <View style={{ paddingVertical: 12, gap: 10 }}>
        <Label label={label} desc={desc} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map((it) => {
            const sel = on.includes(it.value);
            return (
              <Pressable
                key={it.value}
                accessibilityRole="checkbox"
                accessibilityLabel={it.a11y ?? it.label}
                accessibilityState={{ checked: sel }}
                onPress={() => toggle(it.value)}
                style={[styles.chip, { borderColor: sel ? colors.ink : colors.rule, backgroundColor: sel ? colors.ink : 'transparent' }]}>
                <Text variant="ui" medium={sel} style={{ fontSize: 14, color: sel ? colors.bg : colors.ink }}>
                  {it.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Row>
  );
}

/** The web switch: ink track when on, outlined when off (WebYou). */
function SwitchRow({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <Row>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: on }}
        onPress={() => onChange(!on)}
        style={styles.switchRow}>
        <Label label={label} desc={desc} />
        <View style={[styles.track, { backgroundColor: on ? colors.ink : 'transparent', borderColor: on ? colors.ink : colors.muted }]}>
          <View style={[styles.knob, { left: on ? 21 : 3, backgroundColor: on ? colors.bg : colors.muted }]} />
        </View>
      </Pressable>
    </Row>
  );
}

function LinkRow({ label, desc, value, action, onPress }: { label: string; desc?: string; value?: string; action?: string; onPress?: () => void }) {
  const body = (
    <View style={styles.linkRow}>
      <Label label={label} desc={desc} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {value ? (
          <Text variant="ui" color="muted" style={{ fontSize: 14 }}>
            {value}
          </Text>
        ) : null}
        {action ? (
          <Text variant="ui" medium style={{ fontSize: 14 }}>
            {action}
          </Text>
        ) : null}
      </View>
    </View>
  );
  return (
    <Row>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${action ?? ''}`} onPress={onPress}>
          {body}
        </Pressable>
      ) : (
        body
      )}
    </Row>
  );
}

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  navLink: { height: 40, justifyContent: 'center' },
  preview: { marginTop: 16, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1 },
  segRow: {
    minHeight: 64,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 24,
    rowGap: 10,
  },
  seg: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1 },
  segOption: { height: 40, minWidth: 76, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  switchRow: { minHeight: 60, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 },
  track: { width: 44, height: 26, borderRadius: 13, borderWidth: 1.5, flexShrink: 0 },
  knob: { position: 'absolute', top: 3, width: 17, height: 17, borderRadius: 9 },
  linkRow: { minHeight: 56, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 },
  confirm: { maxWidth: 460, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, gap: 12 },
  confirmButton: { height: 44, paddingHorizontal: 18, justifyContent: 'center' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  chip: { height: 40, minWidth: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  signOut: { height: 46, paddingHorizontal: 22, borderWidth: 1, justifyContent: 'center' },
});
