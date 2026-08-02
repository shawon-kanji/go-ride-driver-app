import { router } from 'expo-router';

import { EmptyState } from '../../../components/EmptyState';

export function VehicleListEmptyState() {
  return (
    <EmptyState
      title="No vehicles yet"
      message="Register a vehicle to start driving."
      ctaLabel="Register vehicle"
      onPressCta={() => router.push('/(app)/(tabs)/vehicles/new')}
    />
  );
}
