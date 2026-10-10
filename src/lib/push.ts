import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { ensureChannels } from '@/lib/channels';

/**
 * Android: the device's Expo push token, for send-notifications. Null when the app isn't built with an EAS
 * project (then the edition reminder is scheduled on the phone instead, see notifications.ts).
 */
export async function pushToken(): Promise<{ kind: 'expo'; token: string } | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;
  // Never prompt from here: only once the reader has allowed notifications.
  if ((await Notifications.getPermissionsAsync()).status !== 'granted') return null;
  await ensureChannels();
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return { kind: 'expo', token: data };
}
