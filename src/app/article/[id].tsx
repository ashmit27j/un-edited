import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { BackIcon, ChevronIcon } from '@/components/icons';
import { ReadingBody } from '@/components/reading-line';
import { Skeleton } from '@/components/states';
import { Stamp } from '@/components/stamp';
import { openOriginal as openUrl } from '@/lib/open-original';
import { MoreButton, SaveButton, SITE_URL, useOpenStory } from '@/components/story';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Photo, Rule, Screen, useGutter } from '@/components/ui';
import { WideArticle } from '@/components/wide/article';
import { useLayout } from '@/hooks/use-layout';
import { WideBreakpoint } from '@/constants/theme';
import { PRIMARY_SOURCE, ago } from '@/data/sample';
import { useNews, useStory, useStoryBody } from '@/data/news';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

export default function Article() {
  const { groupOf, sourceById } = useNews();
  const { stories: STORIES } = useNews();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  const { width } = useWindowDimensions();
  const { markViewed } = useReader();
  const toast = useToast();
  const open = useOpenStory();
  const story = useStory(id);
  const wide = width >= WideBreakpoint;
  const layout = useLayout();
  const body = useStoryBody(story);
  const { status, ensure } = useNews();
  const [looking, setLooking] = useState(!story);
  useEffect(() => {
    if (story) return;
    let gone = false;
    ensure(id)
      .catch(() => {})
      .finally(() => !gone && setLooking(false));
    return () => {
      gone = true;
    };
  }, [id, story, ensure]);
  const t = useT();

  useEffect(() => {
    if (story) markViewed(story.id);
  }, [story, markViewed]);

  if (!story && (status === 'loading' || looking)) {
    return (
      <Screen maxWidth={720}>
        <Skeleton rows={2} />
      </Screen>
    );
  }

  if (!story) {
    return (
      <Screen maxWidth={720}>
        <Text variant="display">That story isn’t here.</Text>
        <View style={{ height: 16 }} />
        <Button label="Back to Home" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  if (layout !== 'phone') return <WideArticle story={story} />;

  const source = sourceById(story.sourceId);
  const group = groupOf(story);
  const pos = group.findIndex((s) => s.id === story.id);
  const prev = group[(pos - 1 + group.length) % group.length];
  const next = group[(pos + 1) % group.length];
  const related = STORIES.filter((s) => s.topic === story.topic && s.group !== story.group && s.id !== story.id).slice(0, 2);
  const lang = story.lang !== 'en' ? story.lang : undefined;
  const hasPrimary = story.group === 'water';

  const openOriginal = () => {
    if (story.url) openUrl(story.url);
    else toast.show('This is a sample story, so there is no original to open.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: story.headline }} />
      <Screen maxWidth={720} topInset={false}>
        <View style={{ marginHorizontal: -gutter }}>
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel="View image full screen"
            onPress={() => router.push({ pathname: '/image/[id]', params: { id: story.id } })}>
            <Photo uri={story.imageUrl} credit={story.credit} height={wide ? 300 : 240} />
          </Pressable>
          <View style={[styles.imageBar, { top: insets.top + 8, paddingHorizontal: 8 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
              style={[styles.circle, { backgroundColor: colors.surface }]}>
              <BackIcon color={colors.ink} />
            </Pressable>
            <MoreButton story={story} vertical onImage />
          </View>
          <Stamp kind="published" size={84} style={styles.stamp} />
        </View>

        <View style={{ gap: 12, paddingTop: 28 }}>
          <Text variant="label" color="accent">
            {story.topic}
            {group.length > 1 ? ` · Covered by ${group.length} sources` : ''}
          </Text>
          <Text variant="display" lang={lang}>
            {story.headline}
          </Text>
          <Text variant="meta" color="muted" lang={lang}>
            {source.name} · {ago(story.minsAgo)}
          </Text>
          <Rule style={{ marginVertical: 4 }} />
          <ReadingBody paragraphs={body} lang={lang} style={{ fontSize: 18, lineHeight: 29 }} />
          {story.excerptOnly ? (
            <Text variant="meta" color="muted">
              Only an excerpt is available here. The full story is on {source.name}.
            </Text>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <Button label={t('story.continueOn', { source: source.name })} kind="secondary" onPress={openOriginal} />
          </View>
        </View>

        {hasPrimary ? (
          <View style={[styles.primary, { borderColor: colors.rule, backgroundColor: colors.surface }]}>
            <Text variant="label" color="muted">
              Primary source
            </Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(SITE_URL).catch(() => {})}>
              <Text variant="headline" style={{ fontSize: 19, lineHeight: 24 }}>
                {PRIMARY_SOURCE.title}
              </Text>
            </Pressable>
            <Text variant="meta" color="muted">
              {PRIMARY_SOURCE.note}
            </Text>
          </View>
        ) : null}

        {related.length ? (
          <View style={{ marginTop: 32 }}>
            <Text variant="label" color="muted">
              Related stories
            </Text>
            {related.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="link"
                onPress={() => open(s.id)}
                style={[styles.related, { borderBottomColor: colors.rule }]}>
                <Text variant="headline" style={{ fontSize: 19, lineHeight: 24 }}>
                  {s.headline}
                </Text>
                <Text variant="meta" color="muted">
                  {sourceById(s.sourceId).name} · {ago(s.minsAgo)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text variant="meta" color="muted" style={{ marginTop: 32, textAlign: 'center' }}>
          Shown in the publishers’ own words. Nothing here is rewritten.
        </Text>
        <View style={{ height: 72 }} />
      </Screen>

      <View
        style={[
          styles.bar,
          { backgroundColor: colors.bg, borderTopColor: colors.rule, paddingBottom: Math.max(insets.bottom, 8), paddingHorizontal: gutter - 8 },
        ]}>
        <View style={styles.barInner}>
          {group.length > 1 ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Previous source: ${sourceById(prev.sourceId).name}`}
                onPress={() => router.replace({ pathname: '/article/[id]', params: { id: prev.id } })}
                style={styles.nav}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <ChevronIcon size={18} color={colors.ink} />
                </View>
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text variant="ui" medium numberOfLines={1}>
                  {source.name}
                </Text>
                <Text variant="meta" color="muted">
                  Source {pos + 1} of {group.length}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Next source: ${sourceById(next.sourceId).name}`}
                onPress={() => router.replace({ pathname: '/article/[id]', params: { id: next.id } })}
                style={styles.nav}>
                <ChevronIcon size={18} color={colors.ink} />
              </Pressable>
            </>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <SaveButton story={story} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stamp: { position: 'absolute', right: 20, bottom: -36, transform: [{ rotate: '-6deg' }] },
  primary: { marginTop: 32, padding: 18, gap: 6, borderWidth: StyleSheet.hairlineWidth },
  related: { paddingVertical: 14, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  barInner: { flexDirection: 'row', alignItems: 'center', maxWidth: 720, width: '100%', alignSelf: 'center' },
  nav: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
