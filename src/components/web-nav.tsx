import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { ThemeToggle } from '@/components/theme-toggle';
import { Wordmark } from '@/components/wordmark';
import { MaxContentWidth, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

/** Web top nav height (all Web boards). */
export const NavHeight = 68;

const TABS: { key: 'nav.home' | 'nav.feed' | 'nav.library' | 'nav.you'; href: Href; path: string }[] = [
  { key: 'nav.home', href: '/home', path: '/home' },
  { key: 'nav.feed', href: '/feed', path: '/feed' },
  { key: 'nav.library', href: '/library', path: '/library' },
  { key: 'nav.you', href: '/you', path: '/you' },
];

/**
 * The web top nav (768px and wider): wordmark left, Home · Feed · Library · You with the active one in
 * accent over a 2px underline, Search and the light/dark toggle on the right. Fixed to the top while the
 * document scrolls; renders a spacer so the page starts below it.
 */
export function WebNav() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const { width } = useWindowDimensions();
  const side = Math.max(32, (width - MaxContentWidth) / 2 + 32);
  // Pages under a tab keep it lit: a folder is in Library, Your news is in You.
  const section = pathname.startsWith('/folder') ? '/library' : pathname.startsWith('/manage') ? '/you' : pathname;
  const active = TABS.find((tab) => section === tab.path || section.startsWith(`${tab.path}/`))?.path;

  return (
    <>
      <View
        role="navigation"
        accessibilityLabel="Main"
        style={[styles.bar, { backgroundColor: colors.bg, borderBottomColor: colors.rule, paddingHorizontal: side }]}>
        <Pressable accessibilityRole="link" accessibilityLabel="Un:edited home" onPress={() => router.navigate('/home')} style={styles.wordmark}>
          <Wordmark size={28} />
        </Pressable>
        <View style={styles.links}>
          {TABS.map((tab) => {
            const on = tab.path === active;
            return (
              <Pressable
                key={tab.path}
                accessibilityRole="link"
                accessibilityState={{ selected: on }}
                aria-current={on ? 'page' : undefined}
                onPress={() => router.navigate(tab.href)}
                style={[styles.link, { borderBottomColor: on ? colors.accent : 'transparent' }]}>
                <Text variant="ui" medium={on} style={{ color: on ? colors.accent : colors.muted, fontSize: 14.5 }}>
                  {t(tab.key)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.tools}>
          <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => router.push('/search')} style={styles.icon}>
            <SearchIcon size={20} color={colors.ink} />
          </Pressable>
          <ThemeToggle />
        </View>
      </View>
      <View style={{ height: NavHeight }} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    // 'fixed' is web-only, and so is this nav. (Sticky doesn't hold: the router's screen container is one viewport tall.)
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: NavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  wordmark: { flex: 1, alignItems: 'flex-start' },
  links: { flexDirection: 'row', gap: 28 },
  link: { height: 66, justifyContent: 'center', borderBottomWidth: 2 },
  tools: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  icon: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
});
