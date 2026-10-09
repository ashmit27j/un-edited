import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MoreButton, SaveButton, useOpenStory, storyLink } from '@/components/story';
import { Text } from '@/components/text';
import { Fade, Photo } from '@/components/ui';
import { PeekPapers, TwoColumn, WidePage } from '@/components/wide/page';
import { ago, type Story } from '@/data/sample';
import { useLayout } from '@/hooks/use-layout';
import { useReader } from '@/store/reader-provider';
import { coverage, useStories } from '@/store/selectors';
import { useTheme } from '@/theme/theme-provider';
import { useNews } from '@/data/news';
import { useT } from '@/lib/i18n';

const TODAY = 'Today';
const DAY_MINS = 24 * 60;
const PAGE = 20;
const EXCERPT_HEIGHT = 132;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Feed on web at 768px and wider (WebFeed): sections in a sidebar, full stories down the page. */
export function WideFeed() {
  const { colors } = useTheme();
  const { prefs } = useReader();
  const { mine, outside } = useStories();
  const [mode, setMode] = useState<'mine' | 'explore'>('mine');
  const [category, setCategory] = useState(TODAY);
  const [older, setOlder] = useState(false);
  // 768–1023px: one column, so sections become a row of tabs above the stories.
  const compact = useLayout() === 'web';
  const { live } = useNews();
  const t = useT();

  const base = mode === 'mine' ? mine : outside;
  const categories = [TODAY, ...prefs.topics];
  const inCategory = (c: string) => (c === TODAY ? base : base.filter((s) => s.topic === c));
  const { today, earlier } = useMemo(() => {
    const list = category === TODAY ? base : base.filter((s) => s.topic === category);
    return { today: list.filter((s) => s.minsAgo < DAY_MINS), earlier: list.filter((s) => s.minsAgo >= DAY_MINS) };
  }, [base, category]);
  const items = older ? [...today, ...earlier] : today;
  // Full story cards with photos: render 20 at a time, adding more as the reader nears the end.
  const [shown, setShown] = useState(PAGE);
  const more = useRef<View>(null);
  useEffect(() => {
    const node = more.current as unknown as Element | null;
    if (!node || typeof IntersectionObserver === 'undefined' || shown >= items.length) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setShown((n) => n + PAGE), { rootMargin: '1200px' });
    io.observe(node);
    return () => io.disconnect();
  }, [shown, items.length]);

  const now = new Date();
  const date = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const pick = (next: { mode?: 'mine' | 'explore'; category?: string }) => {
    if (next.mode) setMode(next.mode);
    if (next.category) setCategory(next.category);
    setOlder(false);
    setShown(PAGE);
  };

  const side = (
    <View style={{ gap: 24 }}>
      <View style={[styles.modes, { borderBottomColor: colors.rule }]} accessibilityRole="tablist">
        {(
          [
            { value: 'mine', label: t('feed.mine') },
            { value: 'explore', label: t('feed.explore') },
          ] as const
        ).map((m) => {
          const on = m.value === mode;
          return (
            <Pressable
              key={m.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => pick({ mode: m.value })}
              style={[styles.mode, { borderBottomColor: on ? colors.accent : 'transparent' }]}>
              <Text variant="ui" medium={on} color={on ? 'ink' : 'muted'}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {compact ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
          {categories.map((c) => {
            const on = c === category;
            return (
              <Pressable
                key={c}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => pick({ category: c })}
                style={[styles.mode, { flexDirection: 'row', alignItems: 'center', gap: 5, borderBottomColor: on ? colors.ink : 'transparent' }]}>
                <Text variant="ui" medium={on} color={on ? 'ink' : 'muted'} style={{ fontSize: 14.5 }}>
                  {c}
                </Text>
                <Text variant="label" color="muted">
                  {inCategory(c).filter((s) => s.minsAgo < DAY_MINS).length}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
      <View>
        <Text variant="label" color="muted" style={{ paddingBottom: 6 }}>
          Sections
        </Text>
        {categories.map((c) => {
          const on = c === category;
          const n = inCategory(c).filter((s) => s.minsAgo < DAY_MINS).length;
          return (
            <Pressable
              key={c}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => pick({ category: c })}
              style={[styles.section, { borderLeftColor: on ? colors.ink : 'transparent' }]}>
              <Text variant="ui" medium={on} color={on ? 'ink' : 'muted'} style={{ fontSize: 14.5 }}>
                {c}
              </Text>
              <Text variant="meta" color="muted">
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      )}
      <Text variant="meta" color="muted" style={{ lineHeight: 19 }}>
        Stories arrive in the order they were published. Nothing is ranked for you.
      </Text>
    </View>
  );

  return (
    <WidePage top={28}>
      <TwoColumn side={side} sideWidth={200}>
        {items.length === 0 ? (
          <View style={{ gap: 8, paddingBottom: 24 }}>
            <Text variant="display">Nothing here today.</Text>
            <Text variant="body" color="muted">
              {earlier.length
                ? 'Your sources haven’t published in this section today. Older stories are one tap away below.'
                : mode === 'mine'
                  ? 'Pick more outlets in You › Your news, or look in Explore.'
                  : 'Nothing outside your sources in this section.'}
            </Text>
          </View>
        ) : (
          <>
            {items.slice(0, shown).map((s) => (
              <WideStory key={s.id} story={s} sources={coverage(s, base)} />
            ))}
            {shown < items.length ? <View ref={more} style={{ height: 1 }} /> : null}
          </>
        )}

        <View style={{ maxWidth: 560, marginTop: 96 }}>
          <PeekPapers />
          <View accessibilityLabel="All caught up" style={[styles.caught, { backgroundColor: colors.bg, borderTopColor: colors.ink }]}>
            <Text variant="label" color="accent">
              {date} · {older ? 'today plus older stories' : 'end of today’s stories'}
            </Text>
            <Text variant="display" accessibilityRole="header" style={{ fontSize: 40, lineHeight: 44 }}>
              {t('feed.caughtUp')}
            </Text>
            <Text variant="body" color="muted" style={{ fontSize: 19, lineHeight: 29 }}>
              {mode === 'mine'
                ? `That’s everything your ${prefs.sources.length} sources published${category === TODAY ? ' today' : ` on ${category} today`}. You can stop here, or keep going.`
                : 'That’s everything outside your sources for now.'}
            </Text>
            <View style={styles.actions}>
              {!older && earlier.length ? (
                <Pressable accessibilityRole="button" onPress={() => setOlder(true)} style={[styles.action, { backgroundColor: colors.ink }]}>
                  <Text variant="ui" medium style={{ color: colors.bg }}>
                    Older stories in {mode === 'mine' ? 'My Feed' : 'Explore'}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => pick({ mode: mode === 'mine' ? 'explore' : 'mine' })}
                style={[styles.action, { borderWidth: 1, borderColor: colors.ink }]}>
                <Text variant="ui" medium>
                  {mode === 'mine' ? 'Go to Explore' : 'Back to My Feed'}
                </Text>
              </Pressable>
            </View>
            {live ? null : (
              <Text variant="meta" color="muted" style={{ marginTop: 12 }}>
                Sample stories from made-up outlets. Live feeds are not connected yet.
              </Text>
            )}
          </View>
        </View>
      </TwoColumn>
    </WidePage>
  );
}

function WideStory({ story, sources }: { story: Story; sources: number }) {
  const { sourceById } = useNews();
  const { colors } = useTheme();
  const open = useOpenStory();
  const lang = story.lang !== 'en' ? story.lang : undefined;
  const source = sourceById(story.sourceId);
  const kicker = `${story.topic} · ${sources > 1 ? `${sources} of your sources` : source.name}`;
  // Fade only when the text runs past the clip, so a short excerpt stays readable.
  const [clipped, setClipped] = useState(false);

  return (
    <View style={[styles.story, { borderBottomColor: colors.rule }]}>
      <Pressable {...storyLink} accessibilityRole="link" accessibilityLabel={`Open story: ${story.headline}`} onPress={() => open(story.id)}>
        <Photo uri={story.imageUrl} credit={story.credit} height={320} />
      </Pressable>
      <Text variant="label" color="accent">
        {kicker}
      </Text>
      <Pressable {...storyLink} accessibilityRole="link" onPress={() => open(story.id)}>
        <Text variant="display" lang={lang} style={{ fontSize: 36, lineHeight: 40, letterSpacing: -0.4 }}>
          {story.headline}
        </Text>
      </Pressable>
      <View style={[styles.byline, { borderColor: colors.rule }]}>
        <Text variant="meta" color="muted" style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>
          {source.name} · {ago(story.minsAgo)}
        </Text>
        <SaveButton story={story} size={17} withText />
        <MoreButton story={story} />
      </View>
      <View style={{ maxHeight: EXCERPT_HEIGHT, overflow: 'hidden' }}>
        <Text
          variant="body"
          lang={lang}
          style={{ fontSize: 19, lineHeight: 30 }}
          onLayout={(e) => setClipped(e.nativeEvent.layout.height > EXCERPT_HEIGHT)}>
          {story.body.join(' ')}
        </Text>
        {clipped ? <Fade height={72} /> : null}
      </View>
      <Pressable {...storyLink} accessibilityRole="link" onPress={() => open(story.id)} style={styles.read}>
        <Text variant="ui" medium style={{ fontSize: 14.5, textDecorationLine: 'underline' }}>
          Read the story
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modes: { flexDirection: 'row', gap: 4, borderBottomWidth: 1 },
  mode: { height: 44, paddingRight: 12, justifyContent: 'center', borderBottomWidth: 2, marginBottom: -1 },
  section: {
    height: 40,
    paddingLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 2,
  },
  story: { gap: 14, paddingBottom: 40, marginBottom: 40, borderBottomWidth: 1 },
  byline: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1 },
  read: { alignSelf: 'flex-start', height: 44, justifyContent: 'center' },
  caught: { borderTopWidth: 3, paddingTop: 28, gap: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  action: { height: 48, paddingHorizontal: 22, justifyContent: 'center' },
});
