import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { StampDown } from '@/components/stamp';
import { Text } from '@/components/text';
import { Photo } from '@/components/ui';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth } from '@/constants/theme';
import { type SignInFlow } from '@/session/use-sign-in-flow';
import { useTheme } from '@/theme/theme-provider';

/**
 * Sign in on web at 768px and wider: the sign-in step of WebOnboarding as its own page. Wordmark header,
 * the steps on the left (460px), the edition art card on the right with the capped Brand stamp landing on it.
 */
export function WideSignIn({ flow }: { flow: SignInFlow }) {
  const { colors, name } = useTheme();
  const router = useRouter();
  const body = name === 'ink' ? '#B5AC9C' : '#3F3A33';
  const { step, email, setEmail, code, setCode, busy, error, address, emailOk } = flow;
  const input = [styles.input, { borderColor: colors.ink, color: colors.ink, backgroundColor: colors.surface }];

  return (
    <View style={{ flex: 1, minHeight: '100%' as never, backgroundColor: colors.bg }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.rule }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="link" accessibilityLabel="Un:edited" onPress={() => router.replace('/')}>
            <Wordmark size={28} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.main}>
          {step === 'choose' ? (
            <>
              <Text variant="display" accessibilityRole="header" style={styles.h1}>
                Keep your edition on every device.
              </Text>
              <Text variant="ui" style={{ color: body, lineHeight: 23 }}>
                Sign in to keep your sources, settings and saved folders in sync between this browser and your phone.
              </Text>
            </>
          ) : null}

          {step === 'email' ? (
            <>
              <Text variant="display" accessibilityRole="header" style={styles.h1}>
                Continue with email
              </Text>
              <Text variant="ui" style={{ color: body, lineHeight: 23 }}>
                We&rsquo;ll email you a code. There&rsquo;s no password to remember.
              </Text>
              <Text variant="meta" color="muted" style={{ marginTop: 8 }}>
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Email address"
                onSubmitEditing={flow.sendCode}
                autoFocus
                style={input}
              />
            </>
          ) : null}

          {step === 'code' ? (
            <>
              <Text variant="display" accessibilityRole="header" style={styles.h1}>
                Check your email
              </Text>
              <Text variant="ui" style={{ color: body, lineHeight: 23 }}>
                We sent a code to {address}. Enter it here.
              </Text>
              <Text variant="meta" color="muted" style={{ marginTop: 8 }}>
                Code
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={10}
                accessibilityLabel="Code from your email"
                onSubmitEditing={() => code.length >= 6 && flow.verify()}
                autoFocus
                style={[input, styles.codeInput]}
              />
            </>
          ) : null}

          {error ? (
            <Text variant="meta" color="accent" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <View style={{ gap: 16, marginTop: 4 }}>
            {step === 'choose' ? (
              <>
                <Button label="Continue with Google" busy={busy === 'google'} onPress={flow.google} />
                <Button label="Continue with email" kind="secondary" onPress={flow.toEmail} />
                <Button label="Not now" kind="link" onPress={flow.notNow} />
                <Text variant="meta" color="muted" style={{ textAlign: 'center', lineHeight: 19 }}>
                  Without an account, your choices stay in this browser and saving to folders is off.
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
        </View>

        <View style={styles.aside}>
          <View aria-hidden style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.rule }]}>
            <View style={[styles.artStrip, { borderTopColor: colors.ink, borderBottomColor: colors.ink }]}>
              <Text variant="label" color="muted">
                Morning Edition Nº 1
              </Text>
              <Text variant="label" color="muted">
                6:00 AM
              </Text>
            </View>
            <Photo height={150} />
            <Text variant="display" style={{ fontSize: 22, lineHeight: 25 }}>
              Water board clears a 24-hour supply pilot for three wards
            </Text>
            <Text variant="meta" color="muted">
              Morning Ledger · Deccan Courier · +2
            </Text>
            <StampDown kind="brand" capped size={110} style={styles.stamp} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 32,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingTop: 72,
    paddingHorizontal: 32,
    paddingBottom: 72,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    columnGap: 96,
    rowGap: 56,
  },
  main: { flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 460, gap: 16 },
  aside: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0, maxWidth: 380 },
  h1: { fontSize: 44, lineHeight: 46, letterSpacing: -0.6 },
  input: { height: 52, borderWidth: 1, paddingHorizontal: 16, fontFamily: Fonts.sans, fontSize: 16 },
  codeInput: { fontFamily: Fonts.mono, fontSize: 22, letterSpacing: 6 },
  card: { padding: 20, borderWidth: 1, gap: 10 },
  artStrip: { borderTopWidth: 2, borderBottomWidth: 1, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' },
  stamp: { position: 'absolute', right: -40, bottom: -36 },
});
