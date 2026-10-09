import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { useLayout } from '@/hooks/use-layout';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';
import { useT } from '@/lib/i18n';

/**
 * Sign out confirm (SignOut board: sheet on phones; WebSignOut: centred dialog on web).
 * Kept: sources, topics, folders and settings (they live in the account). Removed: downloads on this device.
 * Afterwards the reader carries on as a guest, with a toast offering to sign in again.
 */
export function SignOutPrompt({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, name } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const phone = useLayout() === 'phone';
  const { signOut, continueAsGuest } = useSession();
  const { downloaded, clearDownloads } = useReader();
  const scrim = name === 'ink' ? (phone ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.6)') : phone ? 'rgba(28,26,23,0.36)' : 'rgba(28,26,23,0.42)';
  const onAccent = name === 'ink' ? '#1C1A17' : '#F8F3EA';
  const body = name === 'ink' ? '#B5AC9C' : '#3F3A33';
  const t = useT();

  const confirm = async () => {
    onClose();
    clearDownloads();
    await signOut();
    continueAsGuest();
    if (phone) {
      router.replace('/home');
      toast.show('You’re signed out. Keep reading as a guest.', { label: 'Sign in', run: () => router.push('/sign-in') });
    } else {
      toast.show('You’re signed out. You can keep reading as a guest.', { label: 'Go to Home', run: () => router.replace('/home') });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, phone ? styles.rootPhone : styles.rootWeb]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]} />
        {phone ? (
          <View
            role="alertdialog"
            aria-labelledby="so-title"
            style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.rule, paddingBottom: insets.bottom + 30 }]}>
            <View style={[styles.grabber, { backgroundColor: colors.rule }]} />
            <Text variant="headline" medium nativeID="so-title" style={{ marginTop: 8, fontSize: 26, lineHeight: 30 }}>
              Sign out of Un:edited?
            </Text>
            <View style={{ borderTopWidth: 1, borderTopColor: colors.rule }}>
              <Line label="Kept" text="Your sources, topics, folders and settings stay in your account." />
              <Line
                label="Removed"
                accent
                text={`Downloaded articles on this phone${downloaded.length ? ` (${downloaded.length})` : ''}. You can download them again after signing in.`}
              />
            </View>
            <Pressable accessibilityRole="button" onPress={confirm} style={[styles.primary, { backgroundColor: colors.accent }]}>
              <Text variant="ui" medium style={{ fontSize: 16, color: onAccent }}>
                {t('you.signOut')}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.cancel, { borderColor: colors.ink }]}>
              <Text variant="ui" medium>
                {t('common.cancel')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            role="alertdialog"
            aria-modal
            aria-labelledby="wso-title"
            style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.rule, borderTopColor: colors.accent }]}>
            <Text variant="headline" medium nativeID="wso-title" style={{ fontSize: 28, lineHeight: 32 }}>
              Sign out of Un:edited?
            </Text>
            <Text variant="ui" style={{ fontSize: 14.5, lineHeight: 22.5, color: body }}>
              Your sources, topics, folders and settings stay in your account. Offline copies saved in this browser are cleared.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" onPress={onClose} style={[styles.dialogButton, { borderWidth: 1, borderColor: colors.ink }]}>
                <Text variant="ui" medium>
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={confirm} style={[styles.dialogButton, { backgroundColor: colors.accent, paddingHorizontal: 22 }]}>
                <Text variant="ui" medium style={{ color: onAccent }}>
                  {t('you.signOut')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function Line({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.line, { borderBottomColor: colors.rule }]}>
      <Text variant="label" color={accent ? 'accent' : 'muted'} style={{ width: 92, paddingTop: 2, letterSpacing: 0.8 }}>
        {label}
      </Text>
      <Text variant="ui" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootPhone: { justifyContent: 'flex-end' },
  rootWeb: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { borderTopWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingTop: 10, paddingHorizontal: 24, gap: 12 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  line: { paddingVertical: 10, flexDirection: 'row', gap: 10, borderBottomWidth: 1 },
  primary: { marginTop: 6, height: 52, alignItems: 'center', justifyContent: 'center' },
  cancel: { height: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '100%', maxWidth: 460, borderWidth: 1, borderTopWidth: 3, paddingTop: 26, paddingHorizontal: 28, paddingBottom: 24, gap: 14 },
  dialogActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  dialogButton: { height: 46, paddingHorizontal: 20, justifyContent: 'center' },
});
