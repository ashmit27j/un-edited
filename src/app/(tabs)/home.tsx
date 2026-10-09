import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { Byline, StoryRow, useOpenStory, storyLink } from '@/components/story';
import { Text } from '@/components/text';
import { Photo, Rule, Screen, SectionHeader, useGutter } from '@/components/ui';
import { NotifyAsk } from '@/components/notify-ask';
import { OfflineScreen, useOnline } from '@/components/states';
import { WideHome } from '@/components/wide/home';
import { Wordmark } from '@/components/wordmark';
import { useLayout } from '@/hooks/use-layout';
import { useTour, useTourTarget } from '@/tour/tour';
import { WideBreakpoint } from '@/constants/theme';
import { editionNumber, sourceById } from '@/data/sample';
import { useNews } from '@/data/news';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { coverage, onePerEvent, useStories } from '@/store/selectors';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Home() {
  const { papers: PAPERS, live } = useNews();
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const gutter = useGutter();
  const { status } = useSession();
  const { prefs, firstSeen, recent } = useReader();
  const { mine, outside, all } = useStories();
  const open = useOpenStory();
  const t = useT();
  const wide = width >= WideBreakpoint;
  const comfortable = prefs.homeView === 'comfortable';

  const now = new Date();
  const date = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const edition =
    status === 'signedIn' && firstSeen ? `${t('home.edition')} Nº ${editionNumber(firstSeen)}` : t('home.edition');

  const events = onePerEvent(mine);
  const lead = events[0];
  const mostCovered = [...events]
    .sort((a, b) => coverage(b, mine) - coverage(a, mine) || a.minsAgo - b.minsAgo)
    .filter((s) => s.id !== lead?.id)
    .slice(0, 4);
  const topics = prefs.topics.slice(0, 3);
  const continueReading = recent
    .map((id) => all.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .slice(0, 3);
  const layout = useLayout();
  const stripRef = useTourTarget('strip');
  const leadRef = useTourTarget('lead');
  const searchRef = useTourTarget('search');
  const { startIfNew } = useTour();
  const online = useOnline();
  const { onboarded } = useReader();
  // First time a phone reader reaches Home after setup: the tour (once).
  useEffect(() => {
    if (onboarded && layout === 'phone') startIfNew();
  }, [onboarded, layout, startIfNew]);

  if (!online)
    return (
      <Screen>
        <OfflineScreen />
      </Screen>
    );

  if (layout !== 'phone') {
    const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const used = new Set([lead?.id, ...mostCovered.map((s) => s.id)]);
    return (
      <WideHome
        edition={edition}
        date={`${FULL_DAYS[now.getDay()]}, ${now.getDate()} ${FULL_MONTHS[now.getMonth()]} ${now.getFullYear()}`}
        lead={lead}
        mine={mine}
        mostCovered={[...events]
          .sort((a, b) => coverage(b, mine) - coverage(a, mine) || a.minsAgo - b.minsAgo)
          .filter((s) => s.id !== lead?.id)
          .slice(0, 5)}
        topics={topics
          .map((name) => ({ name, items: onePerEvent(mine.filter((s) => s.topic === name && !used.has(s.id))).slice(0, 3) }))
          .filter((t) => t.items.length)}
        trending={
          prefs.front.trending
            ? onePerEvent(mine)
                .sort((a, b) => coverage(b, mine) - coverage(a, mine))
                .slice(0, 3)
            : []
        }
        continueReading={prefs.front.continueReading ? continueReading : []}
        outside={prefs.front.outside ? onePerEvent(outside).slice(0, 3) : []}
      />
    );
  }

  return (
    <Screen>
      {wide ? null : (
        <View style={styles.top}>
          <Wordmark size={26} />
        </View>
      )}
      <NotifyAsk />
      <View ref={stripRef} style={[styles.strip, { borderTopColor: colors.ink, borderBottomColor: colors.ink }]}>
        <Text variant="label" color="muted">
          {edition}
        </Text>
        <View style={{ flex: 1 }} />
        <Text variant="label" color="muted">
          {date}
        </Text>
        <Pressable
          ref={searchRef}
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={() => router.push('/search')}
          style={[styles.search, { marginRight: -12 }]}>
          <SearchIcon size={20} color={colors.ink} />
        </Pressable>
      </View>

      {!lead ? (
        <View style={{ paddingVertical: 48, gap: 8 }}>
          <Text variant="display">Nothing from your sources yet.</Text>
          <Text variant="body" color="muted">
            Pick outlets in You › Your news and your front page will fill in.
          </Text>
        </View>
      ) : (
        <View style={wide ? styles.leadRow : undefined}>
          <View ref={leadRef} style={wide ? { flex: 3 } : undefined}>
            <Pressable
              {...storyLink}
              accessibilityRole="link"
              accessibilityLabel={lead.headline}
              onPress={() => open(lead.id)}
              style={{ gap: 10, paddingTop: 20 }}>
              {comfortable ? <Photo uri={lead.imageUrl} credit={lead.credit} height={wide ? 340 : 210} /> : null}
              <Text variant="label" color="accent">
                {lead.topic} ·{' '}
                {coverage(lead, mine) > 1 ? `${coverage(lead, mine)} of your sources` : sourceById(lead.sourceId).name}
              </Text>
              <Text
                variant="display"
                lang={lead.lang !== 'en' ? lead.lang : undefined}
                style={wide ? { fontSize: 40, lineHeight: 44 } : undefined}>
                {lead.headline}
              </Text>
              <Text variant="body" color="muted" numberOfLines={3} lang={lead.lang !== 'en' ? lead.lang : undefined}>
                {lead.body[0]}
              </Text>
            </Pressable>
            <Byline story={lead} />
          </View>
          {wide ? <View style={{ width: 48 }} /> : null}
          <View style={wide ? { flex: 2 } : undefined}>
            {mostCovered.length ? (
              <>
                <SectionHeader title="Most covered" onMore={() => router.push('/feed')} />
                {mostCovered.map((s, i) => (
                  <StoryRow key={s.id} story={s} number={i + 1} />
                ))}
              </>
            ) : null}
          </View>
        </View>
      )}

      {topics.map((topic) => {
        const items = onePerEvent(mine.filter((s) => s.topic === topic && s.id !== lead?.id)).slice(0, 3);
        if (!items.length) return null;
        return (
          <View key={topic}>
            <SectionHeader title={topic} onMore={() => router.push({ pathname: '/search', params: { q: topic } })} />
            {items.map((s) => (
              <StoryRow key={s.id} story={s} thumb={comfortable && wide} />
            ))}
          </View>
        );
      })}

      {prefs.front.trending ? (
        <View>
          <SectionHeader title="Trending" onMore={() => router.push('/feed')} />
          {onePerEvent(mine)
            .sort((a, b) => coverage(b, mine) - coverage(a, mine))
            .slice(0, 3)
            .map((s) => (
              <StoryRow key={s.id} story={s} />
            ))}
        </View>
      ) : null}

      {prefs.front.papers ? (
        <View>
          <SectionHeader
            title="Papers & Reports"
            onMore={() => router.push({ pathname: '/search', params: { q: 'paper' } })}
          />
          {PAPERS.map((p) => (
            <View key={p.id} style={[styles.paper, { borderBottomColor: colors.rule }]}>
              <Text variant="label" color="accent">
                {p.label}
              </Text>
              <Text variant="headline" style={{ fontSize: 19, lineHeight: 24 }}>
                {p.title}
              </Text>
              <Text variant="meta" color="muted">
                {p.where}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {prefs.front.continueReading && continueReading.length ? (
        <View>
          <SectionHeader title="Continue reading" onMore={() => router.push('/library')} />
          {continueReading.map((s) => (
            <StoryRow key={s.id} story={s} />
          ))}
        </View>
      ) : null}

      {prefs.front.outside && outside.length ? (
        <View>
          <SectionHeader title="Outside your sources" />
          <Text variant="meta" color="muted" style={{ marginBottom: 4 }}>
            Not from the outlets you picked. Shown so you can see beyond them.
          </Text>
          {onePerEvent(outside)
            .slice(0, 3)
            .map((s) => (
              <StoryRow key={s.id} story={s} />
            ))}
        </View>
      ) : null}

      <Rule strong style={{ marginTop: 40 }} />
      <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
        <Text variant="headline" style={{ fontStyle: 'italic' }}>
          {t('home.endOfEdition')}
        </Text>
        <Text variant="meta" color="muted">
          Next edition · 6:00 AM tomorrow
        </Text>
        {live ? null : (
          <Text variant="meta" color="muted" style={{ marginTop: 12, textAlign: 'center', paddingHorizontal: gutter }}>
            Sample stories from made-up outlets. Live feeds are not connected yet.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    borderTopWidth: 1.5,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  search: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  leadRow: { flexDirection: 'row', alignItems: 'flex-start' },
  paper: { paddingVertical: 14, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
});
