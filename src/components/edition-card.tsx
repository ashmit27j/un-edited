import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Wordmark } from '@/components/wordmark';
import { useTheme } from '@/theme/theme-provider';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The little newspaper card on the sign-in screen. Decorative; the headline is made up. */
export function EditionCard({ width = 250 }: { width?: number }) {
  const { colors } = useTheme();
  const now = new Date();
  const date = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.card, { width, backgroundColor: colors.surface, borderColor: colors.rule }]}>
      <Wordmark size={20} />
      <View style={[styles.strip, { borderTopColor: colors.ink, borderBottomColor: colors.ink }]}>
        <Text variant="label" color="muted" style={styles.stripText}>
          Edition Nº 1
        </Text>
        <Text variant="label" color="muted" style={styles.stripText}>
          {date}
        </Text>
      </View>
      <View style={[styles.photo, { backgroundColor: colors.photo }]} />
      <Text variant="headline" style={styles.headline}>
        Water board clears a 24-hour supply pilot for three wards
      </Text>
      <View style={[styles.bar, { width: '80%', backgroundColor: colors.rule }]} />
      <View style={[styles.bar, { width: '60%', backgroundColor: colors.rule }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, paddingBottom: 18, gap: 8 },
  strip: {
    borderTopWidth: 2,
    borderBottomWidth: 1,
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stripText: { fontSize: 9, lineHeight: 12, letterSpacing: 0.6 },
  photo: { height: 70 },
  headline: { fontSize: 15, lineHeight: 18 },
  bar: { height: 5 },
});
