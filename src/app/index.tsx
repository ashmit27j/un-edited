import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';

/**
 * Login-based routing.
 *  - signed out on web -> landing page
 *  - signed out in the app -> onboarding
 *  - signed in or guest, setup not finished -> onboarding
 *  - otherwise -> /feed
 */
export default function Index() {
  const { status } = useSession();
  const { ready, onboarded } = useReader();

  if (status === 'loading' || !ready) return null;
  if (status === 'signedOut') return <Redirect href={Platform.OS === 'web' ? '/landing' : '/onboarding'} />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/feed" />;
}
