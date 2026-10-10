import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useSession } from '@/session/session-provider';

export type SignInStep = 'choose' | 'email' | 'code';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_UNFINISHED = 'Google sign-in didn’t finish. Please try again, or continue with email.';

/**
 * State and actions shared by the phone sign-in screen and the wide web page.
 * On web it also reads what Supabase sends back after Google: an error in the address, or a code that
 * didn't turn into a session, is shown to the reader instead of silently leaving them on the first step.
 */
export function useSignInFlow() {
  const router = useRouter();
  const { status, continueAsGuest, sendEmailCode, verifyEmailCode, signInWithGoogle } = useSession();

  const [step, setStep] = useState<SignInStep>('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<null | 'google' | 'email' | 'code'>(null);
  const [ownError, setError] = useState<string | null>(null);
  // Web: what came back from Google, read once from the address.
  const [returned] = useState(readReturn);
  const [dismissed, setDismissed] = useState(false);

  // Signed in (by code, Google, or an OAuth redirect back to this page): move on.
  useEffect(() => {
    if (status === 'signedIn') router.replace('/feed');
  }, [status, router]);

  // The session check waits for the code exchange, so once status settles the result is known.
  const settled = status !== 'loading' && status !== 'signedIn';
  const googleError =
    returned && settled && !dismissed
      ? returned.error
        ? `${GOOGLE_UNFINISHED} (${returned.error})`
        : returned.code
          ? GOOGLE_UNFINISHED
          : null
      : null;
  const error = ownError ?? googleError;

  const address = email.trim();
  const emailOk = EMAIL_SHAPE.test(address);

  async function run(kind: 'google' | 'email' | 'code', task: () => Promise<string | null>, onDone?: () => void) {
    setBusy(kind);
    setError(null);
    setDismissed(true);
    const message = await task();
    setBusy(null);
    if (message) setError(message);
    else onDone?.();
  }

  return {
    step,
    email,
    setEmail,
    code,
    setCode: (value: string) => setCode(value.replace(/\D/g, '')),
    busy,
    error,
    address,
    emailOk,
    google: () => run('google', signInWithGoogle),
    toEmail: () => {
      setError(null);
      setDismissed(true);
      setStep('email');
    },
    sendCode: () => {
      if (emailOk) run('email', () => sendEmailCode(address), () => setStep('code'));
    },
    resendCode: () => run('email', () => sendEmailCode(address)),
    verify: () => run('code', () => verifyEmailCode(address, code)),
    back: () => {
      setError(null);
      setDismissed(true);
      setStep('choose');
    },
    differentEmail: () => {
      setError(null);
      setDismissed(true);
      setCode('');
      setStep('email');
    },
    notNow: () => {
      continueAsGuest();
      router.replace('/feed');
    },
  };
}

export type SignInFlow = ReturnType<typeof useSignInFlow>;

/** Supabase puts errors in the query (PKCE) or the hash; a code means Google sent the reader back. */
function readReturn(): null | { code: boolean; error: string | null } {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const params = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.slice(1)}`);
  const description = params.get('error_description');
  return { code: params.has('code'), error: description ? description.replace(/\+/g, ' ') : params.get('error') };
}
