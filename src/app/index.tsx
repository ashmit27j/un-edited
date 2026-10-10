import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { isStandalone } from '@/lib/install';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';

/**
 * Login-based routing.
 *  - signed out on web -> landing page (opened from the Home Screen: onboarding, the reader has already chosen us)
 *  - signed out in the app -> onboarding
 *  - signed in or guest, setup not finished -> onboarding
 *  - otherwise -> /feed
 */
export default function Index() {
  const { status } = useSession();
  const { ready, onboarded } = useReader();

  if (status === 'loading' || !ready) return null;
  if (status === 'signedOut') return <Redirect href={Platform.OS === 'web' && !isStandalone() ? '/landing' : '/onboarding'} />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/feed" />;
}
