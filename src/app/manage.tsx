import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { BackHeader, Chip, Screen, SectionHeader, SettingRow } from '@/components/ui';
import { REGIONS, TOPICS } from '@/data/sample';
import { useNews } from '@/data/news';
import { useReader } from '@/store/reader-provider';

/** You › Your news: the topics and outlets that build the front page. */
export default function Manage() {
  const { sources: SOURCES } = useNews();
  const toast = useToast();
  const { prefs, setPrefs } = useReader();

  const toggleTopic = (t: string) => {
    const on = prefs.topics.includes(t);
    setPrefs({ topics: on ? prefs.topics.filter((x) => x !== t) : [...prefs.topics, t] });
  };
  const toggleSource = (id: string) => {
    const on = prefs.sources.includes(id);
    if (on && prefs.sources.length === 1) return toast.show('Keep at least one source.');
    setPrefs({ sources: on ? prefs.sources.filter((x) => x !== id) : [...prefs.sources, id] });
  };

  return (
    <Screen maxWidth={720} header={<BackHeader title="Your news" />}>
      <SectionHeader title="Topics" />
      <View style={styles.wrap}>
        {TOPICS.map((t) => (
          <Chip key={t} label={t} on={prefs.topics.includes(t)} onPress={() => toggleTopic(t)} />
        ))}
      </View>

      <SectionHeader title="Places" />
      <View style={styles.wrap}>
        {REGIONS.map((r) => (
          <Chip
            key={r.name}
            label={r.name}
            on={prefs.regions.includes(r.name)}
            onPress={() =>
              setPrefs({
                regions: prefs.regions.includes(r.name) ? prefs.regions.filter((x) => x !== r.name) : [...prefs.regions, r.name],
              })
            }
          />
        ))}
      </View>

      <SectionHeader title="Who you trust" />
      <Text variant="meta" color="muted" style={{ marginBottom: 4 }}>
        My Feed shows only these. {prefs.sources.length} chosen.
      </Text>
      {SOURCES.filter((s) => prefs.sourceLanguages.includes(s.lang) || prefs.sources.includes(s.id)).map((s) => (
        <SettingRow
          key={s.id}
          label={s.name}
          desc={`${s.kind} · ${s.place} · ${s.funding}`}
          on={prefs.sources.includes(s.id)}
          onChange={() => toggleSource(s.id)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
