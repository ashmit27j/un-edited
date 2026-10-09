import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Text } from '@/components/text';
import { useReducedMotion } from '@/components/stamp';
import { MaxContentWidth, NarrowColumn } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/theme/theme-provider';

/**
 * Web pages at 768px and wider: 1200px max including the 32px side padding, so content lines up with the
 * wordmark. 768–1023px: one column, 720px max. The document scrolls (see +html.tsx), so the ScrollView just grows.
 */
export function WidePage({ children, top = 32, bottom = 72 }: { children: ReactNode; top?: number; bottom?: number }) {
  const { colors } = useTheme();
  const layout = useLayout();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 32, paddingTop: top, paddingBottom: bottom }}>
      <View style={{ width: '100%', maxWidth: layout === 'webFull' ? MaxContentWidth - 64 : NarrowColumn, alignSelf: 'center' }}>
        {children}
      </View>
    </ScrollView>
  );
}

/** Sidebar + main column. Main is up to 760px; the sidebar takes what's left (at least 200px). */
export function TwoColumn({
  side,
  children,
  sideWidth = 220,
  gap = 56,
  style,
}: {
  side: ReactNode;
  children: ReactNode;
  sideWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    // Wraps to one column (side above main) when the page is narrower than both columns.
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', columnGap: gap, rowGap: 32 }, style]}>
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: sideWidth, minWidth: 0 }}>{side}</View>
      <View style={{ flexGrow: 999, flexShrink: 1, flexBasis: 560, minWidth: 0, maxWidth: 760 }}>{children}</View>
    </View>
  );
}

/** Mono section heading over an ink rule (WebYou). */
export function WideSectionTitle({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.ink }}>
      <Text variant="label" medium style={{ fontSize: 11.5 }} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

/** One line-drawn front page: masthead rules, a headline bar and two columns of text lines. */
function Paper({ w, h }: { w: number; h: number }) {
  const { colors, name } = useTheme();
  const line = name === 'ink' ? '#4A443C' : '#C2B6A2';
  const mid = Math.round(w / 2);
  const right = w - 12;
  const col = mid - 5;
  const rows: string[] = [];
  for (let y = 50; y <= h - 10; y += 9) {
    const short = (y - 50) % 36 === 27;
    rows.push(`M12 ${y}H${short ? 12 + Math.round((col - 12) * 0.55) : col}`);
    rows.push(`M${col + 10} ${y}H${short ? col + 10 + Math.round((right - col - 10) * 0.55) : right}`);
  }
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" stroke={line} strokeWidth={1.1} strokeLinecap="round">
      <Rect x={1} y={1} width={w - 2} height={h - 2} fill={colors.bg} />
      <Path d={`M12 20H${right}M12 24H${right}`} />
      <Path d={`M${mid - 26} 13H${mid + 26}`} strokeWidth={2.4} />
      <Path d={`M12 36H${Math.round(w * 0.66)}`} strokeWidth={2.4} />
      <Path d={rows.join('')} />
    </Svg>
  );
}

const PAPERS = [
  { w: 160, h: 124, left: '2%', rotate: -8, delay: 150 },
  { w: 180, h: 136, left: '32%', rotate: 2, delay: 300 },
  { w: 156, h: 118, left: '62%', rotate: 8, delay: 450 },
] as const;

/**
 * Three newspapers peeking up from behind the "You're all caught up" block (MOTION.md §6, web):
 * rise 90px and fade in over 1.2s, cubic-bezier(.16,.8,.24,1), staggered 0.15 / 0.3 / 0.45s,
 * starting when the block scrolls into view. Reduced motion: shown in place, already tilted.
 * Put this first inside a `position: relative` block that has the page background.
 */
export function PeekPapers() {
  const reduced = useReducedMotion();
  const host = useRef<View>(null);
  const [values] = useState(() => PAPERS.map(() => new Animated.Value(0)));

  useEffect(() => {
    if (reduced) {
      values.forEach((v) => v.setValue(1));
      return;
    }
    const run = () =>
      Animated.parallel(
        values.map((v, i) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 1200,
            delay: PAPERS[i].delay,
            easing: Easing.bezier(0.16, 0.8, 0.24, 1),
            useNativeDriver: false,
          }),
        ),
      ).start();
    const node = host.current as unknown as Element | null;
    if (typeof IntersectionObserver === 'undefined' || !node) return run();
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduced, values]);

  return (
    <View ref={host} pointerEvents="none" style={StyleSheet.absoluteFill} aria-hidden>
      {PAPERS.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: 26 - p.h,
            opacity: values[i],
            transform: [
              { translateY: values[i].interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) },
              { rotate: values[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotate}deg`] }) },
            ],
          }}>
          <Paper w={p.w} h={p.h} />
        </Animated.View>
      ))}
    </View>
  );
}
