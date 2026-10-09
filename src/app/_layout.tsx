import {
  Baskervville_400Regular,
  Baskervville_500Medium,
  Baskervville_700Bold,
} from '@expo-google-fonts/baskervville';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Mukta_400Regular, Mukta_500Medium } from '@expo-google-fonts/mukta';
import { TiroDevanagariHindi_400Regular } from '@expo-google-fonts/tiro-devanagari-hindi';
import { TiroDevanagariMarathi_400Regular } from '@expo-google-fonts/tiro-devanagari-marathi';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/toast';
import { SessionProvider } from '@/session/session-provider';
import { ReaderProvider } from '@/store/reader-provider';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

function Shell() {
  const { name, colors } = useTheme();
  return (
    <>
      <StatusBar style={name === 'ink' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Baskervville_400Regular,
    Baskervville_500Medium,
    Baskervville_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    TiroDevanagariHindi_400Regular,
    TiroDevanagariMarathi_400Regular,
    Mukta_400Regular,
    Mukta_500Medium,
  });
  const ready = loaded || !!error;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // On web, render straight away (system fonts until ours arrive) so the static HTML isn't empty.
  if (!ready && Platform.OS !== 'web') return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ReaderProvider>
          <SessionProvider>
            <ToastProvider>
              <Shell />
            </ToastProvider>
          </SessionProvider>
        </ReaderProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
