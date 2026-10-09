import { TabList, Tabs, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedIcon, HomeIcon, LibraryIcon, YouIcon, type IconProps } from '@/components/icons';
import { Text } from '@/components/text';
import { WebNav } from '@/components/web-nav';
import { TouchTarget } from '@/constants/theme';
import { useColourCues, useTarget } from '@/hooks/use-a11y';
import { useLayout } from '@/hooks/use-layout';
import { useTourTarget, type TourTarget } from '@/tour/tour';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  Icon: ComponentType<IconProps>;
  tour?: TourTarget;
};

/** Bottom bar tab: icon over label, active in accent. */
function TabButton({ label, Icon, isFocused, tour, ...props }: TabButtonProps) {
  const { colors } = useTheme();
  const tourRef = useTourTarget(tour ?? 'tabLibrary');
  const target = useTarget();
  // With colour cues on, the active tab is underlined as well as coloured.
  const cue = useColourCues() && isFocused;
  const color = isFocused ? colors.accent : colors.muted;
  return (
    <View ref={tour ? tourRef : undefined} style={styles.bottomTab}>
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={[styles.bottomTab, { minHeight: target }]}>
      <Icon color={color} />
      <Text
        variant="meta"
        medium={isFocused}
        style={[{ color, fontSize: 11, lineHeight: 14 }, cue && { textDecorationLine: 'underline' }]}>
        {label}
      </Text>
    </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const wide = useLayout() !== 'phone';
  const t = useT();
  const barRef = useTourTarget('tabbar');

  // TabTriggers must sit directly inside <TabList> (or a fragment): expo-router/ui only finds them there.
  const triggers = (
    <>
      <TabTrigger name="home" href="/home" asChild>
        <TabButton label={t('nav.home')} Icon={HomeIcon} />
      </TabTrigger>
      <TabTrigger name="feed" href="/feed" asChild>
        <TabButton label={t('nav.feed')} Icon={FeedIcon} />
      </TabTrigger>
      <TabTrigger name="library" href="/library" asChild>
        <TabButton label={t('nav.library')} Icon={LibraryIcon} tour="tabLibrary" />
      </TabTrigger>
      <TabTrigger name="you" href="/you" asChild>
        <TabButton label={t('nav.you')} Icon={YouIcon} tour="tabYou" />
      </TabTrigger>
    </>
  );

  return (
    <Tabs>
      {wide ? (
        <>
          {/* Web 768px+: the routes still register through a hidden TabList; WebNav is the visible top nav. */}
          <TabList style={styles.hidden}>{triggers}</TabList>
          <WebNav />
        </>
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
          {/* Tour target for "Four places, always here": a plain view the size of the bar. */}
          <View ref={barRef} pointerEvents="none" style={StyleSheet.absoluteFill} />
          {triggers}
        </TabList>
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  hidden: { display: 'none' },
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
});
