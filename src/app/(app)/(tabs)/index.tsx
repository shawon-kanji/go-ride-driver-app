import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { Card } from '../../../components/Card';
import { useKycStatusQuery } from '../../../features/kyc/api';
import { useProfileQuery } from '../../../features/profile/api';

const KYC_STATUS_BADGE = {
  not_started: { label: 'Not started', variant: 'inactive' },
  in_review: { label: 'In review', variant: 'pending' },
  approved: { label: 'Approved', variant: 'active' },
  rejected: { label: 'Rejected', variant: 'blocked' },
} as const;

export default function HomeScreen() {
  const { data } = useProfileQuery();
  const { data: kyc } = useKycStatusQuery();

  return (
    <View className="flex-1 px-6 py-6">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">
        {data ? `Hi, ${data.driver.first_name}` : 'Welcome back'}
      </Text>
      <Text className="mb-6 text-sm text-neutral-600">
        Going online is coming soon. Get ready: register a vehicle and finish document verification.
      </Text>

      <Card onPress={() => router.push('/(app)/(tabs)/verify')} className="mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-neutral-900">Verification</Text>
          {kyc && (
            <Badge
              label={KYC_STATUS_BADGE[kyc.kyc_status].label}
              variant={KYC_STATUS_BADGE[kyc.kyc_status].variant}
            />
          )}
        </View>
        <Text className="mt-1 text-sm text-neutral-600">
          {kyc?.kyc_status === 'approved'
            ? 'Your identity documents are approved.'
            : 'Upload your identity and vehicle documents to get approved.'}
        </Text>
      </Card>

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
