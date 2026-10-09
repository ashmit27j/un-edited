import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EditionCard } from '@/components/edition-card';
import { StampDown } from '@/components/stamp';
import { Text } from '@/components/text';
import { Wordmark } from '@/components/wordmark';
import { Fonts, Spacing, TouchTarget } from '@/constants/theme';
import { useSession } from '@/session/session-provider';
import { useTheme } from '@/theme/theme-provider';

// Lets the web popup flow hand control back to this page.
WebBrowser.maybeCompleteAuthSession();

type Step = 'choose' | 'email' | 'code';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, continueAsGuest, sendEmailCode, verifyEmailCode, signInWithGoogle } = useSession();

  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<null | 'google' | 'email' | 'code'>(null);
  const [error, setError] = useState<string | null>(null);

  // Signed in (by code, Google, or an OAuth redirect back to this page): move on.
  useEffect(() => {
    if (status === 'signedIn') router.replace('/feed');
  }, [status, router]);

  const address = email.trim();
  const emailOk = EMAIL_SHAPE.test(address);

  async function run(kind: 'google' | 'email' | 'code', task: () => Promise<string | null>, onDone?: () => void) {
    setBusy(kind);
    setError(null);
    const message = await task();
    setBusy(null);
    if (message) setError(message);
    else onDone?.();
  }

  const inputStyle = [styles.input, { borderColor: colors.ink, color: colors.ink, backgroundColor: colors.surface }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <View style={styles.column}>
          {step === 'choose' ? (
            <>
              <View style={styles.cardWrap}>
                <EditionCard />
                <StampDown kind="brand" capped size={96} style={styles.stamp} />
              </View>
              <Text variant="display" style={styles.heading}>
                Keep your edition on every device.
              </Text>
              <Text variant="body" color="muted">
                Sign in to keep your sources, settings and saved folders in sync.
              </Text>
            </>
          ) : null}

          {step !== 'choose' ? <Wordmark size={26} /> : null}

          {step === 'email' ? (
            <>
              <Text variant="display" style={styles.heading}>
                Continue with email
              </Text>
              <Text variant="body" color="muted">
                We&rsquo;ll email you a code. There&rsquo;s no password to remember.
              </Text>
              <Text variant="meta" color="muted" style={styles.fieldLabel}>
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Email address"
                onSubmitEditing={() =>
                  emailOk && run('email', () => sendEmailCode(address), () => setStep('code'))
                }
                style={inputStyle}
              />
            </>
          ) : null}

          {step === 'code' ? (
            <>
              <Text variant="display" style={styles.heading}>
                Check your email
              </Text>
              <Text variant="body" color="muted">
                We sent a code to {address}. Enter it here.
              </Text>
              <Text variant="meta" color="muted" style={styles.fieldLabel}>
                Code
              </Text>
              <TextInput
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
                autoComplete="one-time-code"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={10}
                accessibilityLabel="Code from your email"
                style={[inputStyle, styles.codeInput]}
              />
            </>
          ) : null}

          {error ? (
            <Text variant="meta" color="accent" accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </View>

        <View style={[styles.column, styles.actions]}>
          {step === 'choose' ? (
            <>
              <Button
                label="Continue with Google"
                busy={busy === 'google'}
                onPress={() => run('google', signInWithGoogle)}
              />
              <Button
                label="Continue with email"
                kind="secondary"
                onPress={() => {
                  setError(null);
                  setStep('email');
                }}
              />
              <Button
                label="Not now"
                kind="link"
                onPress={() => {
                  continueAsGuest();
                  router.replace('/feed');
                }}
              />
              <Text variant="meta" color="muted" style={styles.note}>
                Without an account, your choices stay on this device and saving to folders is off.
              </Text>
            </>
          ) : null}

          {step === 'email' ? (
            <>
              <Button
                label="Send code"
                disabled={!emailOk}
                busy={busy === 'email'}
                onPress={() => run('email', () => sendEmailCode(address), () => setStep('code'))}
              />
              <Button
                label="Back"
                kind="link"
                onPress={() => {
                  setError(null);
                  setStep('choose');
                }}
              />
            </>
          ) : null}

          {step === 'code' ? (
            <>
              <Button
                label="Sign in"
                disabled={code.length < 6}
                busy={busy === 'code'}
                onPress={() => run('code', () => verifyEmailCode(address, code))}
              />
              <Button
                label="Send a new code"
                kind="secondary"
                busy={busy === 'email'}
                onPress={() => run('email', () => sendEmailCode(address))}
              />
              <Button
                label="Use a different email"
                kind="link"
                onPress={() => {
                  setError(null);
                  setCode('');
                  setStep('email');
                }}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: Spacing.four, justifyContent: 'space-between', gap: Spacing.five },
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: Spacing.two },
  cardWrap: { alignSelf: 'center', marginTop: Spacing.two },
  stamp: { position: 'absolute', right: -52, top: 166 },
  heading: { marginTop: Spacing.four },
  fieldLabel: { marginTop: Spacing.three },
  input: {
    height: TouchTarget + 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.sans,
    fontSize: 16,
  },
  codeInput: { fontFamily: Fonts.mono, fontSize: 22, letterSpacing: 6 },
  error: { marginTop: Spacing.one },
  actions: { gap: 10 },
  note: { textAlign: 'center', marginTop: 2 },
});
