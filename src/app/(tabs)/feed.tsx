import { useMemo, useRef, useState, type RefObject } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Byline, useOpenStory, storyLink } from '@/components/story';
import { Text } from '@/components/text';
import { Fade, Photo, Rule, Screen, Segmented, useGutter } from '@/components/ui';
import { OfflineScreen, useOnline } from '@/components/states';
import { WideFeed } from '@/components/wide/feed';
import { useLayout } from '@/hooks/use-layout';
import { useTourTarget } from '@/tour/tour';
import { sourceById, type Story } from '@/data/sample';
import { useReader } from '@/store/reader-provider';
import { coverage, useStories } from '@/store/selectors';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

const TODAY = 'Today';

export default function Feed() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  const { prefs } = useReader();
  const { mine, outside } = useStories();
  const open = useOpenStory();
  const [mode, setMode] = useState<'mine' | 'explore'>('mine');
  const [category, setCategory] = useState(TODAY);
  const [pageHeight, setPageHeight] = useState(0);
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Story | 'end'>>(null);
  const modeRef = useTourTarget('feedMode');
  const storyRef = useTourTarget('feedStory');
  const layout = useLayout();
  const online = useOnline();
  const t = useT();

  const categories = [TODAY, ...prefs.topics];
  const base = mode === 'mine' ? mine : outside;
  const items = useMemo(
    () => (category === TODAY ? base : base.filter((s) => s.topic === category)),
    [base, category],
  );

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, backgroundColor: colors.bg }}>
      <View style={{ width: '100%', alignSelf: 'center' }}>
        <View ref={modeRef}>
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m);
            setIndex(0);
          }}
          options={[
            { value: 'mine', label: t('feed.mine') },
            { value: 'explore', label: t('feed.explore') },
          ]}
        />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
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
          ? `That’s everything your ${prefs.sources.length} sources published${category === TODAY ? ' today' : ` on ${category}`}. You can stop here, or keep going.`
          : 'That’s everything outside your sources for now.'}
      </Text>
      <View style={{ width: 260 }}>
        <Button
          label={mode === 'mine' ? 'Go to Explore' : 'Back to My Feed'}
          onPress={() => {
            setMode(mode === 'mine' ? 'explore' : 'mine');
            setIndex(0);
          }}
        />
      </View>
      <Text variant="meta" color="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Sample stories from made-up outlets.
      </Text>
    </View>
  );

  if (!online)
    return (
      <Screen>
        <OfflineScreen />
      </Screen>
    );
  if (layout !== 'phone') return <WideFeed />;

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
        {pageHeight > 0 ? (
          <FlatList
            ref={list}
            data={data}
            keyExtractor={(item) => (item === 'end' ? 'end' : item.id)}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, i) => ({ length: pageHeight, offset: pageHeight * i, index: i })}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.y / pageHeight))}
            renderItem={({ item }) => (
              <View style={{ height: pageHeight, paddingHorizontal: gutter }}>
                {item === 'end' ? (
                  caughtUp
                ) : (
                  <FeedCard
                    story={item}
                    sources={coverage(item, base)}
                    onOpen={() => open(item.id)}
                    position={`${items.indexOf(item) + 1} of ${items.length} today`}
                    pageHeight={pageHeight}
                    tourRef={items.indexOf(item) === 0 ? storyRef : undefined}
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
        {items.length === 0 ? (
          <View style={{ position: 'absolute', inset: 0 as never, padding: gutter, justifyContent: 'center' }}>
            <Text variant="display">Nothing here yet.</Text>
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
  tourRef,
}: {
  story: Story;
  sources: number;
  onOpen: () => void;
  position?: string;
  pageHeight?: number;
  /** The first story is the tour's "Swipe left or right" target: photo, kicker and headline. */
  tourRef?: RefObject<View | null>;
}) {
  const { colors } = useTheme();
  const lang = story.lang !== 'en' ? story.lang : undefined;
  const kicker = `${story.topic} · ${sources > 1 ? `${sources} of your sources` : sourceById(story.sourceId).name}`;

  return (
    <View style={{ flex: 1, paddingTop: 16 }}>
      <Pressable {...storyLink} accessibilityRole="link" accessibilityLabel={story.headline} onPress={onOpen} style={{ flex: 1, gap: 10 }}>
        <View ref={tourRef} style={{ gap: 10 }}>
          <Photo credit={story.credit} height={Math.min(260, (pageHeight ?? 600) * 0.34)} />
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
  stepper: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth },
});
