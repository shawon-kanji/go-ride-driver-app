import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '../../components/ScreenHeader';
import { SignupForm } from '../../features/auth/components/SignupForm';

export default function SignupScreen() {
  return (
    <View className="flex-1 bg-neutral-0">
      <ScreenHeader title="Create your driver account" />

      <ScrollView className="flex-1" contentContainerClassName="grow px-[22px] pb-6 pt-5">
        <SignupForm />
      </ScrollView>

      <View className="border-t border-neutral-200 px-[22px] pb-6 pt-4">
        <View className="flex-row items-center justify-center">
          <Text className="text-[15px] font-jakarta text-neutral-500">Already registered? </Text>
          <Link href="/(auth)/login" className="text-[15px] font-jakarta-bold text-primary-600">
            Sign in
          </Link>
        </View>
      </View>
    </View>
  );
}
