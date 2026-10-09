import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/theme-provider';

/** Bottom sheet with a 14px top radius. Centred card on wide screens. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 768;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, wide && styles.rootWide]}>
        <Pressable accessibilityLabel="Close" style={styles.scrim} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            wide ? styles.sheetWide : styles.sheetNarrow,
            { backgroundColor: colors.surface, borderColor: colors.rule, maxHeight: height * 0.85, paddingBottom: insets.bottom + 16 },
          ]}>
          {wide ? null : <View style={[styles.grabber, { backgroundColor: colors.rule }]} />}
          {title ? (
            <Text variant="label" color="muted" style={styles.title}>
              {title}
            </Text>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function SheetRow({
  label,
  hint,
  onPress,
  danger,
}: {
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderTopColor: colors.rule, opacity: pressed ? 0.7 : 1 }]}>
      <Text variant="ui" color={danger ? 'accent' : 'ink'} style={{ fontSize: 16 }}>
        {label}
      </Text>
      {hint ? (
        <Text variant="meta" color="muted">
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  rootWide: { justifyContent: 'center', alignItems: 'center' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,18,15,0.45)' },
  sheet: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 24, paddingTop: 10 },
  sheetNarrow: { borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomWidth: 0 },
  sheetWide: { width: 440, borderRadius: 14, paddingTop: 20 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  title: { marginBottom: 8 },
  row: { minHeight: 52, justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
});
