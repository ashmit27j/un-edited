import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

/** "Un" + two-dot colon in accent, "edited" in ink. Baskervville Bold. */
export function Wordmark({ size = 28 }: { size?: number }) {
  const { colors } = useTheme();
  const dot = Math.max(4, Math.round(size * 0.18));
  const text = { fontFamily: Fonts.wordmark, fontSize: size, lineHeight: size * 1.1, letterSpacing: -size * 0.014 };

  return (
    <View accessible accessibilityRole="header" accessibilityLabel="Un:edited" style={styles.row}>
      <Text style={[text, { color: colors.accent }]}>Un</Text>
      <View style={[styles.dots, { gap: dot * 0.9, marginHorizontal: dot * 0.6, paddingTop: dot * 0.6 }]}>
        <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: colors.accent }} />
        <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: colors.accent }} />
      </View>
      <Text style={[text, { color: colors.ink }]}>edited</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dots: { flexDirection: 'column' },
});
