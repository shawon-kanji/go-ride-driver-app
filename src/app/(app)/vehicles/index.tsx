import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Banner } from '../../../components/Banner';
import { Button } from '../../../components/Button';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { ApiError } from '../../../api/http-client';
import { useKycStatusQuery } from '../../../features/kyc/api';
import { KycBlockedBanner } from '../../../features/kyc/components/KycBlockedBanner';
import { kycBlockReason } from '../../../features/kyc/kyc-errors';
import type { KycBlockReason } from '../../../features/kyc/kyc-errors';
import { VEHICLE_DOCUMENT_TYPES } from '../../../features/kyc/schemas';
import { summariseTrack } from '../../../features/kyc/verification-summary';
import { useActivateVehicleMutation, useVehiclesQuery } from '../../../features/vehicles/api';
import { VehicleCard } from '../../../features/vehicles/components/VehicleCard';
import { VehicleListEmptyState } from '../../../features/vehicles/components/VehicleListEmptyState';

export default function VehiclesScreen() {
  const { data, isLoading } = useVehiclesQuery();
  const { data: kyc } = useKycStatusQuery();
  const activateMutation = useActivateVehicleMutation();
  const [blockReason, setBlockReason] = useState<KycBlockReason | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleActivate = (id: string) =>
    activateMutation.mutate(id, {
      onSuccess: () => {
        setBlockReason(null);
        setErrorMessage(null);
      },
      onError: (error) => {
        const reason = kycBlockReason(error);
        if (reason) {
          setBlockReason(reason);
          setErrorMessage(null);
          return;
        }
        setBlockReason(null);
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to activate vehicle.');
      },
    });

  const approvedCountFor = (vehicleId: string) =>
    kyc ? summariseTrack(VEHICLE_DOCUMENT_TYPES, kyc.documents, vehicleId).approvedCount : 0;

  return (
    <View className="flex-1 bg-neutral-50">
      <ScreenHeader
        title="My vehicles"
        right={
          <Button
            label="+ Add"
            variant="tonal"
            shape="pill"
            size="compact"
            onPress={() => router.push('/vehicles/new')}
            testID="vehicles-add"
          />
        }
      />

      {isLoading || !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : data.vehicles.length === 0 ? (
        <VehicleListEmptyState />
      ) : (
        <>
          <View className="px-5 pt-4">
            {blockReason && (
              <KycBlockedBanner
                reason={blockReason}
                onDismiss={() => setBlockReason(null)}
                onPressAction={() => router.push('/verify')}
              />
            )}
            {errorMessage && (
              <Banner
                message={errorMessage}
                variant="error"
                onDismiss={() => setErrorMessage(null)}
              />
            )}
          </View>

          <FlatList
            data={data.vehicles}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pb-12 pt-4"
            renderItem={({ item }) => (
              <VehicleCard
                vehicle={item}
                approvedDocumentCount={approvedCountFor(item.id)}
                onPress={() => router.push(`/vehicles/${item.id}`)}
                onActivate={item.is_active ? undefined : () => handleActivate(item.id)}
                activating={activateMutation.isPending && activateMutation.variables === item.id}
              />
            )}
          />
        </>
      )}
    </View>
  );
}
