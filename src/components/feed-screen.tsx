import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Byline, useOpenStory, storyLink } from '@/components/story';
import { Text } from '@/components/text';
import { Fade, Rule, Screen, useGutter } from '@/components/ui';
import { StoryMedia } from '@/components/story-media';
import { OfflineScreen, useOnline } from '@/components/states';
import { WideFeed } from '@/components/wide/feed';
import { useLayout } from '@/hooks/use-layout';
import { useTourTarget } from '@/tour/tour';
import { type Story } from '@/data/sample';
import { useReader } from '@/store/reader-provider';
import { coverage, useStories } from '@/store/selectors';
import { useTheme } from '@/theme/theme-provider';
import { useNews } from '@/data/news';
import { useT } from '@/lib/i18n';

const TODAY = 'Today';

/**
 * Feed and Explore. Phones: two tabs, one story per screen. Feed is only the reader's outlets; when it runs
 * out, "Go to Explore" switches to the Explore tab (everyone else). Web (768px+) keeps both in one page with
 * the My Feed / Explore switch in the sidebar.
 *
 * Stories that arrive while the reader is here don't move the story they're on: they wait above it, and a
 * "N new stories" pill takes the reader up to them.
 */
export function FeedScreen({ mode }: { mode: 'mine' | 'explore' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  const router = useRouter();
  const { prefs } = useReader();
  const { mine, outside } = useStories();
  const open = useOpenStory();
  const [category, setCategory] = useState(TODAY);
  const [pageHeight, setPageHeight] = useState(0);
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Story | 'end'>>(null);
  const storyRef = useTourTarget('feedStory');
  const layout = useLayout();
  const online = useOnline();
  const { live, status } = useNews();
  const t = useT();

  const base = mode === 'mine' ? mine : outside;
  // The stories the reader has been shown so far. Anything else is new since they arrived.
  // Taken once the news has loaded (adjusting state while rendering, not in an effect), and again if the app
  // moves from sample stories to live ones, so the switch doesn't count as "new".
  const [seen, setSeen] = useState<{ ids: Set<string>; live: boolean } | null>(null);
  if (status !== 'loading' && base.length && (!seen || seen.live !== live)) setSeen({ ids: new Set(base.map((s) => s.id)), live });
  const known = seen?.ids ?? null;

  const categories = [TODAY, ...prefs.topics];
  const inCategory = useMemo(() => (category === TODAY ? base : base.filter((s) => s.topic === category)), [base, category]);
  const items = useMemo(() => (known ? inCategory.filter((s) => known.has(s.id)) : inCategory), [inCategory, known]);
  const fresh = known ? inCategory.length - items.length : 0;

  const showNew = () => {
    setSeen({ ids: new Set(base.map((s) => s.id)), live });
    setIndex(0);
    list.current?.scrollToOffset({ offset: 0, animated: !prefs.reduceMotion });
  };

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, backgroundColor: colors.bg }}>
      <View style={{ width: '100%', alignSelf: 'center' }}>
        <Text variant="label" color={mode === 'mine' ? 'muted' : 'accent'} style={{ paddingTop: 4 }}>
          {mode === 'mine'
            ? `${t('feed.mine')} · ${prefs.sources.length} ${prefs.sources.length === 1 ? 'source' : 'sources'}`
            : `${t('feed.explore')} · Not from your sources`}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          {categories.map((c) => {
            const on = c === category;
            return (
              <Pressable
                key={c}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setCategory(c);
                  setIndex(0);
                }}
                style={[styles.category, { borderBottomColor: on ? colors.accent : 'transparent' }]}>
                <Text variant="ui" medium={on} color={on ? 'accent' : 'muted'}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Rule />
      </View>
    </View>
  );

  const caughtUp = (
    <View style={styles.caughtUp}>
      <Rule style={{ width: 48, backgroundColor: colors.ink }} />
      <Text variant="display" style={{ fontStyle: 'italic', textAlign: 'center' }}>
        {t('feed.caughtUp')}
      </Text>
      <Text variant="body" color="muted" style={{ textAlign: 'center', maxWidth: 420 }}>
        {mode === 'mine'
          ? `That’s everything your ${prefs.sources.length} sources published${category === TODAY ? ' today' : ` on ${category}`}. You can stop here, or keep going in Explore.`
          : 'That’s everything outside your sources for now.'}
      </Text>
      <View style={{ width: 260 }}>
        <Button
          label={mode === 'mine' ? 'Go to Explore' : 'Back to My Feed'}
          onPress={() => router.navigate(mode === 'mine' ? '/explore' : '/feed')}
        />
      </View>
      {live ? null : (
        <Text variant="meta" color="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          Sample stories from made-up outlets.
        </Text>
      )}
    </View>
  );

  if (!online)
    return (
      <Screen>
        <OfflineScreen />
      </Screen>
    );
  if (layout !== 'phone') return <WideFeed initialMode={mode} />;

  const data: (Story | 'end')[] = [...items, 'end'];
  // "Buttons instead of swiping" (You › Accessibility): Previous / Next under the story.
  const go = (to: number) => {
    const i = Math.max(0, Math.min(data.length - 1, to));
    list.current?.scrollToIndex({ index: i, animated: !prefs.reduceMotion });
    setIndex(i);
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}
      <View style={{ flex: 1 }} onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
        {pageHeight > 0 && items.length > 0 ? (
          <FlatList
            ref={list}
            data={data}
            keyExtractor={(item) => (item === 'end' ? 'end' : item.id)}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, i) => ({ length: pageHeight, offset: pageHeight * i, index: i })}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.y / pageHeight))}
            renderItem={({ item, index: i }) => (
              <View style={{ height: pageHeight, paddingHorizontal: gutter }}>
                {item === 'end' ? (
                  caughtUp
                ) : (
                  <FeedCard
                    story={item}
                    sources={coverage(item, base)}
                    onOpen={() => open(item.id)}
                    position={`${i + 1} of ${items.length} today`}
                    pageHeight={pageHeight}
                    active={i === index}
                    outside={mode === 'explore'}
                    tourRef={i === 0 ? storyRef : undefined}
                  />
                )}
              </View>
            )}
          />
        ) : null}
        {!prefs.swipeButtons && index === 0 && items.length > 0 ? (
          <Text variant="label" color="muted" style={styles.swipe} pointerEvents="none">
            Swipe up ↑
          </Text>
        ) : null}
        {fresh > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${fresh} new ${fresh === 1 ? 'story' : 'stories'}. Show them`}
            onPress={showNew}
            style={[styles.pill, { backgroundColor: colors.ink }]}>
            <Text variant="ui" medium style={{ color: colors.bg, fontSize: 14 }}>
              {fresh} new {fresh === 1 ? 'story' : 'stories'} ↑
            </Text>
          </Pressable>
        ) : null}
        {items.length === 0 ? (
          <View style={{ flex: 1, padding: gutter, justifyContent: 'center', gap: 16 }}>
            <Text variant="display">Nothing here yet.</Text>
            <Text variant="body" color="muted">
              {mode === 'mine'
                ? `Your sources haven’t published${category === TODAY ? '' : ` on ${category}`} yet. Explore has stories from everyone else.`
                : 'Nothing outside your sources in this section yet.'}
            </Text>
            {mode === 'mine' ? (
              <View style={{ width: 260 }}>
                <Button label="Go to Explore" kind="secondary" onPress={() => router.navigate('/explore')} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {prefs.swipeButtons && items.length > 0 ? (
        <View style={[styles.stepper, { backgroundColor: colors.bg, borderTopColor: colors.rule, paddingHorizontal: gutter - 8 }]}>
          <Button label="Previous" kind="link" disabled={index === 0} onPress={() => go(index - 1)} />
          <Button label="Next" kind="link" disabled={index >= data.length - 1} onPress={() => go(index + 1)} />
        </View>
      ) : null}
    </View>
  );
}

function FeedCard({
  story,
  sources,
  onOpen,
  position,
  pageHeight,
  active,
  outside,
  tourRef,
}: {
  story: Story;
  sources: number;
  onOpen: () => void;
  position?: string;
  pageHeight?: number;
  /** The story on screen: only its thumbnail video may play. */
  active?: boolean;
  outside?: boolean;
  /** The first story is the tour's "Swipe left or right" target: photo, kicker and headline. */
  tourRef?: RefObject<View | null>;
}) {
  const { sourceById } = useNews();
  const { colors } = useTheme();
  const lang = story.lang !== 'en' ? story.lang : undefined;
  const name = sourceById(story.sourceId).name;
  const kicker = `${story.topic} · ${sources > 1 ? `${sources} ${outside ? 'outlets' : 'of your sources'}` : name}`;

  return (
    <View style={{ flex: 1, paddingTop: 16 }}>
      <Pressable {...storyLink} accessibilityRole="link" accessibilityLabel={story.headline} onPress={onOpen} style={{ flex: 1, gap: 10 }}>
        <View ref={tourRef} style={{ gap: 10 }}>
          <StoryMedia story={story} height={Math.min(260, (pageHeight ?? 600) * 0.34)} play={active} />
          <Text variant="label" color="accent">
            {kicker}
          </Text>
          <Text variant="display" lang={lang} numberOfLines={4}>
            {story.headline}
          </Text>
        </View>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Text variant="body" color="muted" lang={lang}>
            {story.body.join(' ')}
          </Text>
          <Fade />
        </View>
      </Pressable>
      <Byline story={story} />
      {position ? (
        <Text variant="label" color="muted" style={{ paddingBottom: 12, color: colors.muted }}>
          {position}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  category: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderBottomWidth: 2 },
  caughtUp: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 32 },
  swipe: { position: 'absolute', bottom: 12, alignSelf: 'center' },
  pill: { position: 'absolute', top: 12, alignSelf: 'center', height: 40, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 20 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth },
});
