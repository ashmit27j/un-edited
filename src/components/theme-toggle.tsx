import { Pressable, StyleSheet } from 'react-native';

import { MoonIcon, SunIcon } from '@/components/icons';
import { TouchTarget } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

/** Light / dark switch for the web top nav. Picks Paper or Ink explicitly (You › Reading still offers System). */
export function ThemeToggle() {
  const { name, colors, setPreference } = useTheme();
  const dark = name === 'ink';
  const Icon = dark ? SunIcon : MoonIcon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onPress={() => setPreference(dark ? 'paper' : 'ink')}
      style={({ pressed }) => [styles.button, { borderColor: pressed ? colors.ink : colors.rule }]}>
      <Icon size={20} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: TouchTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
