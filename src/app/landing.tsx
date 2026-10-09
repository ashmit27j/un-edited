import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { ArrowIcon } from '@/components/icons';
import { Stamp } from '@/components/stamp';
import { Text } from '@/components/text';
import { Wordmark } from '@/components/wordmark';
import { MaxContentWidth } from '@/constants/theme';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const OUTLETS = ['Morning Ledger', 'Deccan Courier', 'Civic Wire', 'सह्याद्री वार्ता', 'नगर दर्पण', 'The Plateau Times', 'Open Research Repository'];

const VERSIONS = [
  { name: 'Morning Ledger', time: '7:42 AM', headline: 'Water board clears a 24-hour supply pilot for three wards', lede: 'The city water board on Monday approved a six-month pilot that will move three wards from scheduled supply to round-the-clock water.' },
  { name: 'Deccan Courier', time: '8:15 AM', headline: 'Round-the-clock water, but only for three wards — for now', lede: 'Three wards will get water 24 hours a day under a pilot cleared on Monday, while the rest of the city stays on its current schedule.' },
  { name: 'Civic Wire', time: '9:02 AM', headline: '24-hour water pilot: what changes for residents from November', lede: 'Meters first, then the switch: a step-by-step look at the timeline the board has set for the pilot wards.' },
  { name: 'The Plateau Times', time: '10:30 AM', headline: 'Residents ask for a public review before the pilot expands', lede: 'Residents’ groups welcomed the pilot but said its results should be reviewed in public before any expansion.' },
];

const FACTS = [
  ['Owner', 'Ledger Media (example)'],
  ['Funding', 'Subscriptions and advertising'],
  ['Based in', 'Pune, Maharashtra'],
  ['Corrections', 'Published policy, noted at the end of articles'],
];

const PAPERS = [
  { label: 'Peer-reviewed', title: 'Urban heat islands and night-time temperatures in tier-2 cities', note: 'Checked by independent researchers before publication.' },
  { label: 'Preprint · not yet peer-reviewed', title: 'Measuring commute times with open transit data', note: 'Shared early. Findings may change after review.' },
  { label: 'Official report', title: 'Quarterly report on rural road connectivity, July–September', note: 'A primary document from a government body, linked in full.' },
];

const FAQS = [
  { q: 'Do you rewrite or summarise articles?', a: 'No. Headlines, text and image credits are shown as each publisher released them. When only an excerpt is available, the article says so and links to the full story.' },
  { q: 'How is my feed ordered?', a: 'By time of publication, from the sources you chose. Nothing is ranked by what you click.' },
  { q: 'Do I need an account?', a: 'No. Anyone can read. An account lets you save articles into folders and keep your settings on every device.' },
];

type SectionId = 'idea' | 'sources' | 'questions' | 'start';

type LayoutProps = { wide: boolean; pad: number };

function Section({ id, n, title, aside, onMark, wide, pad, children }: LayoutProps & { id?: SectionId; n: string; title: string; aside: string; onMark?: (id: SectionId) => (e: LayoutChangeEvent) => void; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View onLayout={id && onMark ? onMark(id) : undefined} style={[styles.section, { paddingHorizontal: pad }]}>
      <View style={styles.sectionHead}>
        <View style={[styles.num, { backgroundColor: n === '06' ? colors.accent : colors.ink }]}>
          <Text variant="label" style={{ color: colors.bg }}>{n}</Text>
        </View>
        <Text variant="label" color="muted">{title}</Text>
        <View style={[styles.line, { backgroundColor: colors.rule }]} />
        {wide ? <Text variant="label" color="muted">{aside}</Text> : null}
      </View>
      <View style={[styles.cols, { flexDirection: wide ? 'row' : 'column', gap: wide ? 64 : 28 }]}>{children}</View>
    </View>
  );
}

function Heading({ a, b }: { a: string; b: string }) {
  const { width } = useWindowDimensions();
  const h2 = width >= 900 ? 56 : 38;
  return (
    <Text variant="display" style={{ fontSize: h2, lineHeight: h2 * 1.04, letterSpacing: -1 }}>
      {a}
      {'\n'}
      <Text variant="display" color="accent" style={{ fontSize: h2, lineHeight: h2 * 1.04, fontStyle: 'italic' }}>{b}</Text>
    </Text>
  );
}


export default function Landing() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { continueAsGuest } = useSession();
  const { finishOnboarding } = useReader();
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<SectionId, number>>>({});
  const [version, setVersion] = useState(0);
  const [faq, setFaq] = useState(0);

  const wide = width >= 900;
  const pad = width >= 768 ? 32 : 24;
  const h1 = width >= 900 ? 88 : width >= 480 ? 56 : 44;

  const mark = (id: SectionId) => (e: LayoutChangeEvent) => {
    offsets.current[id] = e.nativeEvent.layout.y;
  };
  const go = (id: SectionId) => scroll.current?.scrollTo({ y: offsets.current[id] ?? 0, animated: true });

  const readOnWeb = () => {
    continueAsGuest();
    finishOnboarding();
    router.replace('/home');
  };

  return (
    <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={styles.page}>
        <View style={[styles.header, { borderBottomColor: colors.rule, paddingHorizontal: pad }]}>
          <Wordmark size={28} />
          <View style={styles.nav}>
            {([['idea', 'How it works'], ['sources', 'Sources'], ['questions', 'Questions']] as [SectionId, string][]).map(([id, label]) => (
              <Pressable key={id} accessibilityRole="link" onPress={() => go(id)} style={styles.navLink}>
                <Text variant="ui" style={{ fontSize: 14.5 }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Hero */}
        <View style={{ paddingHorizontal: pad, paddingTop: 28 }}>
          <View style={styles.sectionHead}>
            <View style={[styles.num, { backgroundColor: colors.ink }]}>
              <Text variant="label" style={{ color: colors.bg }}>Nº 1</Text>
            </View>
            <Text variant="label" color="muted">A news reader</Text>
            <View style={[styles.line, { backgroundColor: colors.rule }]} />
            {wide ? <Text variant="label" color="muted">No AI · No algorithm · No fee</Text> : null}
          </View>
          <View style={{ marginTop: wide ? 56 : 28, gap: 24 }}>
            <View accessibilityRole="header" accessibilityLabel="Every story, Un:edited.">
              <Text variant="display" style={{ fontSize: h1, lineHeight: h1 * 1.04, letterSpacing: -h1 * 0.02 }}>
                Every story,
              </Text>
              <Text variant="display" style={{ fontSize: h1, lineHeight: h1 * 1.04, letterSpacing: -h1 * 0.02 }}>
                <Text variant="display" color="accent" style={{ fontSize: h1, lineHeight: h1 * 1.04 }}>Un:</Text>edited.
              </Text>
            </View>
            <Text variant="body" color="muted" style={{ fontSize: wide ? 22 : 18, lineHeight: wide ? 34 : 27, maxWidth: 580 }}>
              <Text variant="body" style={{ fontSize: wide ? 22 : 18, lineHeight: wide ? 34 : 27 }}>Every story, as it was written. </Text>
              Un:edited brings stories from the outlets you choose, exactly as their publishers wrote them. No AI rewrites, no ranking algorithm, no ads.
            </Text>
            <View style={styles.ctaRow}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} style={[styles.cta, { backgroundColor: colors.ink }]}>
                <Text variant="ui" medium style={{ color: colors.bg, fontSize: 16 }}>Start reading</Text>
                <ArrowIcon size={18} color={colors.bg} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={readOnWeb} style={[styles.cta, { borderWidth: 1, borderColor: colors.ink }]}>
                <Text variant="ui" medium style={{ fontSize: 16 }}>Read on the web</Text>
              </Pressable>
            </View>
            <View style={{ alignSelf: wide ? 'flex-end' : 'flex-start', marginTop: wide ? -160 : 0 }}>
              <Stamp kind="brand" capped size={wide ? 156 : 108} />
            </View>
          </View>
          <View style={[styles.outlets, { borderColor: colors.rule }]}>
            {OUTLETS.map((o, i) => (
              <Text key={o} variant="headline" lang={/[ऀ-ॿ]/.test(o) ? (o === 'नगर दर्पण' ? 'hi' : 'mr') : undefined} style={{ fontSize: 22, paddingHorizontal: 14 }}>
                {o}
                {i < OUTLETS.length - 1 ? <Text variant="headline" color="accent">  ·</Text> : null}
              </Text>
            ))}
          </View>
        </View>

        {/* 01 */}
        <Section id="idea" onMark={mark} wide={wide} pad={pad} n="01" title="The idea" aside="Read it from">
          <View style={{ flex: 1, gap: 20 }}>
            <Heading a="One story." b="Every version." />
            <Text variant="body" color="muted" style={{ fontSize: 19, lineHeight: 30 }}>
              When several outlets report the same event, Un:edited puts them side by side. Switch between them under “Read it from” and see how each one told it.
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, backgroundColor: colors.surface, borderColor: colors.rule }]}>
            <Text variant="label" color="accent">City · Covered by 4 sources</Text>
            <View style={[styles.tabs, { borderBottomColor: colors.rule }]}>
              {VERSIONS.map((v, i) => (
                <Pressable key={v.name} accessibilityRole="tab" accessibilityState={{ selected: i === version }} onPress={() => setVersion(i)} style={[styles.tab, { borderBottomColor: i === version ? colors.accent : 'transparent' }]}>
                  <Text variant="ui" medium={i === version} color={i === version ? 'accent' : 'muted'}>{v.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ paddingTop: 18, gap: 10, minHeight: 200 }}>
              <Text variant="meta" color="muted">{VERSIONS[version].name} · {VERSIONS[version].time}</Text>
              <Text variant="headline" style={{ fontSize: 28, lineHeight: 33 }}>{VERSIONS[version].headline}</Text>
              <Text variant="body">{VERSIONS[version].lede}</Text>
            </View>
          </View>
        </Section>

        {/* 02 */}
        <Section id="sources" onMark={mark} wide={wide} pad={pad} n="02" title="Your sources" aside="Choose who you trust">
          <View style={{ flex: 1, gap: 20 }}>
            <Heading a="Know who is" b="behind the news." />
            <Text variant="body" color="muted" style={{ fontSize: 19, lineHeight: 30 }}>
              Every outlet shows who owns it, how it is funded and where it is based before you add it. Your feed shows only the ones you pick.
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, backgroundColor: colors.surface, borderColor: colors.rule }]}>
            <View style={[styles.factHead, { borderBottomColor: colors.ink }]}>
              <Text variant="display" style={{ fontSize: 28 }}>Morning Ledger</Text>
              <Text variant="label" color="accent">Example</Text>
            </View>
            {FACTS.map(([k, v]) => (
              <View key={k} style={[styles.fact, { borderBottomColor: colors.rule }]}>
                <Text variant="label" color="muted" style={{ width: 110 }}>{k}</Text>
                <Text variant="body" style={{ flex: 1 }}>{v}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* 03 */}
        <Section wide={wide} pad={pad} n="03" title="Papers & reports" aside="Honest labels">
          <View style={{ flex: 1, gap: 20 }}>
            <Heading a="Research," b="labelled honestly." />
            <Text variant="body" color="muted" style={{ fontSize: 19, lineHeight: 30 }}>
              Studies and official documents sit on your front page with a plain label, so you always know what kind of evidence you are reading.
            </Text>
          </View>
          <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: colors.ink }}>
            {PAPERS.map((p) => (
              <View key={p.title} style={[styles.paper, { borderBottomColor: colors.rule }]}>
                <Text variant="label" color="accent">{p.label}</Text>
                <Text variant="headline" style={{ fontSize: 21 }}>{p.title}</Text>
                <Text variant="ui" color="muted">{p.note}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* 04 */}
        <Section wide={wide} pad={pad} n="04" title="Your day" aside="One edition">
          <View style={{ flex: 1, gap: 20 }}>
            <Heading a="News that" b="ends." />
            <Text variant="body" color="muted" style={{ fontSize: 19, lineHeight: 30 }}>
              There is no endless scroll. When you have read what your sources published today, Un:edited tells you, and you can put it down.
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderColor: colors.rule }]}>
            <View style={{ width: 48, height: 1, backgroundColor: colors.ink }} />
            <Text variant="display" style={{ fontSize: 28, fontStyle: 'italic', textAlign: 'center' }}>That’s today’s edition.</Text>
            <Text variant="ui" color="muted" style={{ textAlign: 'center' }}>You’re all caught up. The next edition arrives at 6:00 AM.</Text>
          </View>
        </Section>

        {/* 05 */}
        <Section id="questions" onMark={mark} wide={wide} pad={pad} n="05" title="Questions" aside="Plain answers">
          <View style={{ flex: 1 }}>
            <Heading a="Before you" b="start." />
          </View>
          <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: colors.ink }}>
            {FAQS.map((f, i) => (
              <View key={f.q} style={{ borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: colors.rule }}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: faq === i }} onPress={() => setFaq(faq === i ? -1 : i)} style={styles.faqQ}>
                  <Text variant="headline" style={{ flex: 1, fontSize: 21 }}>{f.q}</Text>
                  <Text variant="ui" color="accent" style={{ fontSize: 20 }}>{faq === i ? '−' : '+'}</Text>
                </Pressable>
                {faq === i ? <Text variant="ui" color="muted" style={{ marginBottom: 20, fontSize: 16, lineHeight: 25 }}>{f.a}</Text> : null}
              </View>
            ))}
          </View>
        </Section>

        {/* 06 */}
        <Section id="start" onMark={mark} wide={wide} pad={pad} n="06" title="Start" aside="About two minutes">
          <View style={[styles.start, { backgroundColor: colors.ink, borderTopColor: colors.accent, flexDirection: wide ? 'row' : 'column' }]}>
            <View style={{ flex: 1, gap: 24 }}>
              <Text variant="display" style={{ color: colors.bg, fontSize: wide ? 64 : 42, lineHeight: wide ? 66 : 44 }}>
                Start your{'\n'}first edition.
              </Text>
              <Text variant="ui" style={{ color: colors.bg, opacity: 0.8, fontSize: 18, lineHeight: 28 }}>
                Languages, topics, places, sources. Pick them once and your front page is ready.
              </Text>
              <Stamp kind="free" size={128} />
            </View>
            <View style={{ flex: 1, gap: 12, maxWidth: 420 }}>
              <Pressable accessibilityRole="button" onPress={readOnWeb} style={[styles.startBtn, { borderWidth: 1.5, borderColor: colors.bg }]}>
                <Text variant="ui" medium style={{ color: colors.bg, fontSize: 16 }}>Read on the web</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} style={[styles.startBtn, { backgroundColor: colors.bg }]}>
                <Text variant="ui" medium style={{ color: colors.ink, fontSize: 16 }}>Set up my edition</Text>
              </Pressable>
              <View style={[styles.startBtn, { backgroundColor: colors.bg, opacity: 0.55 }]}>
                <Text variant="ui" medium style={{ color: colors.ink, fontSize: 16 }}>Android app · coming soon</Text>
              </View>
              <Text variant="label" style={{ color: colors.bg, opacity: 0.7, marginTop: 8 }}>No account, no store, installs in seconds.</Text>
              <Text variant="ui" style={{ color: colors.bg, fontSize: 15, lineHeight: 23 }}>
                <Text variant="ui" medium style={{ color: colors.bg }}>iPhone: </Text>
                open this page in Safari, tap Share, then Add to Home Screen.
              </Text>
            </View>
          </View>
        </Section>

        {/* Footer */}
        <View style={{ width: '100%', borderTopWidth: 2, borderTopColor: colors.ink, marginTop: 24 }}>
          <View style={[styles.footer, { paddingHorizontal: pad }]}>
            <Wordmark size={34} />
            <Text variant="body" style={{ fontSize: 19 }}>Every story, as it was written.</Text>
            <Text variant="ui" color="muted" style={{ maxWidth: 420 }}>
              An independent news reader with no AI rewrites, no ranking algorithm and no ads. Designed and built by one person.
            </Text>
            <Text variant="meta" color="muted">© 2026 Un:edited · Free for everyone, always.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Text variant="meta" color="muted">English · </Text>
              <Text variant="meta" color="muted" lang="hi">हिंदी</Text>
              <Text variant="meta" color="muted"> · </Text>
              <Text variant="meta" color="muted" lang="mr">मराठी</Text>
            </View>
            <Text variant="meta" color="muted">
              Headlines and outlets shown on this page are examples. Every article in the app belongs to its publisher.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: MaxContentWidth },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  nav: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  navLink: { minHeight: 44, justifyContent: 'center' },
  section: { width: '100%', paddingTop: 96 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  num: { paddingHorizontal: 8, paddingVertical: 4 },
  line: { flex: 1, height: 1 },
  cols: { marginTop: 36, alignItems: 'flex-start' },
  card: { padding: 24, borderWidth: StyleSheet.hairlineWidth * 2, gap: 12, width: '100%' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, borderBottomWidth: 1 },
  tab: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, marginBottom: -1 },
  factHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1 },
  fact: { flexDirection: 'row', gap: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  paper: { paddingVertical: 20, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  faqQ: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cta: { height: 56, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', gap: 12 },
  outlets: { marginTop: 56, flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, rowGap: 8 },
  start: { width: '100%', borderTopWidth: 3, padding: 32, gap: 40, alignItems: 'center' },
  startBtn: { minHeight: 60, paddingHorizontal: 22, justifyContent: 'center' },
  footer: { paddingTop: 48, paddingBottom: 48, gap: 14, maxWidth: MaxContentWidth, width: '100%' },
});

