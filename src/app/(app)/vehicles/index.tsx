import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { useVehiclesQuery } from '../../../features/vehicles/api';
import { VehicleCard } from '../../../features/vehicles/components/VehicleCard';
import { VehicleListEmptyState } from '../../../features/vehicles/components/VehicleListEmptyState';

export default function VehiclesScreen() {
  const { data, isLoading } = useVehiclesQuery();

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const { vehicles } = data;

  if (vehicles.length === 0) {
    return <VehicleListEmptyState />;
  }

  return (
    <View className="flex-1 px-6 py-6">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-neutral-900">Vehicles</Text>
        <View className="w-40">
          <Button label="Add" onPress={() => router.push('/(app)/(tabs)/vehicles/new')} />
        </View>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() => router.push(`/(app)/(tabs)/vehicles/${item.id}`)}
          />
        )}
      />
    </View>
  );
}
