import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { Fonts } from '@/constants/theme';
import { ago } from '@/data/sample';
import { useNews, useStory } from '@/data/news';

/**
 * Full image view (ImageView board). Always dark, whatever the theme, so the photo reads as a photo.
 * Shows the publisher's credit and caption exactly as published (sample stories have no caption).
 */
export default function ImageView() {
  const { sourceById } = useNews();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const story = useStory(id);
  const close = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/article/[id]', params: { id } }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close image" onPress={close} style={[styles.close, { top: insets.top + 12 }]}>
        <CloseIcon size={22} color="#D6CEC0" />
      </Pressable>
      <View accessible accessibilityRole="image" accessibilityLabel={story ? `Photo. ${story.credit}` : 'Photo'} style={styles.photo}>
        {story?.imageUrl ? <Image source={{ uri: story.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="contain" /> : null}
      </View>
      {story ? (
        <View style={[styles.caption, { paddingBottom: insets.bottom + 34 }]}>
          <Text variant="label" style={{ color: '#C8705F' }}>
            {story.credit}
          </Text>
          <RNText style={styles.from}>
            From {sourceById(story.sourceId).name} · {ago(story.minsAgo)}
          </RNText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141311', justifyContent: 'center' },
  close: { position: 'absolute', left: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  photo: { height: 292, backgroundColor: '#2D2924' },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 18, paddingHorizontal: 24, gap: 8, borderTopWidth: 1, borderTopColor: '#38332D' },
  from: { fontFamily: Fonts.sans, fontSize: 12.5, color: '#8E8678' },
});
