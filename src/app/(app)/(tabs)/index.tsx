import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../components/Card';
import { useProfileQuery } from '../../../features/profile/api';

export default function HomeScreen() {
  const { data } = useProfileQuery();

  return (
    <View className="flex-1 px-6 py-6">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">
        {data ? `Hi, ${data.driver.first_name}` : 'Welcome back'}
      </Text>
      <Text className="mb-6 text-sm text-neutral-600">
        Going online is coming soon — register an active vehicle to get ready.
      </Text>

      <Card onPress={() => router.push('/(app)/(tabs)/vehicles')} className="mb-3">
        <Text className="text-base font-semibold text-neutral-900">Vehicles</Text>
        <Text className="mt-1 text-sm text-neutral-600">Register and manage your vehicles</Text>
      </Card>

      <Card onPress={() => router.push('/(app)/(tabs)/profile')}>
        <Text className="text-base font-semibold text-neutral-900">Profile</Text>
        <Text className="mt-1 text-sm text-neutral-600">View and edit your details</Text>
      </Card>
    </View>
  );
}
