import { Platform, useWindowDimensions } from 'react-native';

import { FullBreakpoint, WideBreakpoint } from '@/constants/theme';

/**
 * Which layout a screen should use (HANDOFF §5):
 * - `phone`: native, or web under 768px. Bottom tab bar, mobile screens.
 * - `web`: web 768–1023px. Top nav, one column up to 720px.
 * - `webFull`: web 1024px and wider. The multi-column Web boards.
 */
export function useLayout(): 'phone' | 'web' | 'webFull' {
  // Re-renders on resize. On web, measure like CSS media queries do (window width including the scrollbar);
  // react-native-web's width leaves the scrollbar out, which would put a 1024px window in the narrow layout.
  const { width: measured } = useWindowDimensions();
  if (Platform.OS !== 'web') return 'phone';
  const width = typeof window !== 'undefined' ? window.innerWidth : measured;
  if (width < WideBreakpoint) return 'phone';
  return width >= FullBreakpoint ? 'webFull' : 'web';
}
