import { usePathname } from 'expo-router';
import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * At 768px and wider the document scrolls (see +html.tsx), so the window keeps its position across
 * client-side navigation. Each route starts at the top, and returning to a route (Back, or a tab)
 * puts it back where the reader left it.
 */
export function useWebScrollMemory() {
  const pathname = usePathname();
  const positions = useRef(new Map<string, number>());
  const current = useRef(pathname);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const save = () => positions.current.set(current.current, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  useLayoutEffect(() => {
    current.current = pathname;
    const y = positions.current.get(pathname) ?? 0;
    // Wait a frame so the new screen has laid out before restoring.
    const id = requestAnimationFrame(() => window.scrollTo(0, y));
    return () => cancelAnimationFrame(id);
  }, [pathname]);
}
