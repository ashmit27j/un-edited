import { flushSync } from 'react-dom';

/** Length of the light / dark cross-fade. Keep in step with THEME_FADE_CSS in +html.tsx. */
const FADE_MS = 600;

function reduced() {
  return (
    document.documentElement.hasAttribute('data-reduce-motion') ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Switches Paper ↔ Ink with a slow cross-fade instead of a jump.
 * Uses the View Transitions API where the browser has it (the whole page fades, stamps and images
 * included); elsewhere colours ease over the same time. Instant when the reader prefers reduced motion.
 */
export function fadeTheme(apply: () => void) {
  if (typeof document === 'undefined' || reduced()) return apply();

  const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
  if (doc.startViewTransition) {
    doc.startViewTransition(() => flushSync(apply));
    return;
  }

  const root = document.documentElement;
  root.classList.add('theme-fade');
  apply();
  setTimeout(() => root.classList.remove('theme-fade'), FADE_MS + 50);
}
