import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ChevronIcon, CloseIcon, SearchIcon } from '@/components/icons';
import { SaveButton, storyLink, useOpenStory } from '@/components/story';
import { Text } from '@/components/text';
import { WebNav } from '@/components/web-nav';
import { Fonts } from '@/constants/theme';
import { TOPICS, ago, type Story } from '@/data/sample';
import { useNews } from '@/data/news';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

type Kind = 'all' | 'stories' | 'papers' | 'more';
const norm = (s: string) => s.toLowerCase();

/** Search on web at 768px and wider (WebSearch): one 760px column under the web nav. */
export function WideSearch({ initial }: { initial: string }) {
  const { stories: STORIES, sources: SOURCES, papers: PAPERS } = useNews();
  const { colors, name } = useTheme();
  const router = useRouter();
  const open = useOpenStory();
  const { prefs, hidden, searches, addSearch, clearSearches, removeSearch } = useReader();
  const [query, setQuery] = useState(initial);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [kind, setKind] = useState<Kind>('all');
  const mark = name === 'ink' ? '#3A2924' : '#EBD5CC';
  const t = useT();

  const q = norm(query.trim());
  const inScope = (sourceId: string) => scope === 'all' || prefs.sources.includes(sourceId);
  const stories = useMemo(
    () =>
      q
        ? STORIES.filter((s) => !hidden.includes(s.id) && inScope(s.sourceId))
            .filter((s) => norm(`${s.headline} ${s.topic} ${s.body.join(' ')}`).includes(q))
            .sort((a, b) => a.minsAgo - b.minsAgo)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, scope, prefs.sources, hidden],
  );
  const papers = q ? PAPERS.filter((p) => norm(`${p.title} ${p.label}`).includes(q) || (q.length > 2 && 'papers reports'.includes(q))) : [];
  const sources = q ? SOURCES.filter((s) => norm(s.name).includes(q)) : [];
  const topics = q ? TOPICS.filter((t) => norm(t).includes(q)) : [];
  const todayCount = (topic: string) => STORIES.filter((s) => s.topic === topic && s.minsAgo < 1440 && inScope(s.sourceId)).length;

  const goTo = [
    ...sources.map((s) => ({
      key: s.id,
      label: s.name,
      lang: s.lang,
      mark: s.name.replace('The ', '').charAt(0),
      meta: prefs.sources.includes(s.id) ? 'Source · one of yours' : 'Source · not in your list',
      go: () => router.push('/manage'),
    })),
    ...topics.map((t) => ({
      key: t,
      label: t,
      lang: 'en' as const,
      mark: '#',
      meta: `Topic · ${todayCount(t)} stories today`,
      go: () => setQuery(t),
    })),
  ];

  const kinds: { id: Kind; label: string; n: number }[] = [
    { id: 'all', label: 'All', n: stories.length + papers.length + goTo.length },
    { id: 'stories', label: 'Stories', n: stories.length },
    { id: 'papers', label: 'Papers', n: papers.length },
    { id: 'more', label: 'Sources & topics', n: goTo.length },
  ];
  const showStories = kind === 'all' || kind === 'stories';
  const showPapers = kind === 'all' || kind === 'papers';
  const showGoTo = (kind === 'all' || kind === 'more') && goTo.length > 0;
  const total = kind === 'more' ? goTo.length : (showStories ? stories.length : 0) + (showPapers ? papers.length : 0);
  const noun = kind === 'papers' ? (total === 1 ? 'paper' : 'papers') : kind === 'more' ? (total === 1 ? 'match' : 'matches') : total === 1 ? 'result' : 'results';
  const none = !!q && stories.length + papers.length + goTo.length === 0;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const pick = (v: string) => {
    setQuery(v);
    setKind('all');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <WebNav />
      <View style={styles.page}>
        <Text variant="display" accessibilityRole="header" style={styles.h1}>
          Search
        </Text>

        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: name === 'ink' ? '#4A443C' : '#C9BFAE' }]}>
          <SearchIcon size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              setKind('all');
            }}
            onSubmitEditing={() => addSearch(query)}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.muted}
            accessibilityLabel="Search stories, papers, sources and topics"
            autoFocus={!initial}
            returnKeyType="search"
            style={[styles.input, { color: colors.ink, fontFamily: prefs.readFont === 'sans' ? Fonts.sans : Fonts.serif }]}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Close search" onPress={close} style={styles.close}>
            <CloseIcon size={18} color={colors.ink} />
          </Pressable>
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel="Search in" style={[styles.scopes, { borderColor: colors.ink }]}>
          {(
            [
              { id: 'mine', label: 'Your sources' },
              { id: 'all', label: 'All sources' },
            ] as const
          ).map((s) => {
            const on = s.id === scope;
            return (
              <Pressable
                key={s.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setScope(s.id)}
                style={[styles.scope, { backgroundColor: on ? colors.ink : 'transparent' }]}>
                <Text variant="ui" medium={on} style={{ fontSize: 13.5, color: on ? colors.bg : colors.ink }}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {q ? (
          <View accessibilityRole="tablist" accessibilityLabel="Show" style={[styles.kinds, { borderBottomColor: colors.rule }]}>
            {kinds.map((k) => {
              const on = k.id === kind;
              return (
                <Pressable
                  key={k.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setKind(k.id)}
                  style={[styles.kind, { borderBottomColor: on ? colors.accent : 'transparent' }]}>
                  <Text variant="ui" medium={on} color={on ? 'ink' : 'muted'} style={{ fontSize: 14 }}>
                    {k.label}
                  </Text>
                  <Text variant="label" color="muted">
                    {k.n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!q ? (
          <>
            {searches.length ? (
              <View style={{ marginTop: 22 }}>
                <View style={[styles.headRow, { borderBottomColor: colors.ink }]}>
                  <Text variant="label" medium accessibilityRole="header">
                    Recent searches
                  </Text>
                  <Pressable accessibilityRole="button" onPress={clearSearches} style={{ height: 40, justifyContent: 'center' }}>
                    <Text variant="meta" color="muted" style={{ fontSize: 13 }}>
                      Clear all
                    </Text>
                  </Pressable>
                </View>
                {searches.map((r) => (
                  <View key={r} style={[styles.recent, { borderBottomColor: colors.rule }]}>
                    <Pressable accessibilityRole="button" onPress={() => pick(r)} style={styles.recentMain}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8} strokeLinecap="round">
                        <Circle cx={12} cy={12} r={8} />
                        <Path d="M12 8v4l3 2" />
                      </Svg>
                      <Text variant="headline" style={{ fontSize: 17, lineHeight: 22 }}>
                        {r}
                      </Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${r}`} onPress={() => removeSearch(r)} style={styles.remove}>
                      <CloseIcon size={14} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ marginTop: 26 }}>
              <View style={[styles.headRow, { borderBottomColor: colors.ink, paddingBottom: 8 }]}>
                <Text variant="label" medium accessibilityRole="header">
                  Browse by topic
                </Text>
                <Text variant="label" color="muted">
                  Stories today
                </Text>
              </View>
              <View style={styles.topicGrid}>
                {TOPICS.map((t) => (
                  <Pressable key={t} accessibilityRole="button" onPress={() => pick(t)} style={[styles.topic, { borderBottomColor: colors.rule }]}>
                    <Text variant="headline" style={{ fontSize: 17, lineHeight: 22 }}>
                      {t}
                    </Text>
                    <Text variant="meta" color="muted" style={{ fontSize: 12 }}>
                      {todayCount(t)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={() => pick('papers')}
              style={[styles.papersLink, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="label" color="accent">
                  Papers & Reports
                </Text>
                <Text variant="headline" style={{ fontSize: 16, lineHeight: 21.5 }}>
                  Peer-reviewed studies, preprints and official reports your sources linked to
                </Text>
              </View>
              <ChevronIcon size={16} color={colors.ink} />
            </Pressable>

            <Text variant="body" color="muted" style={styles.note}>
              Results are listed newest first. Nothing is ranked for you.
            </Text>
          </>
        ) : (
          <>
            {!none ? (
              <Text variant="label" color="muted" style={{ marginTop: 14 }}>
                {total} {noun} · {scope === 'all' ? 'all sources' : 'your sources'} · newest first
              </Text>
            ) : null}

            {showGoTo ? (
              <View style={{ marginTop: 12 }}>
                {goTo.map((g) => (
                  <Pressable key={g.key} accessibilityRole="link" onPress={g.go} style={[styles.goTo, { borderBottomColor: colors.rule }]}>
                    <View style={[styles.goMark, { borderColor: name === 'ink' ? '#4A443C' : '#C9BFAE' }]}>
                      <Text variant="headline" medium color="accent" style={{ fontSize: 15, lineHeight: 18 }}>
                        {g.mark}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="headline" lang={g.lang !== 'en' ? g.lang : undefined} style={{ fontSize: 17, lineHeight: 22 }}>
                        {g.label}
                      </Text>
                      <Text variant="meta" color="muted" style={{ fontSize: 12 }}>
                        {g.meta}
                      </Text>
                    </View>
                    <ChevronIcon size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {kind !== 'more' && ((showStories && stories.length) || (showPapers && papers.length)) ? (
              <View style={{ marginTop: 16 }}>
                <View style={{ paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.ink }}>
                  <Text variant="label" medium accessibilityRole="header">
                    {kind === 'papers' ? 'Papers & reports' : kind === 'stories' ? 'Stories' : 'Stories & papers'}
                  </Text>
                </View>
                {showStories
                  ? stories.map((s) => <Hit key={s.id} story={s} q={q} mark={mark} onOpen={() => open(s.id)} />)
                  : null}
                {showPapers
                  ? papers.map((p) => (
                      <View key={p.id} style={[styles.hit, { borderBottomColor: colors.rule }]}>
                        <View style={styles.hitMain}>
                          <Text variant="label" color="accent" style={{ letterSpacing: 0.7 }}>
                            {p.label}
                          </Text>
                          <Highlighted text={p.title} q={q} mark={mark} />
                          <Text variant="meta" color="muted" style={{ fontSize: 12 }}>
                            {p.where} · {ago(p.minsAgo)}
                          </Text>
                        </View>
                      </View>
                    ))
                  : null}
              </View>
            ) : null}

            {none ? (
              <View style={{ paddingVertical: 28, gap: 10 }}>
                <Text variant="headline">Nothing matches “{query.trim()}”.</Text>
                <Text variant="ui" color="muted" style={{ fontSize: 14 }}>
                  Try fewer words or a different spelling{scope === 'mine' ? ', or search all sources' : ''}.
                </Text>
                {scope === 'mine' ? (
                  <Pressable accessibilityRole="button" onPress={() => setScope('all')} style={[styles.widen, { borderColor: colors.ink }]}>
                    <Text variant="ui" medium style={{ fontSize: 14 }}>
                      Search all sources
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function Highlighted({ text, q, mark, lang }: { text: string; q: string; mark: string; lang?: 'hi' | 'mr' }) {
  const i = norm(text).indexOf(q);
  const style = { fontSize: 17, lineHeight: 22 };
  if (i < 0)
    return (
      <Text variant="headline" medium lang={lang} style={style}>
        {text}
      </Text>
    );
  return (
    <Text variant="headline" medium lang={lang} style={style}>
      {text.slice(0, i)}
      <Text variant="headline" medium lang={lang} style={[style, { backgroundColor: mark }]}>
        {text.slice(i, i + q.length)}
      </Text>
      {text.slice(i + q.length)}
    </Text>
  );
}

function Hit({ story, q, mark, onOpen }: { story: Story; q: string; mark: string; onOpen: () => void }) {
  const { sourceById } = useNews();
  const { colors } = useTheme();
  return (
    <View style={[styles.hit, { borderBottomColor: colors.rule }]}>
      <Pressable {...storyLink} accessibilityRole="link" onPress={onOpen} style={styles.hitMain}>
        <Text variant="label" color="accent" style={{ letterSpacing: 0.7 }}>
          {story.topic}
        </Text>
        <Highlighted text={story.headline} q={q} mark={mark} lang={story.lang !== 'en' ? story.lang : undefined} />
        <Text variant="meta" color="muted" style={{ fontSize: 12 }}>
          {sourceById(story.sourceId).name} · {ago(story.minsAgo)}
        </Text>
      </Pressable>
      <View style={{ marginTop: 8, marginRight: -12 }}>
        <SaveButton story={story} size={18} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: 32, paddingHorizontal: 32, paddingBottom: 72 },
  h1: { fontSize: 48, lineHeight: 50, letterSpacing: -0.6, marginBottom: 18 },
  field: { height: 54, paddingLeft: 16, paddingRight: 6, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  input: { flex: 1, minWidth: 0, height: 40, fontSize: 18, outlineStyle: 'none' as never },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scopes: { marginTop: 12, flexDirection: 'row', borderWidth: 1 },
  scope: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  kinds: { marginTop: 12, flexDirection: 'row', gap: 20, borderBottomWidth: 1 },
  kind: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 5, borderBottomWidth: 2, marginBottom: -1 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  recent: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  recentMain: { flex: 1, height: 46, flexDirection: 'row', alignItems: 'center', gap: 12 },
  remove: { width: 44, height: 44, marginRight: -12, alignItems: 'center', justifyContent: 'center' },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 24 },
  topic: {
    flexGrow: 1,
    flexBasis: 200,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
  },
  papersLink: { marginTop: 22, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1 },
  note: { marginTop: 20, textAlign: 'center', fontStyle: 'italic', fontSize: 14, lineHeight: 20 },
  goTo: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1 },
  goMark: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  hit: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderBottomWidth: 1 },
  hitMain: { flex: 1, minWidth: 0, gap: 5, paddingVertical: 12 },
  widen: { alignSelf: 'flex-start', marginTop: 4, height: 44, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1 },
});
