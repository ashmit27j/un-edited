import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { useTour } from '@/tour/tour';

/** You › About › Replay the tour. Starts the tour (phones and web) and goes to Home. */
export default function Tour() {
  const { start } = useTour();
  useEffect(() => {
    start();
  }, [start]);
  return <Redirect href="/home" />;
}
