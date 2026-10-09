import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, type Href } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/text';
import { Stamp, useReducedMotion } from '@/components/stamp';
import { useLayout } from '@/hooks/use-layout';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';

/**
 * First-run tour (Tour board, MOTION.md §4–5): 8 steps + done, a spotlight over the real screens with a hint card.
 * Phones only (no web tour, by design). Shown once after the first setup; You › About › Replay the tour.
 */
export type TourTarget = 'strip' | 'lead' | 'search' | 'tabbar' | 'feedStory' | 'feedMode' | 'tabLibrary' | 'tabYou';

type Step = { route: Href; target?: TourTarget; area: string; title: string; text: string; swipe?: boolean; nextLabel?: string };

const STEPS: Step[] = [
  { route: '/home', target: 'strip', area: 'Home', title: 'This is today’s edition.', text: 'Home is put together at 6:00 every morning from the sources you chose. It stays the same all day, so you can actually finish it.' },
  { route: '/home', target: 'lead', area: 'Home', title: 'Tap a story to read it.', text: 'When several outlets cover the same news, you can read each one’s version in its own words. The ⋯ under a story lets you save, share or see less of a topic.' },
  { route: '/home', target: 'search', area: 'Home', title: 'Search anything.', text: 'Find stories, papers, outlets and topics, in your sources or across all of them.' },
  { route: '/home', target: 'tabbar', area: 'Home', title: 'Four places, always here.', text: 'Home for today’s edition. Feed for stories as they arrive. Library for what you save. You for settings.', nextLabel: 'Show me Feed' },
  { route: '/feed', target: 'feedStory', area: 'Feed', swipe: true, title: 'Swipe left or right to switch sections.', text: 'Move between Today, World, India and the rest without reaching for the tabs. Swipe up for the next story.' },
  { route: '/feed', target: 'feedMode', area: 'Feed', title: 'My Feed or Explore.', text: 'My Feed is only the outlets you chose. Explore shows stories from everyone else, and always says so.' },
  { route: '/library', target: 'tabLibrary', area: 'Library', title: 'Your Library.', text: 'Save any story into folders. Download a story from ⋯, or a whole folder, to read it offline. Your last five stories are under Recently viewed.' },
  { route: '/you', target: 'tabYou', area: 'You', title: 'Make it yours.', text: 'Change sources, topics, places, font and theme any time. You can replay this tour from You › About.' },
  { route: '/home', area: 'Tour complete', title: 'You’re all set.', text: 'Your first edition is ready. Every story, as it was written.' },
];

const SEEN_KEY = 'unedited.tourSeen';
const EASE = Easing.bezier(0.3, 0.7, 0.3, 1);

type Ctx = {
  active: boolean;
  start: () => void;
  /** Starts the tour once, the first time a phone reader lands on Home after setup. */
  startIfNew: () => void;
  register: (id: TourTarget, ref: RefObject<View | null>) => () => void;
};

const TourContext = createContext<Ctx>({ active: false, start: () => {}, startIfNew: () => {}, register: () => () => {} });

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const phone = useLayout() === 'phone';
  const targets = useRef(new Map<TourTarget, RefObject<View | null>>());
  const [step, setStep] = useState<number | null>(null);

  const register = useCallback((id: TourTarget, ref: RefObject<View | null>) => {
    targets.current.set(id, ref);
    return () => {
      if (targets.current.get(id) === ref) targets.current.delete(id);
    };
  }, []);

  const go = useCallback(
    (i: number) => {
      setStep(i);
      router.navigate(STEPS[i].route);
    },
    [router],
  );
  const start = useCallback(() => phone && go(0), [phone, go]);
  const startIfNew = useCallback(() => {
    if (!phone) return;
    AsyncStorage.getItem(SEEN_KEY)
      .then((seen) => {
        if (!seen) go(0);
      })
      .catch(() => {});
  }, [phone, go]);
  const finish = useCallback(() => {
    setStep(null);
    AsyncStorage.setItem(SEEN_KEY, '1').catch(() => {});
    router.navigate('/home');
  }, [router]);

  const value = useMemo(() => ({ active: step !== null, start, startIfNew, register }), [step, start, startIfNew, register]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {step !== null && phone ? (
        <TourOverlay
          index={step}
          targets={targets}
          onNext={() => (step < STEPS.length - 1 ? go(step + 1) : finish())}
          onBack={() => go(Math.max(0, step - 1))}
          onSkip={finish}
        />
      ) : null}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);

/** Marks a view as a tour target. Spread the returned ref on the View the spotlight should frame. */
export function useTourTarget(id: TourTarget) {
  const ref = useRef<View>(null);
  const { register } = useTour();
  useEffect(() => register(id, ref), [id, register]);
  return ref;
}

type Box = { x: number; y: number; w: number; h: number };

/** Window position of a view. On web, the browser's own rect: react-native-web's measureInWindow drifts inside scroll views. */
function measure(node: View, done: (x: number, y: number, w: number, h: number) => void) {
  if (Platform.OS === 'web') {
    const r = (node as unknown as Element).getBoundingClientRect();
    return done(r.left, r.top, r.width, r.height);
  }
  node.measureInWindow(done);
}

function TourOverlay({
  index,
  targets,
  onNext,
  onBack,
  onSkip,
}: {
  index: number;
  targets: RefObject<Map<TourTarget, RefObject<View | null>>>;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const { colors, name } = useTheme();
  const t = useT();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const step = STEPS[index];
  const done = !step.target;
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(220);
  const scrim = name === 'ink' ? 'rgba(10,9,8,0.72)' : 'rgba(28,26,23,0.62)';

  // Spotlight geometry, animated between steps (0.35s cubic-bezier(.3,.7,.3,1); jumps with reduced motion).
  const [anim] = useState(() => ({ x: new Animated.Value(0), y: new Animated.Value(0), w: new Animated.Value(0), h: new Animated.Value(0), card: new Animated.Value(height) }));

  // Find the target once the step's screen has laid out.
  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const find = () => {
      const node = step.target ? targets.current.get(step.target)?.current : null;
      if (done) {
        // Done: no ring; the stamp lands over the Home lead photo.
        const lead = targets.current.get('lead')?.current;
        if (lead) return measure(lead, (x, y, w) => setBox({ x: x + w / 2, y: y + 150, w: 0, h: 0 }));
        return setBox({ x: width / 2, y: height * 0.4, w: 0, h: 0 });
      }
      if (!node) {
        if (tries++ < 50) timer = setTimeout(find, 60);
        return;
      }
      measure(node, (x, y, w, h) => {
        if (!w && tries++ < 50) {
          timer = setTimeout(find, 60);
          return;
        }
        setBox({ x, y, w, h });
      });
    };
    timer = setTimeout(find, 80);
    // Measure again once the screen has settled (Feed sizes its pages after its first layout).
    const settle = setTimeout(find, 450);
    return () => {
      clearTimeout(timer);
      clearTimeout(settle);
    };
  }, [index, step.target, done, targets, width, height]);

  // Card below the target when it fits, otherwise above it.
  const cardTop = box ? (done ? box.y + 130 : box.y + box.h + 20 + cardH <= height - 16 ? box.y + box.h + 20 : Math.max(16, box.y - cardH - 20)) : height;

  useEffect(() => {
    if (!box) return;
    const to = { x: box.x, y: box.y, w: box.w, h: box.h, card: cardTop };
    if (reduced) {
      (Object.keys(to) as (keyof typeof to)[]).forEach((k) => anim[k].setValue(to[k]));
      return;
    }
    Animated.parallel(
      (Object.keys(to) as (keyof typeof to)[]).map((k) =>
        Animated.timing(anim[k], { toValue: to[k], duration: 350, easing: EASE, useNativeDriver: false }),
      ),
    ).start();
  }, [box, cardTop, reduced, anim]);

  const right = Animated.add(anim.x, anim.w);
  const bottom = Animated.add(anim.y, anim.h);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Scrim everywhere except the target. */}
      <Animated.View style={[styles.scrim, { backgroundColor: scrim, top: 0, left: 0, right: 0, height: anim.y }]} />
      <Animated.View style={[styles.scrim, { backgroundColor: scrim, top: bottom, left: 0, right: 0, bottom: 0 }]} />
      <Animated.View style={[styles.scrim, { backgroundColor: scrim, top: anim.y, height: anim.h, left: 0, width: anim.x }]} />
      <Animated.View style={[styles.scrim, { backgroundColor: scrim, top: anim.y, height: anim.h, left: right, right: 0 }]} />
      {!done ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderColor: colors.accent,
              left: Animated.subtract(anim.x, 5),
              top: Animated.subtract(anim.y, 5),
              width: Animated.add(anim.w, 10),
              height: Animated.add(anim.h, 10),
            },
          ]}
        />
      ) : null}

      {/* Over the middle of the story photo. */}
      {step.swipe && box ? <SwipeHint centreY={box.y + Math.min(130, box.h / 2)} /> : null}
      {done && box ? <DoneStamp x={box.x} y={box.y} /> : null}

      <Animated.View
        role="dialog"
        aria-modal
        onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
        style={[styles.card, { top: anim.card, backgroundColor: colors.surface, borderColor: colors.rule, borderTopColor: colors.accent }]}>
        <View style={styles.cardHead}>
          <Text variant="label" color="accent" style={{ letterSpacing: 0.8 }}>
            {done ? step.area : `${step.area} · ${index + 1} of ${STEPS.length - 1}`}
          </Text>
          {!done ? (
            <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
              <Text variant="meta" color="muted" style={{ fontSize: 13, textDecorationLine: 'underline' }}>
                {t('tour.skip')}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <CardBody key={index} title={step.title} text={step.text} />
        <View style={styles.cardFoot}>
          <View aria-hidden style={{ flexDirection: 'row', gap: 5 }}>
            {STEPS.slice(0, -1).map((_, k) => (
              <View key={k} style={{ width: k === index ? 16 : 6, height: 4, backgroundColor: k <= index ? colors.accent : colors.rule }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {index > 0 && !done ? (
              <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
                <Text variant="ui" style={{ fontSize: 14.5 }}>
                  Back
                </Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={onNext} style={[styles.next, { backgroundColor: colors.ink }]}>
              <Text variant="ui" medium style={{ fontSize: 14.5, color: colors.surface }}>
                {done ? 'Start reading' : (step.nextLabel ?? (index === STEPS.length - 2 ? 'Finish' : t('tour.next')))}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/** Title and text fade up on every step: opacity 0→1, translateY 8→0, 0.3s ease-out. */
function CardBody({ title, text }: { title: string; text: string }) {
  const { name } = useTheme();
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (!reduced) Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [reduced, v]);
  return (
    <Animated.View style={{ gap: 6, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      <Text variant="headline" medium nativeID="tr-title" style={{ fontSize: 23, lineHeight: 26.5 }}>
        {title}
      </Text>
      <Text variant="ui" style={{ fontSize: 14.5, lineHeight: 22, color: name === 'ink' ? '#B5AC9C' : '#3F3A33' }}>
        {text}
      </Text>
    </Animated.View>
  );
}

/**
 * Step 5: a 40px accent-ringed dot swipes right then back left, leaving a 3px accent trail, 2.6s loop
 * (MOTION.md §4). Reduced motion: dot still in the centre, both trails at 50%.
 */
function SwipeHint({ centreY }: { centreY: number }) {
  const { colors, name } = useTheme();
  const reduced = useReducedMotion();
  const [p] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.timing(p, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [reduced, p]);

  // Keyframes from the board; the dot's own easing (cubic-bezier(.45,0,.3,1)) is applied per segment.
  const ease = Easing.bezier(0.45, 0, 0.3, 1);
  const dotX = p.interpolate({ inputRange: [0, 0.5, 0.63, 1], outputRange: [-96, 96, 96, -96], easing: ease });
  const dotO = p.interpolate({ inputRange: [0, 0.12, 0.5, 0.62, 0.63, 0.75, 1], outputRange: [0, 1, 1, 0, 0, 1, 0] });
  const trailR = p.interpolate({ inputRange: [0, 0.1, 0.45, 0.6, 1], outputRange: [0, 0, 1, 1, 1] });
  const trailRO = p.interpolate({ inputRange: [0, 0.1, 0.45, 0.6, 1], outputRange: [0, 0, 0.55, 0, 0] });
  const trailL = p.interpolate({ inputRange: [0, 0.6, 0.95, 1], outputRange: [0, 0, 1, 1] });
  const trailLO = p.interpolate({ inputRange: [0, 0.6, 0.95, 1], outputRange: [0, 0, 0.55, 0] });
  const onScrim = name === 'ink' ? '#C9C0B0' : '#F8F3EA';
  const dotFill = name === 'ink' ? 'rgba(38,35,32,0.9)' : 'rgba(248,243,234,0.92)';

  return (
    <View pointerEvents="none" style={[styles.swipe, { top: centreY - 30 }]}>
      <Text variant="ui" style={[styles.chev, { left: 70, color: onScrim }]}>
        ‹
      </Text>
      <Text variant="ui" style={[styles.chev, { right: 70, color: onScrim }]}>
        ›
      </Text>
      {/* As on the board: the right-swipe trail fills the 96px left of centre from its left edge; the
          left-swipe trail fills the 96px right of centre from its right edge. */}
      <Animated.View
        style={[
          styles.trail,
          { left: '50%', marginLeft: -96, backgroundColor: colors.accent },
          reduced
            ? { opacity: 0.5 }
            : { opacity: trailRO, transform: [{ translateX: -48 }, { scaleX: trailR }, { translateX: 48 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.trail,
          { left: '50%', backgroundColor: colors.accent },
          reduced
            ? { opacity: 0.5 }
            : { opacity: trailLO, transform: [{ translateX: 48 }, { scaleX: trailL }, { translateX: -48 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { borderColor: colors.accent, backgroundColor: dotFill },
          reduced ? null : { opacity: dotO, transform: [{ translateX: dotX }] },
        ]}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent }} />
      </Animated.View>
    </View>
  );
}

/**
 * Done: the capped Brand stamp (120px) lands over the lead photo. 0.5s cubic-bezier(.5,0,.75,1.4) after 0.2s:
 * from translateY(-30) scale(2) rotate(-16°), opacity 0 → 55% scale(.9) rotate(3°) → 72% scale(1.05) rotate(-1°)
 * → rest (MOTION.md §5). Reduced motion: shown in place.
 */
function DoneStamp({ x, y }: { x: number; y: number }) {
  const reduced = useReducedMotion();
  const [p] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) return;
    Animated.timing(p, { toValue: 1, duration: 500, delay: 200, easing: Easing.bezier(0.5, 0, 0.75, 1.4), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [reduced, p]);
  const style = reduced
    ? null
    : {
        opacity: p.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: p.interpolate({ inputRange: [0, 0.55, 1], outputRange: [-30, 0, 0] }) },
          { scale: p.interpolate({ inputRange: [0, 0.55, 0.72, 1], outputRange: [2, 0.9, 1.05, 1] }) },
          { rotate: p.interpolate({ inputRange: [0, 0.55, 0.72, 1], outputRange: ['-16deg', '3deg', '-1deg', '0deg'] }) },
        ],
      };
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120 }, style]}>
      <Stamp kind="brand" capped size={120} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute' },
  ring: { position: 'absolute', borderWidth: 2 },
  card: { position: 'absolute', left: 16, right: 16, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 14, gap: 10, borderWidth: 1, borderTopWidth: 3 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 24 },
  skip: { height: 44, marginVertical: -10, marginRight: -6, paddingHorizontal: 6, justifyContent: 'center' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  back: { height: 44, paddingHorizontal: 12, justifyContent: 'center' },
  next: { height: 44, paddingHorizontal: 20, justifyContent: 'center' },
  swipe: { position: 'absolute', left: 0, right: 0, height: 60, alignItems: 'center', justifyContent: 'center' },
  chev: { position: 'absolute', fontSize: 30, lineHeight: 34 },
  trail: { position: 'absolute', width: 96, height: 3 },
  dot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
