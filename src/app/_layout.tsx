import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import {
  Baskervville_400Regular,
  Baskervville_400Regular_Italic,
  Baskervville_500Medium,
  Baskervville_500Medium_Italic,
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

import { useEditionSchedule } from '@/components/notification-settings';
import { InstallGuideProvider } from '@/components/install-guide';
import { ToastProvider } from '@/components/toast';
import { useAccountSync } from '@/session/account-sync';
import { NewsProvider } from '@/data/news';
import { TourProvider } from '@/tour/tour';
import { useWebScrollMemory } from '@/hooks/use-web-scroll-memory';
import { SessionProvider } from '@/session/session-provider';
import { ReaderProvider } from '@/store/reader-provider';
import { useSourceCleanup } from '@/store/source-cleanup';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

function Shell() {
  const { name, colors } = useTheme();
  useWebScrollMemory();
  useEditionSchedule();
  useAccountSync();
  useSourceCleanup();
  return (
    <>
      <StatusBar style={name === 'ink' ? 'light' : 'dark'} />
      <TourProvider>
        <InstallGuideProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
        </InstallGuideProvider>
      </TourProvider>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Baskervville_400Regular,
    Baskervville_400Regular_Italic,
    Baskervville_500Medium,
    Baskervville_500Medium_Italic,
    Baskervville_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
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
      {/* Reader settings come first: the theme reads its accessibility colour options. */}
      <ReaderProvider>
        <ThemeProvider>
          <NewsProvider>
          <SessionProvider>
            <ToastProvider>
              <Shell />
            </ToastProvider>
          </SessionProvider>
          </NewsProvider>
        </ThemeProvider>
      </ReaderProvider>
    </SafeAreaProvider>
  );
}
