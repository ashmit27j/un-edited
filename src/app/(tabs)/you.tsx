import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Sheet } from '@/components/sheet';
import { TEXT_SCALES, Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Rule, Screen, Segmented, SectionHeader, SettingRow } from '@/components/ui';
import type { LanguageCode } from '@/data/sample';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const SIZE_LABELS = ['S', 'M', 'L', 'XL', 'XXL'];
const LANGS: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
];

export default function You() {
  const { colors, preference, setPreference } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { status, email, signOut } = useSession();
  const { prefs, setPrefs, downloaded, clearDownloads, resetAll } = useReader();
  const [confirmClear, setConfirmClear] = useState(false);

  const toggleLang = (code: LanguageCode) => {
    const on = prefs.sourceLanguages.includes(code);
    if (on && prefs.sourceLanguages.length === 1) return toast.show('At least one language stays on.');
    setPrefs({ sourceLanguages: on ? prefs.sourceLanguages.filter((c) => c !== code) : [...prefs.sourceLanguages, code] });
  };

  return (
    <Screen maxWidth={720}>
      <Text variant="display">You</Text>

      <View style={[styles.card, { borderColor: colors.rule, backgroundColor: colors.surface }]}>
        {status === 'signedIn' ? (
          <>
            <Text variant="headline" style={{ fontSize: 19 }} numberOfLines={1}>
              {email ?? 'Signed in'}
            </Text>
            <Text variant="meta" color="muted">
              Signed in · your library and settings sync
            </Text>
          </>
        ) : (
          <>
            <Text variant="headline" style={{ fontSize: 19 }}>
              Reading as a guest
            </Text>
            <Text variant="meta" color="muted">
              Sign in to save stories into folders and keep your settings on every device.
            </Text>
            <Button label="Sign in" onPress={() => router.push('/sign-in')} />
          </>
        )}
      </View>

      <SectionHeader title="Reading" />
      <Text variant="meta" color="muted" style={styles.label}>
        Theme
      </Text>
      <Segmented
        value={preference}
        onChange={setPreference}
        options={[
          { value: 'system', label: 'System' },
          { value: 'paper', label: 'Paper' },
          { value: 'ink', label: 'Ink' },
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
      <Text variant="meta" color="muted" style={styles.label}>
        Text size
      </Text>
      <Segmented
        value={String(prefs.textSize)}
        onChange={(v) => setPrefs({ textSize: Number(v) })}
        options={SIZE_LABELS.map((label, i) => ({ value: String(i), label }))}
      />
      <View style={[styles.preview, { borderColor: colors.rule, backgroundColor: colors.surface }]}>
        <Text variant="label" color="muted">
          Preview · {Math.round(TEXT_SCALES[prefs.textSize] * 100)}%
        </Text>
        <Text variant="headline">Water board clears a 24-hour supply pilot for three wards</Text>
        <Text variant="body" color="muted">
          Meters will be installed before the switch.
        </Text>
      </View>

      <SectionHeader title="Your news" />
      <SettingRow
        label="Topics and sources"
        desc={`${prefs.topics.length} topics · ${prefs.sources.length} sources`}
        onPress={() => router.push('/manage')}
      />

      <SectionHeader title="Language" />
      <SettingRow label="App language" desc="Menus are in English for now. हिंदी and मराठी menus are not ready yet." value="English" />
      <Text variant="meta" color="muted" style={styles.label}>
        Source languages
      </Text>
      {LANGS.map((l) => (
        <SettingRow
          key={l.code}
          label={l.label}
          on={prefs.sourceLanguages.includes(l.code)}
          onChange={() => toggleLang(l.code)}
        />
      ))}
      <Text variant="meta" color="muted" style={styles.label}>
        Hindi and Marathi reading font
      </Text>
      <Segmented
        value={prefs.devanagariFont}
        onChange={(devanagariFont) => setPrefs({ devanagariFont })}
        options={[
          { value: 'match', label: 'Match font' },
          { value: 'serif', label: 'Serif' },
          { value: 'sans', label: 'Sans' },
        ]}
      />

      <SectionHeader title="Notifications" />
      <SettingRow label="Tell me when my edition is ready" desc="One a day, from 6:00 AM IST. Not switched on yet." value="Soon" />

      <SectionHeader title="Front page" />
      <SettingRow label="Papers & Reports" on={prefs.front.papers} onChange={(v) => setPrefs({ front: { ...prefs.front, papers: v } })} />
      <SettingRow label="Outside your sources" on={prefs.front.outside} onChange={(v) => setPrefs({ front: { ...prefs.front, outside: v } })} />
      <SettingRow label="Continue reading" on={prefs.front.continueReading} onChange={(v) => setPrefs({ front: { ...prefs.front, continueReading: v } })} />
      <SettingRow label="Trending" desc="Most covered across your sources" on={prefs.front.trending} onChange={(v) => setPrefs({ front: { ...prefs.front, trending: v } })} />

      <SectionHeader title="Storage" />
      <SettingRow
        label="Auto-download saved articles"
        desc="Off: saving never downloads. On: every new save downloads too."
        on={prefs.autoDownload}
        onChange={(autoDownload) => setPrefs({ autoDownload })}
      />
      <SettingRow
        label="Clear all downloads"
        desc={`${downloaded.length} downloaded`}
        onPress={() => (downloaded.length ? setConfirmClear(true) : toast.show('No downloads to clear.'))}
      />

      <SectionHeader title="Accessibility" />
      <SettingRow label="Reduce motion" desc="Stamps and animations appear in place." on={prefs.reduceMotion} onChange={(reduceMotion) => setPrefs({ reduceMotion })} />

      <SectionHeader title="About" />
      <SettingRow
        label="Start over"
        desc="Clears your choices on this device and replays the setup."
        onPress={() => {
          resetAll();
          router.replace('/onboarding');
        }}
      />
      <View style={{ paddingVertical: 20, gap: 4 }}>
        <Text variant="meta" color="muted">
          Un:edited 1.0 · No AI, no algorithm, no fee.
        </Text>
        <Text variant="meta" color="muted">
          Sample stories from made-up outlets. Live feeds are not connected yet.
        </Text>
      </View>
      <Rule />
      <View style={{ height: 16 }} />
      {status === 'signedIn' ? (
        <Button
          label="Sign out"
          kind="secondary"
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
        />
      ) : null}

      <Sheet visible={confirmClear} title="Clear all downloads" onClose={() => setConfirmClear(false)}>
        <Text variant="body" style={{ marginBottom: 16 }}>
          Remove the {downloaded.length} downloaded articles from this device? Your saved articles stay in your Library and can be downloaded again.
        </Text>
        <Button
          label="Clear all downloads"
          onPress={() => {
            clearDownloads();
            setConfirmClear(false);
            toast.show('Downloads cleared');
          }}
        />
        <Button label="Cancel" kind="link" onPress={() => setConfirmClear(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 18, gap: 8, borderWidth: StyleSheet.hairlineWidth },
  label: { marginTop: 16, marginBottom: 6 },
  preview: { marginTop: 16, padding: 18, gap: 6, borderWidth: StyleSheet.hairlineWidth },
});
