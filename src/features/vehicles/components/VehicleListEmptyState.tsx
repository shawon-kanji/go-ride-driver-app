import { router } from 'expo-router';

import { EmptyState } from '../../../components/EmptyState';

export function VehicleListEmptyState() {
  return (
    <EmptyState
      title="No vehicles yet"
      message="Register a vehicle and upload its documents before you can go online."
      ctaLabel="Register vehicle"
      onPressCta={() => router.push('/vehicles/new')}
    />
  );
}
