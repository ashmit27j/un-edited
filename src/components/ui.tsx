import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon, ChevronIcon } from '@/components/icons';
import { emitScroll } from '@/components/reading-line';
import { Text } from '@/components/text';
import { WebNav } from '@/components/web-nav';
import { useTarget, useUnderlineLinks } from '@/hooks/use-a11y';
import { useLayout } from '@/hooks/use-layout';
import { useReader } from '@/store/reader-provider';
import { MaxContentWidth, Spacing, TouchTarget, WideBreakpoint } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

export function useGutter() {
  const { width } = useWindowDimensions();
  return width >= WideBreakpoint ? Spacing.five : Spacing.four;
}

/** Scrolling page with the phone margin and a centred column on wide screens. */
export function Screen({
  children,
  maxWidth = MaxContentWidth,
  topInset = true,
  header,
}: {
  children: ReactNode;
  maxWidth?: number;
  topInset?: boolean;
  header?: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  // Pages outside the tabs (folder, Your news) get the web top nav from 768px.
  const web = useLayout() !== 'phone';
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: topInset && !web ? insets.top : 0 }}>
      {web ? <WebNav /> : null}
      {header}
      <ScrollView
        style={{ flex: 1 }}
        onScroll={emitScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: Spacing.three, paddingBottom: Spacing.six }}>
        <View style={{ width: '100%', maxWidth, alignSelf: 'center' }}>{children}</View>
      </ScrollView>
    </View>
  );
}

/** Top bar for pushed screens: back + title. */
export function BackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const { colors } = useTheme();
  const router = useRouter();
  const gutter = useGutter();
  const web = useLayout() !== 'phone';
  const target = useTarget();
  return (
    <View
      style={[
        styles.backHeader,
        { paddingHorizontal: gutter - 8, borderBottomColor: colors.rule },
        // Web: line up with the 720px page column below, no rule under it.
        web && { width: '100%', maxWidth: 720 + gutter * 2, alignSelf: 'center', borderBottomWidth: 0, marginTop: 8 },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        style={[styles.iconButton, { width: target, height: target }]}>
        <BackIcon color={colors.ink} />
      </Pressable>
      {title ? (
        <Text variant="ui" medium style={{ flex: 1, fontSize: 16 }} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </View>
  );
}

export function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const target = useTarget();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={[styles.iconButton, { width: target, height: target }]}>
      {children}
    </Pressable>
  );
}

export function Rule({ strong, style }: { strong?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { height: strong ? 1.5 : StyleSheet.hairlineWidth * 2, backgroundColor: strong ? colors.ink : colors.rule },
        style,
      ]}
    />
  );
}

/** Mono label with a rule, plus an optional "See more". */
export function SectionHeader({
  title,
  onMore,
  moreLabel,
}: {
  title: string;
  onMore?: () => void;
  moreLabel?: string;
}) {
  const { colors } = useTheme();
  const underline = useUnderlineLinks();
  const t = useT();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="label" color="muted">
        {title}
      </Text>
      <View style={[styles.sectionRule, { backgroundColor: colors.rule }]} />
      {onMore ? (
        <Pressable accessibilityRole="link" onPress={onMore} style={styles.more}>
          <Text variant="meta" color="accent" medium style={underline && styles.underline}>
            {moreLabel ?? t('home.seeMore')}
          </Text>
          <ChevronIcon size={14} color={colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  on,
  onPress,
  lang,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  lang?: 'hi' | 'mr' | 'en';
}) {
  const { colors } = useTheme();
  const target = useTarget();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={[styles.chip, { minHeight: target,  borderColor: on ? colors.ink : colors.rule, backgroundColor: on ? colors.ink : 'transparent' }]}>
      <Text variant="ui" medium={on} lang={lang} style={{ color: on ? colors.bg : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Photo placeholder with a mono credit line. Real images arrive with the live feeds. */
export function Photo({ credit, height = 200, style }: { credit?: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  // "Read image credits aloud" (You › Accessibility): screen readers hear the publisher's credit line.
  const { prefs } = useReader();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={credit && prefs.readCredits ? `Photo. ${credit}` : 'Photo'}
      style={[styles.photo, { height, backgroundColor: colors.photo }, style]}>
      {credit ? (
        <Text variant="label" color="muted" style={styles.credit} numberOfLines={1}>
          {credit}
        </Text>
      ) : null}
    </View>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  const { colors } = useTheme();
  const target = useTarget();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      onPress={() => onChange(!on)}
      style={[styles.switchHit, { minWidth: target, minHeight: target }]}>
      <View style={[styles.track, { backgroundColor: on ? colors.accent : colors.rule }]}>
        <View style={[styles.thumb, { backgroundColor: colors.surface, alignSelf: on ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );
}

/** A labelled setting row, optionally with a switch or a value. */
export function SettingRow({
  label,
  desc,
  value,
  on,
  onChange,
  onPress,
}: {
  label: string;
  desc?: string;
  value?: string;
  on?: boolean;
  onChange?: (next: boolean) => void;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const target = useTarget();
  const body = (
    <View style={[styles.settingRow, { borderBottomColor: colors.rule, minHeight: target + 16 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="ui" style={{ fontSize: 16 }}>
          {label}
        </Text>
        {desc ? (
          <Text variant="meta" color="muted">
            {desc}
          </Text>
        ) : null}
      </View>
      {onChange ? <Switch on={!!on} onChange={onChange} label={label} /> : null}
      {value ? (
        <Text variant="meta" color="muted">
          {value}
        </Text>
      ) : null}
      {onPress && !onChange ? <ChevronIcon size={16} color={colors.muted} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  const target = useTarget();
  return (
    <View style={[styles.segmented, { borderColor: colors.ink }]}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              { minHeight: target, backgroundColor: on ? colors.ink : 'transparent', borderLeftWidth: i ? 1 : 0, borderLeftColor: colors.ink },
            ]}>
            <Text variant="ui" medium={on} style={{ color: on ? colors.bg : colors.ink }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Text that fades into the page, so a story reads as a taste, not a wall. */
export function Fade({ height = 90 }: { height?: number }) {
  const { colors } = useTheme();
  const steps = 9;
  return (
    <View pointerEvents="none" style={[styles.fade, { height }]}>
      {Array.from({ length: steps }, (_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: withAlpha(colors.bg, (i + 1) / steps) }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  underline: { textDecorationLine: 'underline' },
  backHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  iconButton: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.five, marginBottom: Spacing.two },
  sectionRule: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  more: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  chip: { minHeight: TouchTarget, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1 },
  photo: { width: '100%', justifyContent: 'flex-end' },
  credit: { padding: 10, fontSize: 11 },
  switchHit: { minWidth: TouchTarget, minHeight: TouchTarget, alignItems: 'flex-end', justifyContent: 'center' },
  track: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  thumb: { width: 20, height: 20, borderRadius: 10 },
  settingRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmented: { flexDirection: 'row', borderWidth: 1 },
  segment: { flex: 1, minHeight: TouchTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
