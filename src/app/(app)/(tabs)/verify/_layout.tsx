import { Stack } from 'expo-router';

export default function VerifyLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Verify', headerShown: false }} />
      <Stack.Screen name="[documentType]" options={{ title: 'Document' }} />
    </Stack>
  );
}
