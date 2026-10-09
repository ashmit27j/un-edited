import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { StoryRow } from '@/components/story';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { BackHeader, Screen } from '@/components/ui';

import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';
import { useStoryList } from '@/data/news';

/** A Library folder (FolderEmpty board): status line with ↓ Download / Remove, then the saved stories. */
export default function Folder() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { folders, downloaded, downloadedFolders, toggleFolderDownload } = useReader();
  const ids = folders[name] ?? [];
  const stories = useStoryList(ids);
  const on = downloadedFolders.includes(name);
  const offline = stories.filter((s) => downloaded.includes(s.id)).length;
  const status = on ? 'downloaded' : offline ? `${offline} downloaded` : 'online only';
  const t = useT();

  return (
    <Screen maxWidth={720} header={<BackHeader title="Library" />}>
      <Text variant="display" medium accessibilityRole="header" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.5 }}>
        {name}
      </Text>
      <View style={[styles.status, { borderBottomColor: colors.ink }]}>
        <Text variant="label" color="muted" accessibilityLiveRegion="polite">
          {stories.length} {stories.length === 1 ? 'article' : 'articles'} · {status}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={on ? 'Remove downloads from this folder' : 'Download all articles in this folder'}
          accessibilityState={{ selected: on }}
          onPress={() => toast.show(toggleFolderDownload(name) ? `${name} will stay downloaded` : `Downloads removed from ${name}`)}
          style={styles.dl}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={on ? colors.ink : colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d={on ? 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5' : 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14'} />
          </Svg>
          <Text variant="label" style={{ color: on ? colors.ink : colors.accent }}>
            {on ? t('library.remove') : t('library.download')}
          </Text>
        </Pressable>
      </View>

      {stories.length === 0 ? (
        <View style={styles.empty}>
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.2} strokeLinejoin="round">
            <Path d="M6 3.5h12v17l-6-4-6 4z" />
          </Svg>
          <Text variant="headline" style={{ fontSize: 26, lineHeight: 30, textAlign: 'center' }}>
            Nothing saved yet.
          </Text>
          <Text variant="body" color="muted" style={{ fontSize: 16.5, lineHeight: 25, textAlign: 'center' }}>
            Save a story to this folder and it lands here. Saving does not download. Tap Download to keep the whole folder for
            reading offline.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            <Button label="Go to today’s edition" onPress={() => router.navigate('/home')} />
          </View>
        </View>
      ) : (
        stories.map((s) => <StoryRow key={s.id} story={s} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, marginTop: 6 },
  dl: { height: 36, marginRight: -8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 64 },
});
