import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Android notification channels, one per kind (NotificationDelivery), so readers can turn each one off or change
 * its sound in the phone's own settings, as with any app. send-notifications picks the channel by kind.
 */
export type Channel = 'edition' | 'big' | 'alerts' | 'papers';

const CHANNELS: { id: Channel; name: string; description: string; importance: Notifications.AndroidImportance }[] = [
  { id: 'edition', name: 'Morning Edition', description: 'Once a day, when your edition is ready.', importance: Notifications.AndroidImportance.DEFAULT },
  { id: 'big', name: 'Big stories', description: 'When most of your sources cover the same story.', importance: Notifications.AndroidImportance.DEFAULT },
  { id: 'alerts', name: 'Topic and source alerts', description: 'New stories on the topics and outlets you ticked.', importance: Notifications.AndroidImportance.DEFAULT },
  { id: 'papers', name: 'Papers & Reports', description: 'A Sunday note about new papers and reports.', importance: Notifications.AndroidImportance.LOW },
];

/** Creates (or updates) the channels. Safe to call often; does nothing off Android. */
export async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Promise.all(
    CHANNELS.map((c) =>
      Notifications.setNotificationChannelAsync(c.id, { name: c.name, description: c.description, importance: c.importance, lightColor: '#A8372A' }),
    ),
  );
  // The single channel from the first builds.
  await Notifications.deleteNotificationChannelAsync('default').catch(() => {});
}
