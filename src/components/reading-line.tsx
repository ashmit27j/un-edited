import { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, View, type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import type { LanguageCode } from '@/data/sample';
import { useReader } from '@/store/reader-provider';

/** Screens with their own ScrollView (Screen) report scrolling here, so the reading line can follow it on phones. */
const listeners = new Set<() => void>();
export function emitScroll() {
  listeners.forEach((fn) => fn());
}

/**
 * Article paragraphs. With "Reading line" on (You › Accessibility), every paragraph except the one nearest
 * 40% down the screen is dimmed, so the eye has one place to rest. Off: plain paragraphs.
 */
export function ReadingBody({
  paragraphs,
  lang,
  style,
}: {
  paragraphs: string[];
  lang?: LanguageCode;
  style?: StyleProp<TextStyle>;
}) {
  const { prefs } = useReader();
  const refs = useRef<(View | null)[]>([]);
  const [active, setActive] = useState(0);
  const on = prefs.readingLine;

  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = Dimensions.get('window').height * 0.4;
        let best = 0;
        let bestDistance = Infinity;
        let pending = refs.current.length;
        refs.current.forEach((node, i) => {
          if (!node) return (pending -= 1);
          const take = (y: number, h: number) => {
            const distance = y <= line && y + h >= line ? 0 : Math.min(Math.abs(y - line), Math.abs(y + h - line));
            if (distance < bestDistance) {
              bestDistance = distance;
              best = i;
            }
            pending -= 1;
            if (pending === 0) setActive(best);
          };
          // Web: the browser's rect (react-native-web's measureInWindow drifts inside scroll views).
          if (Platform.OS === 'web') {
            const r = (node as unknown as Element).getBoundingClientRect();
            take(r.top, r.height);
          } else node.measureInWindow((_x, y, _w, h) => take(y, h));
        });
      });
    };
    update();
    listeners.add(update);
    // Web: catch scrolling of the page and of any scroll container.
    if (Platform.OS === 'web') window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(frame);
      listeners.delete(update);
      if (Platform.OS === 'web') window.removeEventListener('scroll', update, true);
    };
  }, [on, paragraphs.length]);

  return (
    <>
      {paragraphs.map((para, i) => (
        <View
          key={i}
          ref={(node) => {
            refs.current[i] = node;
          }}
          style={on && i !== active ? { opacity: 0.35 } : null}>
          <Text variant="body" lang={lang} style={style}>
            {para}
          </Text>
        </View>
      ))}
    </>
  );
}
