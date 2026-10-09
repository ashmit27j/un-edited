import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NotifyAsk } from '@/components/notify-ask';
import { MoreButton, SaveButton, storyLink, useOpenStory } from '@/components/story';
import { ChevronIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { Photo } from '@/components/ui';
import { WidePage } from '@/components/wide/page';
import { useNews } from '@/data/news';
import { ago, sourceById, type Story } from '@/data/sample';
import { useReader } from '@/store/reader-provider';
import { coverage } from '@/store/selectors';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

/** Home on web at 768px and wider (WebHome). Data comes from the mobile Home so both show the same edition. */
export function WideHome({
  edition,
  date,
  lead,
  mine,
  mostCovered,
  topics,
  trending,
  continueReading,
  outside,
}: {
  edition: string;
  date: string;
  lead?: Story;
  mine: Story[];
  mostCovered: Story[];
  topics: { name: string; items: Story[] }[];
  trending: Story[];
  continueReading: Story[];
  outside: Story[];
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const open = useOpenStory();
  const { prefs } = useReader();
  const comfortable = prefs.homeView === 'comfortable';
  const { papers: PAPERS, live } = useNews();
  const t = useT();

  return (
    <WidePage top={24} bottom={64}>
      <NotifyAsk />
      <View style={[styles.strip, { borderTopColor: colors.ink, borderBottomColor: colors.ink }]}>
        <Text variant="label" color="muted">
          {edition} · {date}
        </Text>
        <Text variant="label" color="muted">
          Next edition 6:00 AM
        </Text>
      </View>

      {!lead ? (
        <View style={{ paddingVertical: 48, gap: 8 }}>
          <Text variant="display">Nothing from your sources yet.</Text>
          <Text variant="body" color="muted">
            Pick outlets in You › Your news and your front page will fill in.
          </Text>
        </View>
      ) : (
        <View style={styles.top}>
          <View style={styles.lead}>
            {comfortable ? (
              <Pressable {...storyLink} accessibilityRole="link" accessibilityLabel="Open lead story" onPress={() => open(lead.id)}>
                <Photo uri={lead.imageUrl} credit={lead.credit} height={380} />
              </Pressable>
            ) : null}
            <Text variant="label" color="accent">
              {lead.topic} ·{' '}
              {coverage(lead, mine) > 1 ? `Covered by ${coverage(lead, mine)} of your sources` : sourceById(lead.sourceId).name}
            </Text>
            <Pressable {...storyLink} accessibilityRole="link" onPress={() => open(lead.id)}>
              <Text variant="display" lang={lead.lang !== 'en' ? lead.lang : undefined} style={styles.leadHeadline}>
                {lead.headline}
              </Text>
            </Pressable>
            <Text variant="body" color="muted" style={styles.dek} numberOfLines={3} lang={lead.lang !== 'en' ? lead.lang : undefined}>
              {coverage(lead, mine) > 1
                ? `${coverage(lead, mine)} outlets report the same story with different emphasis. Open it to read each one in its own words.`
                : lead.body[0]}
            </Text>
            <View style={[styles.leadByline, { borderTopColor: colors.rule }]}>
              <Text variant="meta" color="muted" style={{ fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
                {(lead.group ? mine.filter((s) => s.group === lead.group) : [lead])
                  .map((s) => sourceById(s.sourceId).name)
                  .join(' · ')}{' '}
                · {ago(lead.minsAgo)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SaveButton story={lead} size={17} withText />
                <MoreButton story={lead} />
              </View>
            </View>
          </View>

          {mostCovered.length ? (
            <View style={styles.side}>
              <SectionTitle title={t('home.mostCovered')} />
              {mostCovered.map((s, i) => (
                <Pressable
                  key={s.id}
                  {...storyLink}
                  accessibilityRole="link"
                  onPress={() => open(s.id)}
                  style={[styles.numbered, { borderBottomColor: colors.rule }]}>
                  <Text variant="headline" medium color="accent" style={styles.number}>
                    {i + 1}
                  </Text>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text variant="headline" lang={s.lang !== 'en' ? s.lang : undefined} style={{ fontSize: 19, lineHeight: 24 }}>
                      {s.headline}
                    </Text>
                    <Text variant="meta" color="muted">
                      {coverage(s, mine)} of your sources · {ago(s.minsAgo)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      )}

      {topics.length ? (
        <View style={[styles.grid, { borderTopColor: colors.ink }]}>
          {topics.map((tp) => (
            <View key={tp.name} style={styles.cell}>
              <View style={styles.cellHead}>
                <Text variant="label" medium style={{ fontSize: 11.5 }} accessibilityRole="header">
                  {tp.name}
                </Text>
                <More onPress={() => router.push({ pathname: '/search', params: { q: tp.name } })} />
              </View>
              {comfortable ? <Photo uri={tp.items.find((s) => s.imageUrl)?.imageUrl} height={150} style={{ marginTop: 6, marginBottom: 4 }} /> : null}
              {tp.items.map((s) => (
                <SmallStory key={s.id} story={s} size={18} />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {trending.length ? (
        <Block title="Trending" onMore={() => router.push('/feed')}>
          <View style={styles.row3}>
            {trending.map((s) => (
              <View key={s.id} style={styles.cell}>
                <SmallStory story={s} size={17} />
              </View>
            ))}
          </View>
        </Block>
      ) : null}

      {prefs.front.papers ? (
        <Block title="Papers & Reports" onMore={() => router.push({ pathname: '/search', params: { q: 'paper' } })}>
          <View style={[styles.row3, { gap: 16 }]}>
            {PAPERS.map((p) => (
              <View key={p.id} style={[styles.paper, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text variant="label" color="accent" style={{ letterSpacing: 0.7, flexShrink: 1 }}>
                    {p.label}
                  </Text>
                </View>
                <Text variant="headline" style={{ fontSize: 18, lineHeight: 23 }}>
                  {p.title}
                </Text>
                <Text variant="meta" color="muted">
                  {p.where} · {ago(p.minsAgo)}
                </Text>
              </View>
            ))}
          </View>
        </Block>
      ) : null}

      {continueReading.length ? (
        <Block title="Continue reading" onMore={() => router.push('/library')}>
          <View style={styles.row3}>
            {continueReading.map((s) => (
              <View key={s.id} style={styles.cell}>
                <SmallStory story={s} size={17} />
              </View>
            ))}
          </View>
        </Block>
      ) : null}

      {outside.length ? (
        <View style={{ marginTop: 48 }}>
          <View style={[styles.outsideHead, { borderBottomColor: colors.muted }]}>
            <Text variant="label" medium color="muted" style={{ fontSize: 11.5 }} accessibilityRole="header">
              Outside your sources
            </Text>
          </View>
          <Text variant="meta" color="muted" style={{ marginTop: 8 }}>
            Not from the outlets you picked. Shown so you can see beyond them.
          </Text>
          <View style={styles.row3}>
            {outside.map((s) => (
              <View key={s.id} style={styles.cell}>
                <SmallStory story={s} size={17} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.end}>
        <View style={{ width: 48, height: 1, backgroundColor: colors.ink }} />
        <Text variant="headline" style={{ fontStyle: 'italic', fontSize: 18, lineHeight: 24 }}>
          {t('home.endOfEdition')}
        </Text>
        <Text variant="label" color="muted">
          No AI · No algorithm · No fee
        </Text>
        {live ? null : (
          <Text variant="meta" color="muted" style={{ marginTop: 8 }}>
            Sample stories from made-up outlets. Live feeds are not connected yet.
          </Text>
        )}
      </View>
    </WidePage>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.ink }}>
      <Text variant="label" medium style={{ fontSize: 11.5 }} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

function More({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.more}>
      <Text variant="meta" color="accent" medium>
        {t('home.seeMore')}
      </Text>
      <ChevronIcon size={14} color={colors.accent} />
    </Pressable>
  );
}

function Block({ title, onMore, children }: { title: string; onMore?: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 48 }}>
      <View style={[styles.blockHead, { borderBottomColor: colors.ink }]}>
        <Text variant="label" medium style={{ fontSize: 11.5 }} accessibilityRole="header">
          {title}
        </Text>
        {onMore ? <More onPress={onMore} /> : null}
      </View>
      {children}
    </View>
  );
}

function SmallStory({ story, size }: { story: Story; size: number }) {
  const { colors } = useTheme();
  const open = useOpenStory();
  return (
    <Pressable
      {...storyLink}
      accessibilityRole="link"
      onPress={() => open(story.id)}
      style={[styles.small, { borderBottomColor: colors.rule }]}>
      <Text variant="headline" lang={story.lang !== 'en' ? story.lang : undefined} style={{ fontSize: size, lineHeight: Math.round(size * 1.28) }}>
        {story.headline}
      </Text>
      <Text variant="meta" color="muted">
        {sourceById(story.sourceId).name} · {ago(story.minsAgo)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    borderTopWidth: 3,
    borderBottomWidth: 1,
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  top: { marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 40 },
  lead: { flexGrow: 2, flexShrink: 1, flexBasis: 560, minWidth: 0, gap: 14 },
  leadHeadline: { fontSize: 44, lineHeight: 47, letterSpacing: -0.6 },
  dek: { fontSize: 19, lineHeight: 28.5, maxWidth: 640 },
  leadByline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1 },
  side: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0 },
  numbered: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderBottomWidth: 1 },
  number: { fontSize: 20, lineHeight: 22, width: 18 },
  grid: { marginTop: 48, flexDirection: 'row', flexWrap: 'wrap', columnGap: 40, borderTopWidth: 1 },
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: 280, minWidth: 0 },
  cellHead: { paddingTop: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  more: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  blockHead: {
    marginBottom: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row3: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 40, marginTop: 10 },
  paper: { flexGrow: 1, flexShrink: 1, flexBasis: 280, minWidth: 0, paddingVertical: 16, paddingHorizontal: 18, gap: 10, borderWidth: 1 },
  small: { gap: 5, paddingVertical: 12, borderBottomWidth: 1 },
  outsideHead: { paddingBottom: 10, borderBottomWidth: 1, borderStyle: 'dashed' },
  end: { marginTop: 56, alignItems: 'center', gap: 8 },
});
