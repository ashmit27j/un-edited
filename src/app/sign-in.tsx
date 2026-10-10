import * as WebBrowser from 'expo-web-browser';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EditionCard } from '@/components/edition-card';
import { StampDown } from '@/components/stamp';
import { Text } from '@/components/text';
import { WideSignIn } from '@/components/wide/sign-in';
import { Wordmark } from '@/components/wordmark';
import { Fonts, Spacing, TouchTarget } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useSignInFlow, type SignInFlow } from '@/session/use-sign-in-flow';
import { useTheme } from '@/theme/theme-provider';

// Lets the web popup flow hand control back to this page.
WebBrowser.maybeCompleteAuthSession();

/** Sign in (OB9SignIn on phones; the WebOnboarding sign-in step as its own page at 768px and wider). */
export default function SignIn() {
  const flow = useSignInFlow();
  return useLayout() === 'phone' ? <PhoneSignIn flow={flow} /> : <WideSignIn flow={flow} />;
}

function PhoneSignIn({ flow }: { flow: SignInFlow }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { step, email, setEmail, code, setCode, busy, error, address, emailOk } = flow;

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
                onSubmitEditing={flow.sendCode}
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
                onChangeText={setCode}
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
              <Button label="Continue with Google" busy={busy === 'google'} onPress={flow.google} />
              <Button label="Continue with email" kind="secondary" onPress={flow.toEmail} />
              <Button label="Not now" kind="link" onPress={flow.notNow} />
              <Text variant="meta" color="muted" style={styles.note}>
                Without an account, your choices stay on this device and saving to folders is off.
              </Text>
            </>
          ) : null}

          {step === 'email' ? (
            <>
              <Button label="Send code" disabled={!emailOk} busy={busy === 'email'} onPress={flow.sendCode} />
              <Button label="Back" kind="link" onPress={flow.back} />
            </>
          ) : null}

          {step === 'code' ? (
            <>
              <Button label="Sign in" disabled={code.length < 6} busy={busy === 'code'} onPress={flow.verify} />
              <Button label="Send a new code" kind="secondary" busy={busy === 'email'} onPress={flow.resendCode} />
              <Button label="Use a different email" kind="link" onPress={flow.differentEmail} />
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
