import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/components/stamp';
import { Photo } from '@/components/ui';
import type { Story } from '@/data/sample';
import { useReader } from '@/store/reader-provider';

/**
 * A story's thumbnail: the photo, or its video when there is one and it may play. In the app that means
 * You › Reading › "Play thumbnail videos" is on (off by default) and the story is the one on screen (`play`).
 * Videos are muted and loop. Reduce motion keeps the photo.
 */
export function StoryMedia({
  story,
  height,
  play,
  style,
}: {
  story: Story;
  height: number;
  play?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { prefs } = useReader();
  const reduced = useReducedMotion();
  const playing = !!story.videoUrl && !!play && prefs.playVideos && !reduced;
  return (
    <Photo uri={story.imageUrl} credit={story.credit} height={height} style={style}>
      {playing ? <ThumbVideo uri={story.videoUrl!} /> : null}
    </Photo>
  );
}

function ThumbVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = true;
  });
  useEffect(() => {
    player.play();
  }, [player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}
