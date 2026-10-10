import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Button } from '@/components/button';
import { Sheet } from '@/components/sheet';
import { useReducedMotion } from '@/components/stamp';
import { Text } from '@/components/text';
import { Fonts } from '@/constants/theme';
import { canInstallOnIOS } from '@/lib/install';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * iPhone install guide (Ashmit, 2026-10-10): four swipeable cards showing Safari's Share › Add to Home Screen ›
 * Add › open from the Home Screen, with Got it at the end.
 *  - Shown on its own once, in Safari on an iPhone or iPad (not already installed), when setup starts (Ashmit,
 *    2026-10-10): iPhone keeps Home Screen apps separate from Safari, so setting up first in Safari would mean
 *    doing it twice. Readers who set up before this existed see it on their next visit to a tab screen instead
 *    (the tour waits for it).
 *  - The landing page's "Add to iPhone" opens it any time; its last button continues to setup (or Home).
 *  - Closing it either way counts as seen, so it never comes back by itself.
 * No motion of its own: the cards scroll natively (snap), and with reduced motion the buttons jump.
 */
type Mode = 'start' | 'setup' | 'landing';
type Ctx = {
  /** The guide is still due for this reader: the tour waits for it. */
  pending: boolean;
  open: (mode: Mode) => void;
};

const SEEN_KEY = 'unedited.installGuideSeen';
const TAB_PATHS = ['/home', '/feed', '/library', '/you'];

const InstallContext = createContext<Ctx>({ pending: false, open: () => {} });
export const useInstallGuide = () => useContext(InstallContext);

export function InstallGuideProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { onboarded } = useReader();
  const { status } = useSession();
  // Worked out after mount: the static web render has no browser to ask.
  const [offer, setOffer] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);
  // Opened from the landing page's "Add to iPhone".
  const [asked, setAsked] = useState<Mode | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY)
      .then((v) => {
        setOffer(canInstallOnIOS());
        setSeen(!!v);
      })
      .catch(() => setSeen(true));
  }, []);

  const pending = offer && onboarded && seen !== true;
  // Shows by itself once: when setup starts, or (set up before the guide existed) on a tab screen.
  const auto: Mode | null =
    !offer || seen !== false
      ? null
      : !onboarded && pathname === '/onboarding'
        ? 'start'
        : onboarded && TAB_PATHS.includes(pathname)
          ? 'setup'
          : null;
  const mode: Mode | null = asked ?? auto;

  const close = useCallback(() => {
    setAsked(null);
    setSeen(true);
    AsyncStorage.setItem(SEEN_KEY, '1').catch(() => {});
  }, []);

  const done = useCallback(() => {
    const from = mode;
    close();
    if (from === 'landing') {
      if (onboarded) router.replace('/home');
      else router.push('/onboarding');
    }
  }, [mode, close, onboarded, router]);

  const value = useMemo(() => ({ pending, open: setAsked }), [pending]);

  return (
    <InstallContext.Provider value={value}>
      {children}
      {mode ? (
        <InstallGuide
          mode={mode}
          signedIn={status === 'signedIn'}
          doneLabel={mode !== 'landing' ? 'Got it' : onboarded ? 'Go to my edition' : 'Set up my edition'}
          onClose={close}
          onDone={done}
        />
      ) : null}
    </InstallContext.Provider>
  );
}

type Card = { title: string; text: string; Art: () => ReactNode };

function InstallGuide({
  mode,
  signedIn,
  doneLabel,
  onClose,
  onDone,
}: {
  mode: Mode;
  signedIn: boolean;
  doneLabel: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const { prefs } = useReader();
  const reduced = useReducedMotion();
  const scroller = useRef<ScrollView>(null);
  const [w, setW] = useState(0);
  const [page, setPage] = useState(0);

  const last =
    mode === 'landing'
      ? 'It opens full screen, like an app, without the browser bars. Set up your edition there, or carry on here.'
      : mode === 'start'
        ? 'It opens full screen, like an app. Set up your edition there: iPhone keeps Home Screen apps separate from Safari, so choices made here stay in Safari.'
        : signedIn
        ? 'It opens full screen, like an app. Sign in there once and your sources, settings and folders come with you.'
        : 'It opens full screen, like an app. iPhone keeps Home Screen apps separate from Safari, so you’ll pick your sources once more there. Sign in to bring them along instead.';

  const cards: Card[] = [
    { title: 'Tap Share.', text: 'In Safari, the Share button is at the bottom of the screen (at the top on iPad). On newer iPhones, tap ⋯ first, then Share.', Art: ShareArt },
    { title: 'Tap Add to Home Screen.', text: 'Scroll down the list if you don’t see it. On newer iPhones it may be under View More.', Art: SheetArt },
    { title: 'Tap Add.', text: 'Keep the name Un:edited and tap Add in the top-right corner. If you see “Open as Web App”, leave it on.', Art: AddArt },
    { title: 'Open it from your Home Screen.', text: last, Art: HomeArt },
  ];
  const end = page === cards.length - 1;

  const goTo = (i: number) => {
    setPage(i);
    scroller.current?.scrollTo({ x: i * w, animated: !reduced });
  };

  return (
    <Sheet visible title="Add to Home Screen" onClose={onClose}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w ? (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            // Buttons instead of swiping (You › Accessibility): the cards move only with Back / Next.
            scrollEnabled={!prefs.swipeButtons}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w))}>
            {cards.map((c, i) => (
              <View
                key={c.title}
                style={{ width: w, gap: 10 }}
                accessibilityElementsHidden={i !== page}
                importantForAccessibility={i === page ? 'auto' : 'no-hide-descendants'}
                aria-hidden={i !== page}>
                <View style={[styles.art, { backgroundColor: colors.bg, borderColor: colors.rule }]}>
                  <c.Art />
                </View>
                <Text variant="label" color="accent" style={{ marginTop: 6 }}>
                  Step {i + 1} of {cards.length}
                </Text>
                <Text variant="headline" medium style={{ fontSize: 23, lineHeight: 27 }}>
                  {c.title}
                </Text>
                <Text variant="ui" color="muted" style={{ fontSize: 15, lineHeight: 22 }}>
                  {c.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.foot}>
          <View aria-hidden style={{ flexDirection: 'row', gap: 5 }}>
            {cards.map((_, k) => (
              <View key={k} style={{ width: k === page ? 16 : 6, height: 4, backgroundColor: k <= page ? colors.accent : colors.rule }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {page > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => goTo(page - 1)} style={styles.back}>
                <Text variant="ui" style={{ fontSize: 15 }}>
                  Back
                </Text>
              </Pressable>
            ) : null}
            <View style={{ minWidth: 112 }}>
              <Button label={end ? doneLabel : 'Next'} onPress={() => (end ? onDone() : goTo(page + 1))} />
            </View>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

/* ---- Illustrations: plain line drawings of the iPhone screens, in the reader's theme. ---- */

const ART_H = 168;

function useArt() {
  const { colors, name } = useTheme();
  return {
    c: colors,
    // The app icon as it looks on the Home Screen (Paper / Ink icon colours).
    iconBg: name === 'ink' ? '#1C1A17' : '#F8F3EA',
    iconInk: name === 'ink' ? '#C8705F' : '#A8372A',
  };
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <Svg width="100%" height={ART_H} viewBox="0 0 280 168" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {children}
    </Svg>
  );
}

function Label({ x, y, children, size = 9, color, medium, anchor = 'start' }: { x: number; y: number; children: string; size?: number; color: string; medium?: boolean; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <SvgText x={x} y={y} fontSize={size} fill={color} fontFamily={medium ? Fonts.sansMedium : Fonts.sans} textAnchor={anchor}>
      {children}
    </SvgText>
  );
}

/** The two-letter app icon, cropped at the right edge like the real one. */
function AppIcon({ x, y, s }: { x: number; y: number; s: number }) {
  const { c, iconBg, iconInk } = useArt();
  return (
    <G>
      <Rect x={x} y={y} width={s} height={s} rx={s * 0.22} fill={iconBg} stroke={c.rule} strokeWidth={1} />
      <SvgText x={x + s * 0.16} y={y + s * 0.72} fontSize={s * 0.62} fill={iconInk} fontFamily={Fonts.wordmark}>
        Un
      </SvgText>
    </G>
  );
}

/** Card 1: Safari's bottom bar, Share ringed. */
function ShareArt() {
  const { c } = useArt();
  return (
    <Frame>
      <Rect x={60} y={10} width={160} height={150} rx={18} fill={c.surface} stroke={c.rule} />
      {[34, 46, 58, 70, 82].map((y, i) => (
        <Rect key={y} x={76} y={y} width={i === 0 ? 96 : 128} height={i === 0 ? 7 : 4} fill={i === 0 ? c.ink : c.rule} opacity={i === 0 ? 0.75 : 1} />
      ))}
      <Line x1={60} y1={116} x2={220} y2={116} stroke={c.rule} />
      <Rect x={84} y={124} width={86} height={18} rx={9} fill={c.bg} stroke={c.rule} />
      <Label x={127} y={136} size={7.5} color={c.muted} anchor="middle">
        unedited-six.vercel.app
      </Label>
      <Path d="M74 127l-5 6 5 6" stroke={c.muted} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Share: a box with an arrow up. */}
      <G stroke={c.ink} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M184 131v8h12v-8" />
        <Path d="M190 136v-11M186.5 128.5l3.5-3.5 3.5 3.5" />
      </G>
      <Circle cx={190} cy={132} r={12} stroke={c.accent} strokeWidth={2} fill="none" />
      {[204, 208, 212].map((x) => (
        <Circle key={x} cx={x} cy={133} r={1.4} fill={c.muted} />
      ))}
    </Frame>
  );
}

/** Card 2: the share sheet, Add to Home Screen ringed. */
function SheetArt() {
  const { c } = useArt();
  const rows = ['Copy', 'Add to Reading List', 'Add to Home Screen', 'Add Bookmark'];
  return (
    <Frame>
      <Rect x={60} y={10} width={160} height={150} rx={18} fill={c.surface} stroke={c.rule} />
      <Rect x={60} y={40} width={160} height={120} rx={14} fill={c.bg} stroke={c.rule} />
      <Rect x={128} y={46} width={24} height={3} rx={1.5} fill={c.rule} />
      {rows.map((r, i) => {
        const y = 58 + i * 24;
        const on = i === 2;
        return (
          <G key={r}>
            <Rect x={70} y={y} width={140} height={20} rx={5} fill={on ? c.accentSoft : c.surface} stroke={on ? c.accent : c.rule} strokeWidth={on ? 1.6 : 1} />
            <Label x={78} y={y + 13.5} size={8.5} color={c.ink} medium={on}>
              {r}
            </Label>
            {on ? (
              <G stroke={c.ink} strokeWidth={1.2} fill="none">
                <Rect x={190} y={y + 5} width={10} height={10} rx={2.5} />
                <Path d={`M195 ${y + 7.5}v5M192.5 ${y + 10}h5`} />
              </G>
            ) : null}
          </G>
        );
      })}
    </Frame>
  );
}

/** Card 3: the Add to Home Screen screen, Add ringed. */
function AddArt() {
  const { c } = useArt();
  return (
    <Frame>
      <Rect x={60} y={10} width={160} height={150} rx={18} fill={c.surface} stroke={c.rule} />
      <Label x={70} y={36} size={7.5} color={c.muted}>
        Cancel
      </Label>
      <Label x={142} y={36} size={7} color={c.ink} medium anchor="middle">
        Add to Home Screen
      </Label>
      <Label x={203} y={36} size={9} color={c.accent} medium anchor="middle">
        Add
      </Label>
      <Circle cx={203} cy={33} r={11} stroke={c.accent} strokeWidth={2} fill="none" />
      <Line x1={60} y1={48} x2={220} y2={48} stroke={c.rule} />
      <AppIcon x={72} y={60} s={34} />
      <Label x={114} y={74} size={9.5} color={c.ink}>
        Un:edited
      </Label>
      <Line x1={114} y1={80} x2={208} y2={80} stroke={c.rule} />
      <Label x={114} y={92} size={7} color={c.muted}>
        unedited-six.vercel.app
      </Label>
      <Line x1={72} y1={112} x2={208} y2={112} stroke={c.rule} />
      <Label x={72} y={130} size={8.5} color={c.ink}>
        Open as Web App
      </Label>
      <Rect x={186} y={121} width={22} height={13} rx={6.5} fill={c.accent} />
      <Circle cx={201.5} cy={127.5} r={5} fill={c.surface} />
    </Frame>
  );
}

/** Card 4: the Home Screen with the Un:edited icon ringed. */
function HomeArt() {
  const { c } = useArt();
  const spots = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <Frame>
      <Rect x={60} y={10} width={160} height={150} rx={18} fill={c.photo} stroke={c.rule} />
      {spots.map((k) => {
        const x = 76 + (k % 4) * 34;
        const y = 26 + Math.floor(k / 4) * 46;
        if (k === 5)
          return (
            <G key={k}>
              <AppIcon x={x} y={y} s={26} />
              <Rect x={x - 4} y={y - 4} width={34} height={34} rx={9} stroke={c.accent} strokeWidth={2} fill="none" />
              <Label x={x + 13} y={y + 39} size={6.5} color={c.ink} anchor="middle">
                Un:edited
              </Label>
            </G>
          );
        return <Rect key={k} x={x} y={y} width={26} height={26} rx={6} fill={c.surface} opacity={0.7} />;
      })}
      <Rect x={74} y={124} width={132} height={26} rx={10} fill={c.surface} opacity={0.5} />
    </Frame>
  );
}

const styles = StyleSheet.create({
  art: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20 },
  back: { height: 44, paddingHorizontal: 12, justifyContent: 'center' },
});
