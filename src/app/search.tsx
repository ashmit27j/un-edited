import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CloseIcon, SearchIcon } from '@/components/icons';
import { StoryRow } from '@/components/story';
import { Text } from '@/components/text';
import { BackHeader, Chip, Rule, Screen, Segmented, SectionHeader } from '@/components/ui';
import { WideSearch } from '@/components/wide/search';
import { Fonts, TouchTarget } from '@/constants/theme';
import { PAPERS, SOURCES, STORIES, TOPICS } from '@/data/sample';
import { useLayout } from '@/hooks/use-layout';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

const norm = (s: string) => s.toLowerCase();

export default function Search() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const { prefs, searches, addSearch, clearSearches, hidden } = useReader();
  const [typed, setQuery] = useState<string | null>(null);
  const query = typed ?? params.q ?? '';
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const layout = useLayout();
  const t = useT();

  const q = norm(query.trim());
  const stories = useMemo(() => {
    if (!q) return [];
    return STORIES.filter((s) => !hidden.includes(s.id))
      .filter((s) => scope === 'all' || prefs.sources.includes(s.sourceId))
      .filter((s) => norm(`${s.headline} ${s.topic} ${s.body.join(' ')}`).includes(q))
      .sort((a, b) => a.minsAgo - b.minsAgo);
  }, [q, scope, prefs.sources, hidden]);
  const papers = q ? PAPERS.filter((p) => norm(`${p.title} ${p.label}`).includes(q) || 'paper'.includes(q) && q.length > 2) : [];
  const sources = q ? SOURCES.filter((s) => norm(s.name).includes(q)) : [];

  if (layout !== 'phone') return <WideSearch initial={params.q ?? ''} />;

  const input = (
    <View style={[styles.field, { borderColor: colors.ink, backgroundColor: colors.surface }]}>
      <SearchIcon size={20} color={colors.muted} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => addSearch(query)}
        placeholder={t('search.placeholder')}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoFocus={!params.q}
        accessibilityLabel="Search"
        style={[styles.input, { color: colors.ink }]}
      />
      {query ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}>
          <CloseIcon size={18} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Screen maxWidth={720} header={<BackHeader title="Search" />}>
      {input}

      {!q ? (
        <>
          {searches.length ? (
            <View>
              <SectionHeader title="Recent searches" onMore={clearSearches} moreLabel="Clear all" />
              <View style={styles.wrap}>
                {searches.map((s) => (
                  <Chip key={s} label={s} onPress={() => setQuery(s)} />
                ))}
              </View>
            </View>
          ) : null}
          <SectionHeader title="Browse by topic" />
          <View style={styles.wrap}>
            {TOPICS.map((t) => (
              <Chip key={t} label={t} onPress={() => setQuery(t)} />
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={{ marginTop: 16 }}>
            <Segmented
              value={scope}
              onChange={setScope}
              options={[
                { value: 'mine', label: 'Your sources' },
                { value: 'all', label: 'All sources' },
              ]}
            />
          </View>
          <Text variant="meta" color="muted" style={{ marginTop: 12 }}>
            Results are listed newest first. Nothing is ranked for you.
          </Text>

          {stories.length ? (
            <>
              <SectionHeader title={`Stories · ${stories.length}`} />
              {stories.map((s) => (
                <StoryRow key={s.id} story={s} />
              ))}
            </>
          ) : null}

          {papers.length ? (
            <>
              <SectionHeader title="Papers & Reports" />
              {papers.map((p) => (
                <View key={p.id} style={{ paddingVertical: 12, gap: 4 }}>
                  <Text variant="label" color="accent">
                    {p.label}
                  </Text>
                  <Text variant="headline" style={{ fontSize: 19, lineHeight: 24 }}>
                    {p.title}
                  </Text>
                  <Text variant="meta" color="muted">
                    {p.where}
                  </Text>
                  <Rule />
                </View>
              ))}
            </>
          ) : null}

          {sources.length ? (
            <>
              <SectionHeader title="Sources" />
              {sources.map((s) => (
                <View key={s.id} style={{ paddingVertical: 10 }}>
                  <Text variant="headline" lang={s.lang !== 'en' ? s.lang : undefined} style={{ fontSize: 19 }}>
                    {s.name}
                  </Text>
                  <Text variant="meta" color="muted">
                    {s.kind} · {s.place}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {!stories.length && !papers.length && !sources.length ? (
            <View style={{ paddingVertical: 40, gap: 8 }}>
              <Text variant="headline">Nothing matches “{query.trim()}”.</Text>
              <Text variant="body" color="muted">
                Try fewer words or a different spelling{scope === 'mine' ? ', or search all sources' : ''}.
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderWidth: 1, paddingLeft: 14 },
  input: { flex: 1, height: '100%', fontFamily: Fonts.sans, fontSize: 16, outlineStyle: 'none' as never },
  clear: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
