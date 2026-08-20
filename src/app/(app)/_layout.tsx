import { Stack } from 'expo-router';

import { SessionExpiryBanner } from '../../features/auth/components/SessionExpiryBanner';
import { useLocationBroadcastLifecycle } from '../../features/presence/use-location-broadcast-lifecycle';

export default function AppLayout() {
  // App-level, not screen-level: broadcasting must survive navigating from Home to
  // Menu / Vehicles / Verify / Profile.
  useLocationBroadcastLifecycle();

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
