import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** Web static rendering runs in Node, where there is no browser storage. */
const isServerRender = Platform.OS === 'web' && typeof window === 'undefined';

/**
 * Supabase client, or null when the keys are missing (see .env.example) or while
 * the web build is pre-rendered. Everything that uses it must cope with null:
 * the app then runs as guest-only.
 */
export const supabase =
  url && key && !isServerRender
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
          flowType: 'pkce',
        },
      })
    : null;

// Only refresh tokens while the app is in the foreground.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
