import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { BackIcon, CheckIcon, CloseIcon, SearchIcon } from '@/components/icons';
import { useReducedMotion } from '@/components/stamp';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Photo } from '@/components/ui';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth } from '@/constants/theme';
import { REGIONS, TOPICS, type LanguageCode } from '@/data/sample';
import { useNews } from '@/data/news';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

const ORDER = ['welcome', 'language', 'reading', 'topics', 'places', 'sources', 'front', 'printing', 'signin'] as const;
type Step = (typeof ORDER)[number];

const LANGS: { code: LanguageCode; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिंदी', english: 'Hindi' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
];
const LANG_NAME: Record<LanguageCode, string> = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };

/**
 * Onboarding on web at 768px and wider (WebOnboarding): steps on the left, "Your edition so far" on the right.
 * Same choices as the phone flow, saved to the reader store as they are made.
 */
export function WideOnboarding() {
  const { sources: SOURCES } = useNews();
  const { colors, name, preference, setPreference } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { status, continueAsGuest, signInWithGoogle } = useSession();
  const { prefs, setPrefs, finishOnboarding } = useReader();
  const [step, setStep] = useState<Step>('welcome');
  const [place, setPlace] = useState('');
  const { width } = useWindowDimensions();
  // clamp(44px, 6vw, 76px), as on the board.
  const heroSize = Math.round(Math.min(76, Math.max(44, width * 0.06)));
  const hero = { fontSize: heroSize, lineHeight: Math.round(heroSize * 1.02), letterSpacing: -1.4 };
  const i = ORDER.indexOf(step);
  const t = useT();
  const inSteps = i >= 1 && i <= 6;

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  let need = '';
  if (step === 'topics' && prefs.topics.length < 1) need = 'Pick at least 1 topic.';
  if (step === 'sources' && prefs.sources.length < 3) need = `Pick ${3 - prefs.sources.length} more to continue.`;
  const go = (s: Step) => setStep(s);
  const next = () => {
    if (need) return;
    if (step === 'printing') {
      finishOnboarding();
      if (status === 'signedIn') return router.replace('/home');
    }
    setStep(ORDER[Math.min(ORDER.length - 1, i + 1)]);
  };
  const back = () => setStep(ORDER[Math.max(0, i - 1)]);
  const ruleStrong = name === 'ink' ? '#4A443C' : '#C2B6A2';
  const body = name === 'ink' ? '#B5AC9C' : '#3F3A33';

  const summary = [
    { label: 'Language', value: LANG_NAME[prefs.appLanguage], k: 'language' as Step },
    {
      label: 'Reading',
      value: `${prefs.readFont === 'sans' ? 'Sans' : 'Serif'} · ${preference === 'system' ? 'System' : preference === 'ink' ? 'Ink' : 'Paper'}`,
      k: 'reading' as Step,
    },
    { label: 'Topics', value: String(prefs.topics.length), k: 'topics' as Step },
    { label: 'Places', value: String(prefs.regions.length), k: 'places' as Step },
    { label: 'Sources', value: String(prefs.sources.length), k: 'sources' as Step },
  ];

  const q = place.trim().toLowerCase();
  const matches = q ? REGIONS.filter((r) => r.name.toLowerCase().includes(q) && !prefs.regions.includes(r.name)).slice(0, 6) : [];
  const visibleSources = SOURCES.filter((s) => prefs.sourceLanguages.includes(s.lang) || s.journal);

  return (
    <View style={{ flex: 1, minHeight: '100%' as never, backgroundColor: colors.bg }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.rule }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="link" accessibilityLabel="Un:edited" onPress={() => router.replace('/landing')}>
            <Wordmark size={28} />
          </Pressable>
          {inSteps ? (
            <Text variant="label" color="muted">
              Step {i} of 6
            </Text>
          ) : null}
          {inSteps ? (
            <Pressable accessibilityRole="button" onPress={() => go('printing')} style={{ height: 44, justifyContent: 'center' }}>
              <Text variant="ui" color="muted" style={{ fontSize: 14, textDecorationLine: 'underline' }}>
                Skip, use defaults
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>
        {inSteps ? <Progress value={i / 6} /> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.main}>
          <StepIn key={step}>
            {step === 'welcome' ? (
              <View style={{ gap: 26, paddingTop: 24 }}>
                <Text variant="display" accessibilityRole="header" style={hero}>
                  Every story,{'\n'}
                  <Text variant="display" color="accent" style={hero}>
                    as it was written.
                  </Text>
                </Text>
                <View style={{ borderTopWidth: 1, borderTopColor: colors.rule }}>
                  {[
                    ['No AI', 'Every word comes from the publisher.'],
                    ['No algorithm', 'Only the outlets you choose.'],
                    ['No fee', 'Free for everyone, always.'],
                  ].map(([k, v]) => (
                    <View key={k} style={[styles.liner, { borderBottomColor: colors.rule }]}>
                      <Text variant="label" color="accent" style={{ width: 110 }}>
                        {k}
                      </Text>
                      <Text variant="body" style={{ fontSize: 19, lineHeight: 26, flex: 1 }}>
                        {v}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.ctaRow}>
                  <Big label="Set up my edition" onPress={next} />
                  <Big label="I already have an account" outline onPress={() => go('signin')} />
                </View>
                <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
                  About two minutes. Everything can be changed later in You.
                </Text>
              </View>
            ) : null}

            {step === 'language' ? (
              <Section title="Which language for the app?" sub="Menus and buttons use this language. You can still read sources in any of the three." body={body}>
                <View accessibilityRole="radiogroup" accessibilityLabel="App language" style={styles.langGrid}>
                  {LANGS.map((l) => {
                    const on = prefs.appLanguage === l.code;
                    return (
                      <Pressable
                        key={l.code}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        onPress={() =>
                          setPrefs({
                            appLanguage: l.code,
                            sourceLanguages: prefs.sourceLanguages.includes(l.code) ? prefs.sourceLanguages : [...prefs.sourceLanguages, l.code],
                          })
                        }
                        style={[
                          styles.langCard,
                          { borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.rule, backgroundColor: on ? colors.surface : 'transparent' },
                        ]}>
                        <Text variant="display" lang={l.code !== 'en' ? l.code : undefined} style={{ fontSize: 26, lineHeight: 32 }}>
                          {l.native}
                        </Text>
                        <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
                          {l.english}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>
            ) : null}

            {step === 'reading' ? (
              <Section title="How do you like to read?" body={body}>
                <Seg
                  label="Theme"
                  value={preference}
                  onChange={setPreference}
                  options={[
                    { value: 'system', label: 'System' },
                    { value: 'paper', label: 'Paper' },
                    { value: 'ink', label: 'Ink' },
                  ]}
                />
                <Seg
                  label="Reading font"
                  value={prefs.readFont}
                  onChange={(readFont) => setPrefs({ readFont })}
                  options={[
                    { value: 'serif', label: 'Serif' },
                    { value: 'sans', label: 'Sans' },
                  ]}
                />
                <Seg
                  label="Home view"
                  value={prefs.homeView}
                  onChange={(homeView) => setPrefs({ homeView })}
                  options={[
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'focused', label: 'Focused' },
                  ]}
                />
                <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
                  <Text variant="body" style={{ fontSize: 19, lineHeight: 29.5 }}>
                    The city water board on Monday approved a six-month pilot that will move three wards to round-the-clock water.
                  </Text>
                </View>
              </Section>
            ) : null}

            {step === 'topics' ? (
              <Section title="What do you follow?" sub="Each topic becomes a block on your front page. Pick at least one." body={body}>
                <View style={styles.chips}>
                  {TOPICS.map((t) => {
                    const on = prefs.topics.includes(t);
                    return (
                      <Pressable
                        key={t}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        onPress={() => setPrefs({ topics: toggle(prefs.topics, t) })}
                        style={[styles.chip, { borderColor: on ? colors.ink : colors.rule, backgroundColor: on ? colors.ink : 'transparent' }]}>
                        <Text variant="ui" style={{ fontSize: 14, color: on ? colors.bg : colors.ink }}>
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>
            ) : null}

            {step === 'places' ? (
              <Section title="Which places matter to you?" body={body}>
                <View style={[styles.search, { backgroundColor: colors.surface, borderColor: ruleStrong }]}>
                  <SearchIcon size={18} color={colors.muted} />
                  <TextInput
                    value={place}
                    onChangeText={setPlace}
                    placeholder="Search a city, state or country"
                    placeholderTextColor={colors.muted}
                    accessibilityLabel="Search for a city, state or country"
                    style={[styles.searchInput, { color: colors.ink }]}
                  />
                </View>
                {matches.length ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.rule }}>
                    {matches.map((r) => (
                      <Pressable
                        key={r.name}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${r.name}`}
                        onPress={() => {
                          setPrefs({ regions: [...prefs.regions, r.name] });
                          setPlace('');
                        }}
                        style={[styles.placeRow, { borderBottomColor: colors.rule }]}>
                        <View style={{ gap: 2 }}>
                          <Text variant="headline" style={{ fontSize: 18, lineHeight: 23 }}>
                            {r.name}
                          </Text>
                          <Text variant="meta" color="muted" style={{ fontSize: 12 }}>
                            {r.kind}
                          </Text>
                        </View>
                        <Text variant="ui" color="accent" medium style={{ fontSize: 14 }}>
                          Add
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : q ? (
                  <Text variant="meta" color="muted">
                    No place by that name yet.
                  </Text>
                ) : null}
                <Text variant="label" color="muted">
                  Selected
                </Text>
                <View style={{ borderTopWidth: 1, borderTopColor: colors.rule }}>
                  {prefs.regions.map((p) => (
                    <View key={p} style={[styles.placeRow, { borderBottomColor: colors.rule }]}>
                      <View style={{ gap: 2 }}>
                        <Text variant="headline" style={{ fontSize: 18, lineHeight: 23 }}>
                          {p}
                        </Text>
                        <Text variant="meta" color="muted" style={{ fontSize: 12 }}>
                          {REGIONS.find((r) => r.name === p)?.kind ?? 'Place'}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${p}`}
                        onPress={() => setPrefs({ regions: prefs.regions.filter((x) => x !== p) })}
                        style={styles.remove}>
                        <CloseIcon size={16} color={colors.muted} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}

            {step === 'sources' ? (
              <Section title="Choose who you trust." sub="Your Feed only shows these outlets. Pick at least three. Owners and funding are listed for each." body={body}>
                <View style={{ borderTopWidth: 1, borderTopColor: colors.ink }}>
                  {visibleSources.map((s) => {
                    const on = prefs.sources.includes(s.id);
                    return (
                      <Pressable
                        key={s.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        onPress={() => setPrefs({ sources: toggle(prefs.sources, s.id) })}
                        style={[styles.sourceRow, { borderBottomColor: colors.rule }]}>
                        <View style={[styles.box, { borderColor: on ? colors.accent : colors.muted, backgroundColor: on ? colors.accent : 'transparent' }]}>
                          {on ? <CheckIcon size={14} color={colors.bg} /> : null}
                        </View>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text variant="headline" lang={s.lang !== 'en' ? s.lang : undefined} style={{ fontSize: 19, lineHeight: 24 }}>
                            {s.name}
                          </Text>
                          <Text variant="meta" color="muted">
                            {LANG_NAME[s.lang]} · {s.owner} · {s.funding}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>
            ) : null}

            {step === 'front' ? (
              <Section title="Your front page." body={body}>
                <View style={{ borderTopWidth: 1, borderTopColor: colors.ink }}>
                  {(
                    [
                      ['papers', 'Papers & Reports', 'Research and official documents your sources linked.'],
                      ['outside', 'Outside your sources', 'A few stories from outlets you haven’t chosen, clearly marked.'],
                      ['continueReading', 'Continue reading', 'Articles you started.'],
                      ['trending', 'Trending', 'Five stories the most outlets are covering.'],
                    ] as const
                  ).map(([key, label, desc]) => {
                    const on = prefs.front[key];
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: on }}
                        onPress={() => setPrefs({ front: { ...prefs.front, [key]: !on } })}
                        style={[styles.switchRow, { borderBottomColor: colors.rule }]}>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text variant="ui">{label}</Text>
                          <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
                            {desc}
                          </Text>
                        </View>
                        <View style={[styles.track, { backgroundColor: on ? colors.ink : 'transparent', borderColor: on ? colors.ink : colors.muted }]}>
                          <View style={[styles.knob, { left: on ? 21 : 3, backgroundColor: on ? colors.bg : colors.muted }]} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>
            ) : null}

            {step === 'printing' ? (
              <View style={{ gap: 20, paddingTop: 24 }}>
                <Text variant="label" color="accent">
                  Morning Edition Nº 1
                </Text>
                <Text variant="display" accessibilityRole="header" style={{ fontSize: 52, lineHeight: 54, letterSpacing: -0.8 }}>
                  Your edition is ready.
                </Text>
                <PrintBar />
                <View style={{ gap: 8 }}>
                  {[
                    `${prefs.sources.length} sources checked for today’s stories`,
                    `${prefs.topics.length} topic blocks set on your front page`,
                    'Stories grouped where outlets cover the same news',
                  ].map((line) => (
                    <Text key={line} variant="ui" style={{ color: body }}>
                      ✓ {line}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}

            {step === 'signin' ? (
              <View style={{ gap: 16, maxWidth: 460 }}>
                <Text variant="display" accessibilityRole="header" style={styles.h1}>
                  Keep your edition on every device.
                </Text>
                <Text variant="ui" style={{ color: body, lineHeight: 23 }}>
                  Sign in to keep your sources, settings and saved folders in sync between this browser and your phone.
                </Text>
                <Big
                  label="Continue with Google"
                  full
                  onPress={async () => {
                    finishOnboarding();
                    const error = await signInWithGoogle();
                    if (error) toast.show(error);
                  }}
                />
                <Big
                  label="Continue with email"
                  outline
                  full
                  onPress={() => {
                    finishOnboarding();
                    router.push('/sign-in');
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    finishOnboarding();
                    continueAsGuest();
                    router.replace('/home');
                  }}
                  style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="ui" color="muted" style={{ textDecorationLine: 'underline' }}>
                    Not now
                  </Text>
                </Pressable>
                <Text variant="meta" color="muted" style={{ textAlign: 'center', lineHeight: 19 }}>
                  Without an account, your choices stay in this browser and saving to folders is off.
                </Text>
              </View>
            ) : null}
          </StepIn>

          {i >= 1 && i <= 7 ? (
            <View style={[styles.footer, { borderTopColor: colors.rule }]}>
              <Pressable accessibilityRole="button" onPress={back} style={styles.back}>
                <BackIcon size={18} color={colors.ink} />
                <Text variant="ui">{t('common.back')}</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Text variant="meta" color="muted" style={{ fontSize: 13 }} accessibilityLiveRegion="polite">
                  {need}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!need }}
                  disabled={!!need}
                  onPress={next}
                  style={[styles.next, { backgroundColor: need ? colors.rule : colors.ink }]}>
                  <Text variant="ui" medium style={{ fontSize: 16, color: need ? colors.muted : colors.bg }}>
                    {step === 'front' ? 'Print my edition' : t('common.continue')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.aside}>
          {i >= 1 && i <= 7 ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
              <View style={{ paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: colors.ink }}>
                <Text variant="label" color="muted">
                  Your edition so far
                </Text>
              </View>
              {summary.map((r) => (
                <Pressable
                  key={r.label}
                  accessibilityRole="button"
                  onPress={() => go(r.k)}
                  style={[styles.summaryRow, { borderBottomColor: colors.rule }]}>
                  <Text variant="ui" style={{ fontSize: 13.5, color: r.k === step ? colors.accent : colors.ink }}>
                    {r.label}
                  </Text>
                  <Text
                    variant="headline"
                    lang={r.k === 'language' && prefs.appLanguage !== 'en' ? prefs.appLanguage : undefined}
                    style={{ fontSize: 16, lineHeight: 21, color: r.k === step ? colors.accent : colors.ink }}>
                    {r.value}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View aria-hidden style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.rule, gap: 10, padding: 20 }]}>
              <View style={[styles.artStrip, { borderTopColor: colors.ink, borderBottomColor: colors.ink }]}>
                <Text variant="label" color="muted">
                  Morning Edition Nº 1
                </Text>
                <Text variant="label" color="muted">
                  6:00 AM
                </Text>
              </View>
              <Photo height={150} />
              <Text variant="display" style={{ fontSize: 22, lineHeight: 25 }}>
                Water board clears a 24-hour supply pilot for three wards
              </Text>
              <Text variant="meta" color="muted">
                Morning Ledger · Deccan Courier · +2
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function Section({ title, sub, body, children }: { title: string; sub?: string; body: string; children: ReactNode }) {
  return (
    <View style={{ gap: 18 }}>
      <Text variant="display" accessibilityRole="header" style={styles.h1}>
        {title}
      </Text>
      {sub ? (
        <Text variant="ui" style={{ color: body, lineHeight: 23 }}>
          {sub}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function Seg<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text variant="ui" medium style={{ fontSize: 14 }}>
        {label}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.ink }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => onChange(o.value)}
              style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.ink : 'transparent' }}>
              <Text variant="ui" medium={on} style={{ fontSize: 14.5, color: on ? colors.bg : colors.ink }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Big({ label, onPress, outline, full }: { label: string; onPress: () => void; outline?: boolean; full?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.big,
        full && { alignSelf: 'stretch', height: 52 },
        outline ? { borderWidth: 1, borderColor: colors.ink } : { backgroundColor: colors.ink },
      ]}>
      <Text variant="ui" medium style={{ fontSize: 16, color: outline ? colors.ink : colors.bg }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Progress({ value }: { value: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width] = useState(() => new Animated.Value(value));
  useEffect(() => {
    // The board's bar eases its width over 0.35s; reduced motion jumps.
    if (reduced) width.setValue(value);
    else Animated.timing(width, { toValue: value, duration: 350, easing: Easing.ease, useNativeDriver: false }).start();
  }, [value, reduced, width]);
  return (
    <View aria-hidden style={{ height: 3, backgroundColor: colors.rule }}>
      <Animated.View
        style={{ height: 3, backgroundColor: colors.accent, width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
      />
    </View>
  );
}

/** Each step rises 10px and fades in over 0.35s, ease-out (WebOnboarding .wo-step). Static with reduced motion. */
function StepIn({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) return v.setValue(1);
    Animated.timing(v, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
  }, [reduced, v]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

/** The printing bar fills over 2.4s, ease-in-out (WebOnboarding .wo-bar). Full at once with reduced motion. */
function PrintBar() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) return v.setValue(1);
    Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, [reduced, v]);
  return (
    <View aria-hidden style={{ height: 3, backgroundColor: colors.rule }}>
      <Animated.View style={{ height: 3, backgroundColor: colors.ink, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 32,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
    paddingBottom: 72,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    columnGap: 72,
    rowGap: 40,
  },
  main: { flexGrow: 999, flexShrink: 1, flexBasis: 560, minWidth: 0, maxWidth: 680, gap: 28 },
  aside: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0, maxWidth: 380, gap: 14 },
  h1: { fontSize: 44, lineHeight: 46, letterSpacing: -0.6 },
  liner: { paddingVertical: 14, flexDirection: 'row', alignItems: 'baseline', gap: 16, borderBottomWidth: 1 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  big: { height: 54, paddingHorizontal: 26, alignItems: 'center', justifyContent: 'center' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  langCard: { flexGrow: 1, flexBasis: 180, minHeight: 104, padding: 16, justifyContent: 'space-between', gap: 10 },
  preview: { marginTop: 6, paddingVertical: 18, paddingHorizontal: 20, borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 44, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1 },
  search: { height: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  searchInput: { flex: 1, minWidth: 0, height: 44, fontFamily: Fonts.serif, fontSize: 18, outlineStyle: 'none' as never },
  placeRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sourceRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1 },
  box: { width: 20, height: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  switchRow: { minHeight: 64, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 24, borderBottomWidth: 1 },
  track: { width: 44, height: 26, borderRadius: 13, borderWidth: 1.5 },
  knob: { position: 'absolute', top: 3, width: 17, height: 17, borderRadius: 9 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 20, borderTopWidth: 1 },
  back: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  next: { height: 52, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center' },
  card: { paddingVertical: 18, paddingHorizontal: 20, borderWidth: 1 },
  summaryRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1 },
  artStrip: { borderTopWidth: 2, borderBottomWidth: 1, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' },
});
