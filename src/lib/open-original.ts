import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/** "Continue on [source]": the publisher's own page, in a new tab on web or the in-app browser on Android. */
export function openOriginal(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else WebBrowser.openBrowserAsync(url).catch(() => {});
}
