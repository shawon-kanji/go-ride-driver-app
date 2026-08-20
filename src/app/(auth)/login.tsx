import { Link, useLocalSearchParams } from 'expo-router';
import { Lock, Truck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Banner } from '../../components/Banner';
import { LoginForm } from '../../features/auth/components/LoginForm';
import { useSessionStore } from '../../stores/session-store';

export default function LoginScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  // One-time read-and-clear of the session store's expiry reason at mount —
  // a lazy initializer (not an effect) so it runs exactly once per screen instance.
  const [infoMessage, setInfoMessage] = useState<string | null>(() => {
    const reason = useSessionStore.getState().consumeSessionExpiredReason();
    if (reason) return reason;
    if (email) return 'Account created — please log in.';
    return null;
  });

  return (
    <View className="flex-1 bg-neutral-0">
      <View className="bg-primary-500 px-[22px] pb-[30px] pt-[34px]">
        <View className="flex-row items-center gap-[10px]">
          <Truck size={24} strokeWidth={2} color="#FFFFFF" />
          <Text className="text-[15px] font-jakarta-bold tracking-[0.14em] text-white/90">
            GO RIDE DRIVER
          </Text>
        </View>
        <Text className="mt-3 text-[30px] font-jakarta-extrabold tracking-[-0.02em] text-white">
          Welcome back
        </Text>
        <Text className="mt-2 text-[15px] font-jakarta text-white/[0.82]">
          Sign in to start your shift. Sessions last 60 minutes, then you&apos;ll be asked again.
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="grow px-[22px] pb-6 pt-[26px]">
        {infoMessage && (
          <Banner message={infoMessage} variant="info" onDismiss={() => setInfoMessage(null)} />
        )}

        <LoginForm initialEmail={email} />

        <View className="mt-4 flex-row items-center justify-center">
          <Text className="text-[15px] font-jakarta text-neutral-500">New driver? </Text>
          <Link href="/(auth)/signup" className="text-[15px] font-jakarta-bold text-primary-600">
            Create an account
          </Link>
        </View>

        <View className="mt-auto flex-row items-start gap-2 rounded-control bg-neutral-50 px-3 py-3">
          <Lock size={16} strokeWidth={2} color="#4B5563" />
          <Text className="flex-1 text-[13px] font-jakarta text-neutral-600">
            Your session is stored in the device keystore, so you stay signed in between shifts.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
