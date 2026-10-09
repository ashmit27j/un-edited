import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { BackIcon, CheckIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { Chip, Segmented, SettingRow, useGutter } from '@/components/ui';
import { WideOnboarding } from '@/components/wide/onboarding';
import { Wordmark } from '@/components/wordmark';
import { useLayout } from '@/hooks/use-layout';
import { Fonts } from '@/constants/theme';
import { REGIONS, TOPICS, type LanguageCode } from '@/data/sample';
import { useNews } from '@/data/news';
import { useReducedMotion } from '@/components/stamp';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

/** Welcome → 6 steps → "Getting your edition ready". Every choice is saved as it is made. */
const LANGUAGES: { code: LanguageCode; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिंदी', english: 'Hindi' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
];

export default function Onboarding() {
  return useLayout() === 'phone' ? <PhoneOnboarding /> : <WideOnboarding />;
}

function PhoneOnboarding() {
  const { sources: SOURCES } = useNews();
  const { colors, preference, setPreference } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  const { status } = useSession();
  const { prefs, setPrefs, finishOnboarding } = useReader();
  const [step, setStep] = useState(0); // 0 welcome, 1-6 steps, 7 printing
  const [place, setPlace] = useState('');
  const t = useT();

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const minTopics = prefs.topics.length >= 1;
  const minSources = prefs.sources.length >= 3;
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const gate: Record<number, { ok: boolean; why: string }> = {
    1: { ok: prefs.sourceLanguages.length >= 1, why: 'Pick at least one language.' },
    3: { ok: minTopics, why: 'Pick at least one topic.' },
    5: { ok: minSources, why: `Pick ${3 - prefs.sources.length} more ${3 - prefs.sources.length === 1 ? 'source' : 'sources'} (at least 3).` },
  };
  const g = gate[step];

  if (step === 7) {
    return (
      <Printing
        onDone={() => {
          finishOnboarding();
          router.replace(status === 'signedIn' ? '/home' : '/sign-in');
        }}
      />
    );
  }

  if (step === 0) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24, paddingHorizontal: gutter }]}>
        <View style={styles.column}>
          <Wordmark size={44} />
          <Text variant="display" style={{ marginTop: 24, fontSize: 36, lineHeight: 40 }}>
            Every story, as it was written.
          </Text>
          <View style={{ gap: 6, marginTop: 8, marginBottom: 24 }}>
            <Text variant="body" color="muted">No AI. Every word comes from the publisher.</Text>
            <Text variant="body" color="muted">No algorithm. Only the outlets you choose.</Text>
            <Text variant="body" color="muted">No fee. Free for everyone, always.</Text>
          </View>
          <Button label="Set up my edition" onPress={next} />
          <Button
            label="I already have an account"
            kind="link"
            onPress={() => router.push('/sign-in')}
          />
        </View>
      </ScrollView>
    );
  }

  const visibleSources = SOURCES.filter((s) => prefs.sourceLanguages.includes(s.lang) || s.journal);
  const q = place.trim().toLowerCase();
  const regionResults = REGIONS.filter((r) => !q || r.name.toLowerCase().includes(q));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={[styles.bar, { paddingHorizontal: gutter - 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={styles.barBtn}>
          <BackIcon color={colors.ink} />
        </Pressable>
        <Text variant="label" color="muted" style={{ flex: 1, textAlign: 'center' }}>
          Step {step} of 6
        </Text>
        <Pressable accessibilityRole="button" onPress={next} style={[styles.barBtn, { width: 64 }]}>
          <Text variant="ui" color="muted">{t('common.skip')}</Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 24 }}>
        <View style={styles.column}>
          {step === 1 ? (
            <>
              <Text variant="display">Which languages do you read?</Text>
              <Text variant="body" color="muted" style={styles.sub}>
                Pick one or more. Your sources will come from these languages.
              </Text>
              {LANGUAGES.map((l) => {
                const on = prefs.sourceLanguages.includes(l.code);
                return (
                  <Pressable
                    key={l.code}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => setPrefs({ sourceLanguages: toggle(prefs.sourceLanguages, l.code) })}
                    style={[styles.choice, { borderColor: on ? colors.ink : colors.rule, backgroundColor: colors.surface }]}>
                    <Text variant="headline" lang={l.code !== 'en' ? l.code : undefined} style={{ flex: 1 }}>
                      {l.native}
                    </Text>
                    <Text variant="meta" color="muted">{l.english}</Text>
                    {on ? <CheckIcon color={colors.accent} /> : <View style={{ width: 22 }} />}
                  </Pressable>
                );
              })}
              <Text variant="meta" color="muted" style={{ marginTop: 12 }}>
                Menus are in English for now. You can change languages any time in You › Language.
              </Text>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text variant="display">How do you like to read?</Text>
              <Text variant="meta" color="muted" style={styles.group}>Theme</Text>
              <Segmented
                value={preference}
                onChange={setPreference}
                options={[
                  { value: 'paper', label: 'Light' },
                  { value: 'system', label: 'System' },
                  { value: 'ink', label: 'Dark' },
                ]}
              />
              <Text variant="meta" color="muted" style={styles.group}>Reading font</Text>
              <Segmented
                value={prefs.readFont}
                onChange={(readFont) => setPrefs({ readFont })}
                options={[
                  { value: 'serif', label: 'Serif' },
                  { value: 'sans', label: 'Sans serif' },
                ]}
              />
              <Text variant="meta" color="muted" style={styles.group}>Home view</Text>
              <Segmented
                value={prefs.homeView}
                onChange={(homeView) => setPrefs({ homeView })}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'focused', label: 'Focused' },
                ]}
              />
              <View style={[styles.preview, { borderColor: colors.rule, backgroundColor: colors.surface }]}>
                <Text variant="label" color="muted">Preview</Text>
                <Text variant="headline">Water board clears a 24-hour supply pilot for three wards</Text>
                <Text variant="body" color="muted">Meters will be installed before the switch.</Text>
              </View>
              <Text variant="meta" color="muted" style={{ marginTop: 12 }}>
                Text size and everything else can be changed later in You › Reading.
              </Text>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text variant="display">What do you want to follow?</Text>
              <Text variant="body" color="muted" style={styles.sub}>
                Each topic gets its own section on your front page.
              </Text>
              <View style={styles.wrap}>
                {TOPICS.map((t) => (
                  <Chip key={t} label={t} on={prefs.topics.includes(t)} onPress={() => setPrefs({ topics: toggle(prefs.topics, t) })} />
                ))}
              </View>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Text variant="display">Which places matter to you?</Text>
              <Text variant="body" color="muted" style={styles.sub}>
                From the whole world down to your city.
              </Text>
              <TextInput
                value={place}
                onChangeText={setPlace}
                placeholder="Find a state or city"
                placeholderTextColor={colors.muted}
                style={[styles.input, { borderColor: colors.ink, color: colors.ink, backgroundColor: colors.surface }]}
              />
              <View style={{ marginTop: 8 }}>
                {regionResults.map((r) => {
                  const on = prefs.regions.includes(r.name);
                  return (
                    <SettingRow
                      key={r.name}
                      label={r.name}
                      desc={r.kind}
                      on={on}
                      onChange={() => setPrefs({ regions: toggle(prefs.regions, r.name) })}
                    />
                  );
                })}
                {regionResults.length === 0 ? (
                  <Text variant="meta" color="muted" style={{ paddingTop: 12 }}>No place by that name yet.</Text>
                ) : null}
              </View>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <Text variant="display">Choose who you trust.</Text>
              <Text variant="body" color="muted" style={styles.sub}>
                My Feed shows only these. Each one lists who owns it and how it is funded.
              </Text>
              {visibleSources.map((s) => (
                <SettingRow
                  key={s.id}
                  label={s.name}
                  desc={`${s.kind} · ${s.place}\nOwner: ${s.owner}\nFunding: ${s.funding}`}
                  on={prefs.sources.includes(s.id)}
                  onChange={() => setPrefs({ sources: toggle(prefs.sources, s.id) })}
                />
              ))}
            </>
          ) : null}

          {step === 6 ? (
            <>
              <Text variant="display">Your homepage layout</Text>
              <Text variant="body" color="muted" style={styles.sub}>
                Your topics are already on it. Add or remove the extras.
              </Text>
              <SettingRow label="Papers & Reports" desc="Studies and official documents, labelled plainly." on={prefs.front.papers} onChange={(v) => setPrefs({ front: { ...prefs.front, papers: v } })} />
              <SettingRow label="Outside your sources" desc="A few stories from outlets you did not pick." on={prefs.front.outside} onChange={(v) => setPrefs({ front: { ...prefs.front, outside: v } })} />
              <SettingRow label="Continue reading" desc="Pick up where you left off." on={prefs.front.continueReading} onChange={(v) => setPrefs({ front: { ...prefs.front, continueReading: v } })} />
              <SettingRow label="Trending" desc="The stories most covered across your sources." on={prefs.front.trending} onChange={(v) => setPrefs({ front: { ...prefs.front, trending: v } })} />
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.rule, paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: gutter }]}>
        <View style={styles.column}>
          {g && !g.ok ? (
            <Text variant="meta" color="muted" style={{ marginBottom: 8, textAlign: 'center' }}>
              {g.why}
            </Text>
          ) : null}
          <Button
            label={step === 6 ? 'Print my first edition' : t('common.continue')}
            disabled={!!g && !g.ok}
            onPress={() => (step === 6 ? setStep(7) : next())}
          />
        </View>
      </View>
    </View>
  );
}

function Printing({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const labels = ['Gathering your sources', 'Setting your topics', 'Laying out the front page'];
  const [shown, setShown] = useState(0);
  const done = reduced || shown >= labels.length;

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setShown((n) => Math.min(n + 1, labels.length)), 900);
    return () => clearInterval(t);
  }, [reduced, labels.length]);

  return (
    <View style={[styles.printing, { backgroundColor: colors.bg, paddingTop: insets.top + 80, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.column, { paddingHorizontal: 24 }]}>
        <Wordmark size={36} />
        <Text variant="display" style={{ marginTop: 24 }}>
          {done ? 'Your edition is ready.' : 'Getting your edition ready'}
        </Text>
        <View style={{ marginTop: 20, gap: 10 }}>
          {labels.map((label, i) => {
            const on = done || i < shown;
            return (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: on ? 1 : 0.35 }}>
                {on ? <CheckIcon size={18} color={colors.accent} /> : <View style={[styles.dot, { backgroundColor: colors.muted }]} />}
                <Text variant="ui">{label}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ marginTop: 32 }}>
          <Button label="See my edition" disabled={!done} onPress={onDone} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  column: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  barBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sub: { marginTop: 8, marginBottom: 16 },
  group: { marginTop: 20, marginBottom: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16, borderWidth: 1, marginBottom: 8 },
  preview: { marginTop: 20, padding: 18, gap: 6, borderWidth: StyleSheet.hairlineWidth },
  input: { height: 52, borderWidth: 1, paddingHorizontal: 14, fontFamily: Fonts.sans, fontSize: 16 },
  footer: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  printing: { flex: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 6 },
});
