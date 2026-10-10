import { Platform } from 'react-native';

/**
 * iPhone (and iPad) readers install the website from Safari: there is no App Store build. These checks decide
 * when to show the Add to Home Screen guide. Everything is false outside the browser.
 */
const web = Platform.OS === 'web' && typeof navigator !== 'undefined';

/** iPhone, iPod or iPad (iPadOS reports itself as a Mac with touch). */
export function isIOS(): boolean {
  if (!web) return false;
  const ua = navigator.userAgent;
  return /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Already running from the Home Screen. */
export function isStandalone(): boolean {
  if (!web || typeof window === 'undefined') return false;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
}

/** In the browser on an iPhone or iPad, not yet installed: the guide is worth showing. */
export const canInstallOnIOS = () => isIOS() && !isStandalone();
