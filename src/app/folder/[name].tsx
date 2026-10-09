import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { StoryRow } from '@/components/story';
import { Text } from '@/components/text';
import { BackHeader, Screen } from '@/components/ui';
import { storyById } from '@/data/sample';
import { useReader } from '@/store/reader-provider';

export default function Folder() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { folders, downloaded } = useReader();
  const ids = folders[name] ?? [];
  const stories = ids.map((id) => storyById(id)).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <Screen maxWidth={720} header={<BackHeader title={name} />}>
      <Text variant="display">{name}</Text>
      <Text variant="meta" color="muted" style={{ marginTop: 4 }}>
        {stories.length} {stories.length === 1 ? 'article' : 'articles'} ·{' '}
        {stories.filter((s) => downloaded.includes(s.id)).length} downloaded
      </Text>
      {stories.length === 0 ? (
        <View style={{ paddingVertical: 48, gap: 8 }}>
          <Text variant="headline">Nothing saved here yet.</Text>
          <Text variant="body" color="muted">
            Tap the bookmark on any story to save it. It goes to Saved, and you can move it to a folder afterwards.
          </Text>
        </View>
      ) : (
        stories.map((s) => <StoryRow key={s.id} story={s} />)
      )}
    </Screen>
  );
}
