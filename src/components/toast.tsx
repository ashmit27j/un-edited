import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/theme/theme-provider';

type ToastState = { text: string; action?: { label: string; run: () => void } } | null;
type ToastValue = { show: (text: string, action?: { label: string; run: () => void }) => void };

const ToastContext = createContext<ToastValue>({ show: () => {} });

/** "Saved · Change folder" style toast. Hides after about 4 seconds. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Phones: above the tab bar. Web 768px+: 32px from the bottom (no tab bar there).
  const bottom = useLayout() === 'phone' ? insets.bottom + 84 : 32;
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ToastValue['show']>((text, action) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ text, action });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.toast, { backgroundColor: colors.ink }]}>
            <Text variant="ui" style={{ color: colors.bg, flexShrink: 1 }}>
              {toast.text}
            </Text>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.run();
                  setToast(null);
                }}
                style={styles.action}>
                <Text variant="ui" medium style={{ color: colors.bg, textDecorationLine: 'underline' }}>
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  // Fixed on web: from 768px the document scrolls, so 'absolute' would pin it to the end of the page.
  wrap: { position: Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16, zIndex: 20 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: 520,
  },
  action: { minHeight: 44, justifyContent: 'center' },
});
