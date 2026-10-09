import * as Notifications from 'expo-notifications';

import type { NotifyPrefs } from '@/store/reader-provider';

export type Permission = 'granted' | 'denied' | 'default' | 'unsupported';

/** Where the system stands, without asking. 'denied' = blocked in the phone's settings. */
export async function permissionState(): Promise<Permission> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  return canAskAgain ? 'default' : 'denied';
}

/** Ask once. Never during onboarding (NotificationDelivery). */
export async function requestPermission(): Promise<Permission> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

const DAY_NUMBERS: Record<string, number> = { Su: 1, M: 2, T: 3, W: 4, Th: 5, F: 6, S: 7 };

/** Quiet hours end at 7:00 AM; an edition due inside them arrives when they end. */
export function deliveryTime(n: NotifyPrefs) {
  const [h, m] = n.time.split(':').map(Number);
  if (n.quiet && h * 60 + m < 7 * 60) return { hour: 7, minute: 0 };
  return { hour: h, minute: m };
}

/**
 * The Morning Edition reminder, scheduled on the phone for the picked days and time. Plain text, never a headline.
 * Big story, Papers & Reports, download and topic/source alerts need the server and are sent as push later.
 */
export async function scheduleEdition(n: NotifyPrefs) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!n.all || !n.edition) return;
  const { hour, minute } = deliveryTime(n);
  for (const day of n.days) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your Morning Edition is ready',
        body: 'Tap to read today’s stories from the outlets you chose.',
        sound: n.sound ? 'default' : undefined,
        data: { open: '/home' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: DAY_NUMBERS[day], hour, minute },
    });
  }
}
