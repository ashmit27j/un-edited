import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Who is reading.
 *  - signedIn: a Supabase session exists.
 *  - guest: "Not now", remembered on this device. No folders, no sync.
 *  - signedOut: first visit, or after signing out.
 * Methods that can fail return an error message for the reader (or null on success).
 */
export type SessionStatus = 'loading' | 'signedOut' | 'guest' | 'signedIn';

type SessionValue = {
  status: SessionStatus;
  email: string | null;
  /** False when the Supabase keys are missing: only guest mode works. */
  authAvailable: boolean;
  continueAsGuest: () => void;
  sendEmailCode: (email: string) => Promise<string | null>;
  verifyEmailCode: (email: string, code: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const GUEST_KEY = 'unedited.guest';
const NOT_SET_UP = "Sign-in isn't available yet.";
const GENERIC_ERROR = 'Something went wrong. Please try again.';

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fallbackStatus(): Promise<SessionStatus> {
      try {
        return (await AsyncStorage.getItem(GUEST_KEY)) === '1' ? 'guest' : 'signedOut';
      } catch {
        return 'signedOut';
      }
    }

    async function init() {
      if (supabase) {
        const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (cancelled) return;
        if (data.session) {
          setEmail(data.session.user.email ?? null);
          setStatus('signedIn');
          return;
        }
      }
      const next = await fallbackStatus();
      if (!cancelled) setStatus(next);
    }
    init();

    if (!supabase) return () => void (cancelled = true);

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setEmail(session.user.email ?? null);
        setStatus('signedIn');
        AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        setEmail(null);
        setStatus('signedOut');
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    setStatus('guest');
    AsyncStorage.setItem(GUEST_KEY, '1').catch(() => {});
  }, []);

  const sendEmailCode = useCallback(async (address: string) => {
    if (!supabase) return NOT_SET_UP;
    const { error } = await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: true } });
    return error ? error.message || GENERIC_ERROR : null;
  }, []);

  const verifyEmailCode = useCallback(async (address: string, code: string) => {
    if (!supabase) return NOT_SET_UP;
    const { error } = await supabase.auth.verifyOtp({ email: address, token: code, type: 'email' });
    return error ? 'That code is not right, or it has expired.' : null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return NOT_SET_UP;
    // Must also be listed under Authentication > URL Configuration > Redirect URLs.
    const redirectTo = Linking.createURL('sign-in');
    const native = Platform.OS !== 'web';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: native },
    });
    if (error) return GENERIC_ERROR;
    if (!native || !data.url) return null; // web: the page is already redirecting

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null; // reader closed the browser
    const code = new URL(result.url).searchParams.get('code');
    if (!code) return GENERIC_ERROR;
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return exchangeError ? GENERIC_ERROR : null;
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
    if (supabase) await supabase.auth.signOut().catch(() => {});
    setEmail(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      email,
      authAvailable: !!supabase,
      continueAsGuest,
      sendEmailCode,
      verifyEmailCode,
      signInWithGoogle,
      signOut,
    }),
    [status, email, continueAsGuest, sendEmailCode, verifyEmailCode, signInWithGoogle, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
