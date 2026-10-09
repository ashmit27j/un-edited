import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * Rubber-stamp marks (docs/current-config.md §2). Max one per screen.
 * Paper = oxblood, Ink = coral. "Capped" is the heavier-inked variant.
 * Never use these to say "verified" or "fact-checked".
 */
export type StampKind = 'brand' | 'published' | 'free';

const sources = {
  brand: {
    paper: { plain: require('@/assets/stamps/stamp-brand-paper.svg'), capped: require('@/assets/stamps/stamp-brand-paper-capped.svg') },
    ink: { plain: require('@/assets/stamps/stamp-brand-ink.svg'), capped: require('@/assets/stamps/stamp-brand-ink-capped.svg') },
  },
  published: {
    paper: { plain: require('@/assets/stamps/stamp-published-paper.svg'), capped: require('@/assets/stamps/stamp-published-paper-capped.svg') },
    ink: { plain: require('@/assets/stamps/stamp-published-ink.svg'), capped: require('@/assets/stamps/stamp-published-ink-capped.svg') },
  },
  free: {
    paper: { plain: require('@/assets/stamps/stamp-free-paper.svg'), capped: require('@/assets/stamps/stamp-free-paper-capped.svg') },
    ink: { plain: require('@/assets/stamps/stamp-free-ink.svg'), capped: require('@/assets/stamps/stamp-free-ink-capped.svg') },
  },
};

const labels: Record<StampKind, string> = {
  brand: 'Un:edited stamp: Every story, as it was written. 2026.',
  published: 'As published stamp: word for word, not rewritten.',
  free: 'Free stamp: free for everyone, always. No ads, no paywall.',
};

type StampProps = {
  kind: StampKind;
  capped?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function Stamp({ kind, capped = false, size = 96, style }: StampProps) {
  const { name } = useTheme();
  const source = sources[kind][name][capped ? 'capped' : 'plain'];

  return (
    <View style={[{ width: size, height: size }, style]}>
      {/* expo-image freezes the page on web with these SVGs, so web uses React Native's Image (an <img>). */}
      {Platform.OS === 'web' ? (
        <Image source={source} resizeMode="contain" style={styles.fill} accessibilityLabel={labels[kind]} />
      ) : (
        <ExpoImage source={source} contentFit="contain" style={styles.fill} accessibilityLabel={labels[kind]} alt={labels[kind]} />
      )}
    </View>
  );
}

/** True when the reader asked the system to reduce motion. Starts true so nothing flashes. */
export function useReducedMotion() {
  const { prefs } = useReader();
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => live && setReduced(value));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduced || prefs.reduceMotion;
}

/**
 * Stamps down onto the page: drops in, overshoots, settles, with a ring that fades out.
 * With reduced motion it simply appears in place.
 */
export function StampDown({ delay = 700, ...props }: StampProps & { delay?: number }) {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const size = props.size ?? 96;
  const [drop] = useState(() => new Animated.Value(0));
  const [ring] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) return;
    const run = Animated.parallel([
      Animated.timing(drop, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1, duration: 500, delay: delay + 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]);
    run.start();
    return () => run.stop();
  }, [reduced, delay, drop, ring]);

  if (reduced) return <Stamp {...props} />;

  return (
    <View style={props.style} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.accent,
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.5] }) }],
          },
        ]}
      />
      <Animated.View
        style={{
          opacity: drop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-34, 0] }) },
            { scale: drop.interpolate({ inputRange: [0, 1], outputRange: [2.1, 1] }) },
            { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '0deg'] }) },
          ],
        }}>
        <Stamp {...props} style={undefined} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  ring: { position: 'absolute', borderWidth: 2 },
});
