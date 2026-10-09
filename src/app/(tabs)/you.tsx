import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ChevronIcon } from '@/components/icons';
import { SignOutPrompt } from '@/components/sign-out';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Screen, SettingRow } from '@/components/ui';
import { WideYou } from '@/components/wide/you';
import { Fonts } from '@/constants/theme';
import { SOURCES, type LanguageCode } from '@/data/sample';
import { useTarget } from '@/hooks/use-a11y';
import { useLayout } from '@/hooks/use-layout';
import { useT } from '@/lib/i18n';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const SIZE_NAMES = ['Small', 'Medium', 'Large', 'Extra large', 'Huge'];
const LANG_NAMES: Record<LanguageCode, string> = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };
const FONT_NAMES = { match: 'Match Font', serif: 'Serif', sans: 'Sans' };

/** You (You board): account, then rows that open each settings screen. Web 768px+ uses WideYou. */
export default function You() {
  const { colors, preference } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const { status, email } = useSession();
  const { prefs, setPrefs, downloaded, clearDownloads, resetAll } = useReader();
  const [asking, setAsking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const layout = useLayout();
  const signedIn = status === 'signedIn';

  const cleared = () => {
    clearDownloads();
    setAsking(false);
    toast.show('Downloads cleared');
  };

  if (layout !== 'phone') return <WideYou onClearDownloads={cleared} />;

  const n = prefs.notify;
  const front = (key: keyof typeof prefs.front) => ({
    on: prefs.front[key],
    onChange: (v: boolean) => setPrefs({ front: { ...prefs.front, [key]: v } }),
  });

  return (
    <Screen maxWidth={720}>
      <Text variant="display" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.4 }}>
        {t('nav.you')}
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
            {signedIn ? 'Signed in · synced' : `Settings stay on this ${Platform.OS === 'web' ? 'browser' : 'phone'}`}
          </Text>
        </View>
      </View>
      {!signedIn ? (
        <View style={{ marginTop: 12 }}>
          <Text variant="meta" color="muted" style={{ marginBottom: 8 }}>
            Sign in to save stories into folders and keep your settings on every device.
          </Text>
          <Button label="Sign in" onPress={() => router.push('/sign-in')} />
        </View>
      ) : null}

      <Section title={t('you.reading')}>
        <LinkRow label="Font" value={prefs.readFont === 'sans' ? 'Sans' : 'Serif'} href="/you/reading" />
        <LinkRow label={t('you.textSize')} value={SIZE_NAMES[prefs.textSize]} href="/you/accessibility" />
        <LinkRow label={t('you.theme')} value={preference === 'system' ? 'System' : preference === 'ink' ? 'Dark' : 'Light'} href="/you/reading" />
        <LinkRow label="Home view" value={prefs.homeView === 'focused' ? 'Focused' : 'Comfortable'} href="/you/reading" />
        <LinkRow label={t('you.accessibility')} value="Colour, vision, reading" href="/you/accessibility" />
      </Section>

      <Section title="Your news">
        <LinkRow label="Who you trust" value={`${prefs.sources.length} sources`} href="/manage" />
        <LinkRow label="Topics" value={String(prefs.topics.length)} href="/manage" />
        <LinkRow label="Places" value={String(prefs.regions.length)} href="/manage" />
      </Section>

      <Section title="Language">
        <LinkRow label="App language" value={LANG_NAMES[prefs.appLanguage]} href="/you/language" />
        <LinkRow label="Source languages" value={prefs.sourceLanguages.map((l) => LANG_NAMES[l]).join(', ')} href="/you/language" />
        <LinkRow label="Hindi and Marathi font" value={FONT_NAMES[prefs.devanagariFont]} href="/you/language" />
      </Section>

      <Section title={t('you.notifications')}>
        <LinkRow
          label="New edition"
          value={n.all && n.edition ? `${n.time} AM · ${n.days.length === 7 ? 'every day' : `${n.days.length} days`}` : 'Off'}
          href="/you/notifications"
        />
        <LinkRow
          label="Topic and source alerts"
          value={n.all && n.alerts ? `${n.alertTopics.length + n.alertSources.length} picked` : 'Off'}
          href="/you/notifications"
        />
      </Section>

      <Section title="Front page">
        <SettingRow label="Trending" desc="Five stories the most outlets are covering." {...front('trending')} />
        <SettingRow label="Papers & Reports" desc="Research and official documents." {...front('papers')} />
        <SettingRow label="Outside your sources" desc="A few stories from outlets you haven’t chosen." {...front('outside')} />
        <SettingRow label="Continue reading" desc="Articles you started." {...front('continueReading')} />
      </Section>

      <Section title="Storage">
        <SettingRow
          label="Auto-download saved articles"
          desc={
            prefs.autoDownload
              ? 'New saves download to this phone as you save them.'
              : 'Off. Saving does not download. Use ⋯ › Download on a story, or a folder’s Download. Already-downloaded stories stay.'
          }
          on={prefs.autoDownload}
          onChange={(autoDownload) => setPrefs({ autoDownload })}
        />
        <LinkRow label="Downloaded" value={`${downloaded.length} ${downloaded.length === 1 ? 'article' : 'articles'}`} href="/library" />
        <View style={[styles.action, { borderBottomColor: colors.rule }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: asking }}
            onPress={() => (downloaded.length ? setAsking(!asking) : toast.show('No downloads to clear.'))}
            style={{ minHeight: 56, justifyContent: 'center', gap: 3 }}>
            <Text variant="ui" color="accent">
              Clear all downloads
            </Text>
            <Text variant="meta" color="muted">
              Removes every downloaded article from this phone.
            </Text>
          </Pressable>
          {asking ? (
            <View accessibilityRole="alert" style={[styles.confirm, { borderColor: colors.ink }]}>
              <Text variant="ui" style={{ fontSize: 14.5, lineHeight: 21 }}>
                Remove the {downloaded.length} downloaded articles from this phone? Your saved articles stay in your Library and can
                be downloaded again.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable accessibilityRole="button" onPress={cleared} style={[styles.confirmButton, { backgroundColor: colors.ink }]}>
                  <Text variant="ui" medium style={{ color: colors.bg, fontSize: 14.5 }}>
                    Clear all downloads
                  </Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setAsking(false)} style={[styles.confirmButton, { borderWidth: 1, borderColor: colors.ink }]}>
                  <Text variant="ui" medium style={{ fontSize: 14.5 }}>
                    {t('common.cancel')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Section>

      <Section title="About">
        <LinkRow label="Replay the tour" href="/tour" />
        <LinkRow label="Full source list" value={`${SOURCES.length} outlets`} href="/manage" />
        <SettingRow
          label="Start over"
          desc="Clears your choices on this phone and replays the setup."
          onPress={() => {
            resetAll();
            router.replace('/onboarding');
          }}
        />
      </Section>

      {signedIn ? (
        <Pressable accessibilityRole="button" onPress={() => setSigningOut(true)} style={[styles.signOut, { borderColor: colors.rule }]}>
          <Text variant="ui" color="accent">
            {t('you.signOut')}
          </Text>
        </Pressable>
      ) : null}
      <Text variant="headline" color="muted" style={{ marginTop: 20, fontSize: 14, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' }}>
        Un:edited 1.0 · No AI, no algorithm, no fee.
      </Text>
      <Text variant="meta" color="muted" style={{ marginTop: 4, textAlign: 'center' }}>
        Sample stories from made-up outlets. Live feeds are not connected yet.
      </Text>

      <SignOutPrompt visible={signingOut} onClose={() => setSigningOut(false)} />
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

function LinkRow({ label, value, href }: { label: string; value?: string; href: Href }) {
  const { colors } = useTheme();
  const router = useRouter();
  const target = useTarget();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      onPress={() => router.push(href)}
      style={[styles.link, { minHeight: target + 8, borderBottomColor: colors.rule }]}>
      <Text variant="ui">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
        {value ? (
          <Text variant="meta" color="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {value}
          </Text>
        ) : null}
        <ChevronIcon size={16} color={colors.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  account: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1 },
  action: { paddingVertical: 8, gap: 10, borderBottomWidth: 1 },
  confirm: { padding: 14, gap: 12, borderWidth: 1 },
  confirmButton: { height: 44, paddingHorizontal: 16, justifyContent: 'center' },
  signOut: { marginTop: 28, height: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
