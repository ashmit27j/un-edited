import type { NotifyPrefs } from '@/store/reader-provider';

export type Permission = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Browser notifications. An iPhone only has them once the site is on the Home Screen (iOS 16.4+); a plain
 * Safari tab reports 'unsupported'.
 */
export async function permissionState(): Promise<Permission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission(): Promise<Permission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
}

export function deliveryTime(n: NotifyPrefs) {
  const [h, m] = n.time.split(':').map(Number);
  if (n.quiet && h * 60 + m < 7 * 60) return { hour: 7, minute: 0 };
  return { hour: h, minute: m };
}

/** The web can't schedule on its own: the edition arrives as Web Push from the server (not built yet). */
export async function scheduleEdition(_n: NotifyPrefs) {}
