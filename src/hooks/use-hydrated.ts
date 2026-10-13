import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False on the server and during the first client render (hydration), true after. Screens built from the reader's
 * device state (date, edition, settings, saved stories) can't match the HTML pre-rendered at build time, so they
 * wait for this instead of causing a React hydration mismatch (#418).
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
