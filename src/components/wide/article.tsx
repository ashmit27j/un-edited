import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BackIcon } from '@/components/icons';
import { ReadingBody } from '@/components/reading-line';
import { Stamp } from '@/components/stamp';
import { openOriginal } from '@/lib/open-original';
import { MoreButton, SaveButton, SITE_URL, storyLink, useOpenStory } from '@/components/story';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { Photo } from '@/components/ui';
import { Wordmark } from '@/components/wordmark';
import { MaxContentWidth } from '@/constants/theme';
import { PRIMARY_SOURCE, ago, groupOf, sourceById, type Story } from '@/data/sample';
import { useNews } from '@/data/news';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
/** The As published stamp sits in the right margin, and only where there is room for it. */
const STAMP_MIN_WIDTH = 1080;

/** Article on web at 768px and wider (WebArticle): web top bar, one 720px column, source tabs. */
export function WideArticle({ story }: { story: Story }) {
  const { stories: STORIES } = useNews();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const open = useOpenStory();
  const { width } = useWindowDimensions();
  const { prefs, setPrefs } = useReader();
  const [sizing, setSizing] = useState(false);
  const t = useT();

  const source = sourceById(story.sourceId);
  const group = groupOf(story);
  const lang = story.lang !== 'en' ? story.lang : undefined;
  const related = STORIES.filter((s) => s.id !== story.id && s.group !== story.group && s.topic === story.topic)
    .concat(STORIES.filter((s) => s.id !== story.id && s.group !== story.group && s.topic !== story.topic))
    .slice(0, 3);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: story.headline }} />
      <View style={[styles.bar, { borderBottomColor: colors.rule }]}>
        <View style={styles.barInner}>
          <Pressable accessibilityRole="link" onPress={back} style={styles.back}>
            <BackIcon size={18} color={colors.ink} />
            <Text variant="ui" style={{ fontSize: 14 }}>
              Today’s edition
            </Text>
          </Pressable>
          <Pressable accessibilityRole="link" accessibilityLabel="Un:edited home" onPress={() => router.replace('/home')}>
            <Wordmark size={22} />
          </Pressable>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Text size"
              accessibilityState={{ expanded: sizing }}
              onPress={() => setSizing(!sizing)}
              style={styles.aa}>
              <Text variant="body" style={{ fontSize: 17 }}>
                Aa
              </Text>
            </Pressable>
            {sizing ? (
              <View style={[styles.sizes, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
                <Text variant="label" color="muted" style={{ paddingHorizontal: 4 }}>
                  Text size
                </Text>
                <View accessibilityRole="radiogroup" style={[styles.sizeRow, { borderColor: colors.ink }]}>
                  {SIZES.map((label, i) => {
                    const on = prefs.textSize === i;
                    return (
                      <Pressable
                        key={label}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        onPress={() => setPrefs({ textSize: i })}
                        style={[styles.size, { backgroundColor: on ? colors.ink : 'transparent' }]}>
                        <Text variant="ui" medium={on} style={{ fontSize: 14, color: on ? colors.bg : colors.ink }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.main}>
        {width >= STAMP_MIN_WIDTH ? (
          <Stamp kind="published" size={120} style={styles.stamp} />
        ) : null}

        <Text variant="label" color="accent">
          {story.topic}
          {group.length > 1 ? ` · Covered by ${group.length} of your sources` : ` · ${source.name}`}
        </Text>
        <Text variant="display" accessibilityRole="header" lang={lang} style={styles.h1}>
          {story.headline}
        </Text>

        {group.length > 1 ? (
          <View style={{ gap: 2 }}>
            <Text variant="label" color="muted">
              Source:
            </Text>
            <View accessibilityRole="tablist" accessibilityLabel="Read this story from" style={[styles.tabs, { borderBottomColor: colors.rule }]}>
              {group.map((s) => {
                const on = s.id === story.id;
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    onPress={() => router.replace({ pathname: '/article/[id]', params: { id: s.id } })}
                    style={[styles.tab, { borderBottomColor: on ? colors.accent : 'transparent' }]}>
                    <Text variant="ui" medium={on} color={on ? 'ink' : 'muted'}>
                      {sourceById(s.sourceId).name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={[styles.byline, { borderBottomColor: colors.rule }]}>
          <Text variant="meta" color="muted" style={{ fontSize: 13, flexShrink: 1 }}>
            {source.name} · {ago(story.minsAgo)} · {story.excerptOnly ? 'Excerpt' : 'Full text from the publisher’s feed'}
          </Text>
          <View style={styles.actions}>
            <SaveButton story={story} size={18} withText />
            <View style={[styles.divider, { backgroundColor: colors.rule }]} />
            <MoreButton story={story} />
          </View>
        </View>

        <View style={{ marginTop: 8, gap: 8 }}>
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel="View image full screen"
            onPress={() => router.push({ pathname: '/image/[id]', params: { id: story.id } })}>
            <Photo uri={story.imageUrl} height={400} />
          </Pressable>
          <Text variant="label" color="muted" style={{ letterSpacing: 0.7 }}>
            {story.credit}
          </Text>
        </View>

        <ReadingBody paragraphs={story.body} lang={lang} style={styles.para} />

        <Pressable
          accessibilityRole="link"
          onPress={() => (story.url ? openOriginal(story.url) : toast.show('This is a sample story, so there is no original to open.'))}
          style={[styles.continue, { borderColor: colors.ink }]}>
          <Text variant="ui" medium>
            {t('story.continueOn', { source: source.name })}
          </Text>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M8 16L16 8M9 8h7v7" />
          </Svg>
        </Pressable>

        {story.group === 'water' ? (
          <View style={[styles.primary, { borderTopColor: colors.ink, borderBottomColor: colors.rule }]}>
            <Text variant="label" color="accent">
              Primary source
            </Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(SITE_URL).catch(() => {})}>
              <Text variant="headline" style={{ fontSize: 18, lineHeight: 24, textDecorationLine: 'underline' }}>
                {PRIMARY_SOURCE.title}
              </Text>
            </Pressable>
            <Text variant="meta" color="muted">
              {PRIMARY_SOURCE.note}
            </Text>
          </View>
        ) : null}

        {related.length ? (
          <>
            <Text variant="label" medium style={{ marginTop: 22, fontSize: 11.5 }} accessibilityRole="header">
              Related stories
            </Text>
            <View style={styles.related}>
              {related.map((s) => (
                <Pressable key={s.id} {...storyLink} accessibilityRole="link" onPress={() => open(s.id)} style={styles.relatedItem}>
                  <Photo uri={s.imageUrl} height={120} />
                  <Text variant="headline" lang={s.lang !== 'en' ? s.lang : undefined} style={{ fontSize: 17, lineHeight: 22 }}>
                    {s.headline}
                  </Text>
                  <Text variant="meta" color="muted" style={{ fontSize: 12 }}>
                    {sourceById(s.sourceId).name} · {ago(s.minsAgo)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text variant="body" color="muted" style={styles.footnote}>
          Shown in the publishers’ own words. Nothing here is rewritten.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1 },
  barInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 32,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    zIndex: 5,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 },
  aa: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sizes: { position: 'absolute', right: 0, top: 48, padding: 10, gap: 8, borderWidth: 1, width: 260 },
  sizeRow: { flexDirection: 'row', borderWidth: 1 },
  size: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  main: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingTop: 44, paddingHorizontal: 24, paddingBottom: 80, gap: 18 },
  stamp: { position: 'absolute', left: '100%', top: 150, marginLeft: 8, transform: [{ rotate: '-8deg' }] },
  h1: { fontSize: 48, lineHeight: 51, letterSpacing: -0.7 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 26, borderBottomWidth: 1 },
  tab: { height: 46, justifyContent: 'center', borderBottomWidth: 2, marginBottom: -1 },
  byline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 16,
    rowGap: 4,
    borderBottomWidth: 1,
  },
  actions: { flexDirection: 'row', alignItems: 'center', marginRight: -10 },
  divider: { width: 1, height: 20 },
  para: { fontSize: 21, lineHeight: 34 },
  continue: {
    marginTop: 10,
    alignSelf: 'flex-start',
    height: 50,
    paddingHorizontal: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primary: { marginTop: 18, paddingVertical: 14, gap: 6, borderTopWidth: 1, borderBottomWidth: 1 },
  related: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  relatedItem: { flexGrow: 1, flexShrink: 1, flexBasis: 200, minWidth: 0, gap: 8 },
  footnote: { marginTop: 28, textAlign: 'center', fontStyle: 'italic', fontSize: 15, lineHeight: 22 },
});
