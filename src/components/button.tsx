import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/text';
import { TouchTarget } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  /** primary: filled ink. secondary: ink outline. link: muted, underlined. */
  kind?: 'primary' | 'secondary' | 'link';
  busy?: boolean;
};

/** Square corners, sentence case, 500 weight, 44px minimum touch target. */
export function Button({ label, kind = 'primary', busy, disabled, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const off = disabled || busy;

  const container =
    kind === 'primary'
      ? { backgroundColor: colors.ink, height: 52 }
      : kind === 'secondary'
        ? { borderColor: colors.ink, borderWidth: 1, height: 52 }
        : { height: TouchTarget };
  const textColor = kind === 'primary' ? colors.bg : kind === 'link' ? colors.muted : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      {...rest}
      style={({ pressed }) => [styles.base, container, { opacity: off ? 0.45 : pressed ? 0.8 : 1 }]}>
      {busy ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          variant="ui"
          medium={kind !== 'link'}
          style={[{ color: textColor, fontSize: kind === 'link' ? 15 : 16 }, kind === 'link' && styles.underline]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  underline: { textDecorationLine: 'underline' },
});
