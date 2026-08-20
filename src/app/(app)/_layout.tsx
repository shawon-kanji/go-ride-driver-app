import { Stack } from 'expo-router';

import { SessionExpiryBanner } from '../../features/auth/components/SessionExpiryBanner';

export default function AppLayout() {
  return (
    <>
      <SessionExpiryBanner />
      {/* No explicit <Stack.Screen> children on purpose: Expo Router auto-registers
          every sibling route file, so later plans can add /menu without touching this
          file. Every child screen already sets headerShown itself or inherits false. */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
