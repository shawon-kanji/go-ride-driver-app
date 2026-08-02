import { Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { Card } from '../../../components/Card';
import type { Vehicle } from '../../../api/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900">
            {vehicle.plate_number}
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-600">
            {vehicle.model_name} · {vehicle.color}
          </Text>
        </View>
        <Badge
          label={vehicle.is_active ? 'Active' : 'Inactive'}
          variant={vehicle.is_active ? 'active' : 'inactive'}
        />
      </View>
    </Card>
  );
}
