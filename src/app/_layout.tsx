import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { queryClient } from '../api/query-client';
import { useSessionStore } from '../stores/session-store';
import { PLUS_JAKARTA_SANS_FONT_MAP } from '../theme/typography';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const status = useSessionStore((s) => s.status);
  const [fontsLoaded, fontError] = useFonts(PLUS_JAKARTA_SANS_FONT_MAP);

  useEffect(() => {
    useSessionStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (status !== 'unknown' && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [status, fontsLoaded, fontError]);

  // fontError means "proceed with the system font", never a permanent splash block —
  // a font asset failure must not lock the driver out of the app.
  if (status === 'unknown' || (!fontsLoaded && !fontError)) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === 'unauthenticated'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'authenticated'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
