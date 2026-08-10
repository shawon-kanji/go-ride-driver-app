import { View } from 'react-native';

import { Banner } from '../../../components/Banner';
import { Button } from '../../../components/Button';
import type { KycBlockReason } from '../kyc-errors';

const MESSAGES: Record<KycBlockReason, string> = {
  identity:
    "Your identity documents aren't approved yet. Upload or fix them to activate a vehicle and go online.",
  vehicle:
    "This vehicle's documents aren't approved yet. Upload or fix this vehicle's documents before activating it.",
};

interface KycBlockedBannerProps {
  reason: KycBlockReason;
  onPressAction: () => void;
  onDismiss?: () => void;
}

export function KycBlockedBanner({ reason, onPressAction, onDismiss }: KycBlockedBannerProps) {
  return (
    <View className="mb-4">
      <Banner message={MESSAGES[reason]} variant="warning" onDismiss={onDismiss} />
      <Button label="Go to Verify" variant="ghost" onPress={onPressAction} />
    </View>
  );
}
