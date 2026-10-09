import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { useReducedMotion } from '@/components/stamp';
import { Text } from '@/components/text';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

/** True while the device has a connection. Starts true so nothing flashes before the first check. */
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)), []);
  return online;
}

/** Offline board: calm, points to downloaded articles, and offers to try again. */
export function OfflineScreen({ lastUpdated }: { lastUpdated?: Date }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { downloaded } = useReader();
  const [checking, setChecking] = useState(false);
  const time = lastUpdated?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const n = downloaded.length;

  return (
    <View style={styles.offline}>
      <View style={styles.status}>
        <View style={[styles.dot, { backgroundColor: colors.muted }]} />
        <Text variant="label" color="muted">
          Offline{time ? ` · last updated ${time}` : ''}
        </Text>
      </View>
      <View style={{ gap: 14 }}>
        <Text variant="display" accessibilityRole="header">
          You’re offline.
        </Text>
        <Text variant="body" color="muted">
          New stories will arrive when you’re back online.{' '}
          {n
            ? `Your ${n} downloaded ${n === 1 ? 'article is' : 'articles are'} on this ${Platform.OS === 'web' ? 'browser' : 'phone'}.`
            : 'Nothing is downloaded yet. Download stories or folders to read them without a connection.'}
        </Text>
        {n ? <Button label="Read downloaded articles" onPress={() => router.navigate('/library')} /> : null}
        <Button
          label={checking ? 'Checking…' : 'Try again'}
          kind="secondary"
          busy={checking}
          onPress={async () => {
            setChecking(true);
            await NetInfo.refresh().catch(() => {});
            setChecking(false);
          }}
        />
      </View>
    </View>
  );
}

/**
 * Loading skeleton (Skeleton board): grey blocks where the lead and rows will be. The whole block pulses its
 * opacity 1 → 0.55 → 1 over 1.8s, ease-in-out, forever (MOTION.md §8). No shimmer. Reduced motion: static.
 */
export function Skeleton({ rows = 3, lead = true }: { rows?: number; lead?: boolean }) {
  const { colors, name } = useTheme();
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced) return;
    const half = { duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' };
    const loop = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 0.55, ...half }), Animated.timing(v, { toValue: 1, ...half })]));
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  const block = name === 'ink' ? '#2D2924' : '#E4DBCC';
  const bar = (height: number, width: `${number}%`, extra?: object) => <View style={[{ height, width, backgroundColor: block }, extra]} />;

  return (
    <Animated.View accessibilityLabel="Loading" accessibilityRole="progressbar" style={{ opacity: v, gap: 10, paddingTop: 16 }}>
      {lead ? (
        <>
          {bar(220, '100%')}
          {bar(10, '46%')}
          {bar(22, '96%')}
          {bar(22, '72%')}
          {bar(12, '88%', { marginTop: 4 })}
          {bar(12, '64%')}
          {bar(10, '34%')}
        </>
      ) : null}
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ gap: 8, paddingTop: 14 }}>
          <View style={{ height: 1, backgroundColor: colors.rule, marginBottom: 6 }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              {bar(14, '94%')}
              {bar(14, '70%')}
              {bar(9, '40%')}
            </View>
            <View style={{ width: 72, height: 72, backgroundColor: block }} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  offline: { flex: 1, justifyContent: 'center', gap: 28, paddingVertical: 48 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
