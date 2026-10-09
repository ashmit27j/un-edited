import { TabList, Tabs, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentType } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedIcon, HomeIcon, LibraryIcon, YouIcon, type IconProps } from '@/components/icons';
import { Text } from '@/components/text';
import { ThemeToggle } from '@/components/theme-toggle';
import { Wordmark } from '@/components/wordmark';
import { MaxContentWidth, TouchTarget, WideBreakpoint } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  Icon: ComponentType<IconProps>;
  wide: boolean;
};

/** Active tab in accent. Bottom bar: icon over label. Top nav: label with an accent underline. */
function TabButton({ label, Icon, wide, isFocused, ...props }: TabButtonProps) {
  const { colors } = useTheme();
  const color = isFocused ? colors.accent : colors.muted;

  if (wide) {
    return (
      <Pressable
        {...props}
        accessibilityRole="tab"
        accessibilityState={{ selected: !!isFocused }}
        style={[styles.topTab, { borderBottomColor: isFocused ? colors.accent : 'transparent' }]}>
        <Text variant="ui" medium={isFocused} style={{ color, fontSize: 14.5 }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={styles.bottomTab}>
      <Icon color={color} />
      <Text variant="meta" medium={isFocused} style={{ color, fontSize: 11, lineHeight: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= WideBreakpoint;

  const triggers = (
    <>
      <TabTrigger name="home" href="/home" asChild>
        <TabButton label="Home" Icon={HomeIcon} wide={wide} />
      </TabTrigger>
      <TabTrigger name="feed" href="/feed" asChild>
        <TabButton label="Feed" Icon={FeedIcon} wide={wide} />
      </TabTrigger>
      <TabTrigger name="library" href="/library" asChild>
        <TabButton label="Library" Icon={LibraryIcon} wide={wide} />
      </TabTrigger>
      <TabTrigger name="you" href="/you" asChild>
        <TabButton label="You" Icon={YouIcon} wide={wide} />
      </TabTrigger>
    </>
  );

  // TabTriggers must sit directly inside <TabList> (or a fragment): expo-router/ui only
  // finds them there, so the wordmark is a sibling of the triggers, not a wrapper.
  const topPadding = Math.max(32, (width - MaxContentWidth) / 2 + 32);

  return (
    <Tabs>
      {wide ? (
        <TabList
          style={[
            styles.topNav,
            { borderBottomColor: colors.rule, backgroundColor: colors.bg, paddingHorizontal: topPadding },
          ]}>
          <View style={styles.wordmark}>
            <Wordmark size={28} />
          </View>
          {triggers}
          <View style={styles.toggleSpace} />
        </TabList>
      ) : null}
      {wide ? (
        // Outside TabList: expo-router/ui only expects triggers (and plain views) in there.
        <View style={[styles.toggle, { right: topPadding }]}>
          <ThemeToggle />
        </View>
      ) : null}

      <View style={styles.slot}>
        <TabSlot />
      </View>

      {wide ? null : (
        <TabList
          style={[
            styles.bottomList,
            { backgroundColor: colors.bg, borderTopColor: colors.rule, paddingBottom: Math.max(insets.bottom, 10) },
          ]}>
          {triggers}
        </TabList>
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  bottomList: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomTab: {
    flex: 1,
    minHeight: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  topNav: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordmark: { marginRight: 'auto' },
  toggleSpace: { width: 44 },
  toggle: { position: 'absolute', top: 12 },
  topTab: {
    height: 66,
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
});
