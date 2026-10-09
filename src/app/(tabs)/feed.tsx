import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Byline, StoryRow, useOpenStory } from '@/components/story';
import { Text } from '@/components/text';
import { Photo, Rule, Segmented, useGutter } from '@/components/ui';
import { WideBreakpoint } from '@/constants/theme';
import { sourceById, type Story } from '@/data/sample';
import { useReader } from '@/store/reader-provider';
import { coverage, useStories } from '@/store/selectors';
import { useTheme } from '@/theme/theme-provider';

const TODAY = 'Today';

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Text that fades into the page, so a story reads as a taste, not a wall. */
function Fade({ height = 90 }: { height?: number }) {
  const { colors } = useTheme();
  const steps = 9;
  return (
    <View pointerEvents="none" style={[styles.fade, { height }]}>
      {Array.from({ length: steps }, (_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: withAlpha(colors.bg, (i + 1) / steps) }} />
      ))}
    </View>
  );
}

export default function Feed() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  const { width } = useWindowDimensions();
  const { prefs } = useReader();
  const { mine, outside } = useStories();
  const open = useOpenStory();
  const [mode, setMode] = useState<'mine' | 'explore'>('mine');
  const [category, setCategory] = useState(TODAY);
  const [pageHeight, setPageHeight] = useState(0);
  const [index, setIndex] = useState(0);
  const wide = width >= WideBreakpoint;

  const categories = [TODAY, ...prefs.topics];
  const base = mode === 'mine' ? mine : outside;
  const items = useMemo(
    () => (category === TODAY ? base : base.filter((s) => s.topic === category)),
    [base, category],
  );

  const header = (
    <View style={{ paddingTop: wide ? 24 : insets.top + 8, paddingHorizontal: gutter, backgroundColor: colors.bg }}>
      <View style={{ maxWidth: wide ? 720 : undefined, width: '100%', alignSelf: 'center' }}>
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m);
            setIndex(0);
          }}
          options={[
            { value: 'mine', label: 'My Feed' },
            { value: 'explore', label: 'Explore' },
          ]}
        />
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
        You’re all caught up.
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

  if (wide) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 64 }}>
          <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' }}>
            {items.map((s) => (
              <FeedCard key={s.id} story={s} sources={coverage(s, base)} onOpen={() => open(s.id)} wide />
            ))}
            {caughtUp}
          </View>
        </ScrollView>
      </View>
    );
  }

  const data: (Story | 'end')[] = [...items, 'end'];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}
      <View style={{ flex: 1 }} onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
        {pageHeight > 0 ? (
          <FlatList
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
                  />
                )}
              </View>
            )}
          />
        ) : null}
        {index === 0 && items.length > 0 ? (
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
    </View>
  );
}

function FeedCard({
  story,
  sources,
  onOpen,
  position,
  pageHeight,
  wide,
}: {
  story: Story;
  sources: number;
  onOpen: () => void;
  position?: string;
  pageHeight?: number;
  wide?: boolean;
}) {
  const { colors } = useTheme();
  const lang = story.lang !== 'en' ? story.lang : undefined;
  const kicker = `${story.topic} · ${sources > 1 ? `${sources} of your sources` : sourceById(story.sourceId).name}`;

  if (wide) {
    return (
      <View style={{ paddingTop: 24 }}>
        <StoryRow story={story} thumb />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, paddingTop: 16 }}>
      <Pressable accessibilityRole="link" accessibilityLabel={story.headline} onPress={onOpen} style={{ flex: 1, gap: 10 }}>
        <Photo credit={story.credit} height={Math.min(260, (pageHeight ?? 600) * 0.34)} />
        <Text variant="label" color="accent">
          {kicker}
        </Text>
        <Text variant="display" lang={lang} numberOfLines={4}>
          {story.headline}
        </Text>
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
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  caughtUp: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 32 },
  swipe: { position: 'absolute', bottom: 12, alignSelf: 'center' },
});
