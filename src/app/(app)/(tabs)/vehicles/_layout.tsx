import { Stack } from 'expo-router';

export default function VehiclesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Vehicles', headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Register vehicle' }} />
      <Stack.Screen name="[id]" options={{ title: 'Vehicle' }} />
    </Stack>
  );
}
