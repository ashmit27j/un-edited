import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/components/stamp';
import { Photo } from '@/components/ui';
import type { Story } from '@/data/sample';
import { useLayout } from '@/hooks/use-layout';
import { useReader } from '@/store/reader-provider';

const canHover = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * A story's thumbnail on web: the photo, or its video when there is one.
 *  - Mouse and trackpad: the video plays (muted, looping) while the pointer is over the thumbnail.
 *  - Phone layout / touch: as in the app, only with "Play thumbnail videos" on and the story on screen (`play`).
 * Reduce motion keeps the photo. The video only loads once it is asked to play.
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
  const phone = useLayout() === 'phone';
  const box = useRef<View>(null);
  const [hovered, setHovered] = useState(false);
  const hover = !phone && canHover();

  useEffect(() => {
    const node = box.current as unknown as HTMLElement | null;
    if (!node || !hover || !story.videoUrl) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    node.addEventListener('mouseenter', enter);
    node.addEventListener('mouseleave', leave);
    return () => {
      node.removeEventListener('mouseenter', enter);
      node.removeEventListener('mouseleave', leave);
    };
  }, [hover, story.videoUrl]);

  const playing = !!story.videoUrl && !reduced && (hover ? hovered : !!play && prefs.playVideos);
  return (
    <View ref={box}>
      <Photo uri={story.imageUrl} credit={story.credit} height={height} style={style}>
        {playing ? (
          <video
            src={story.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </Photo>
    </View>
  );
}
