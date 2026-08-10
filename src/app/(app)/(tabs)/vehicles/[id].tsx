import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Badge } from '../../../../components/Badge';
import { Banner } from '../../../../components/Banner';
import { Button } from '../../../../components/Button';
import { ApiError } from '../../../../api/http-client';
import { kycBlockReason } from '../../../../features/kyc/kyc-errors';
import type { KycBlockReason } from '../../../../features/kyc/kyc-errors';
import { KycBlockedBanner } from '../../../../features/kyc/components/KycBlockedBanner';
import {
  useActivateVehicleMutation,
  useDeleteVehicleMutation,
  useVehicleQuery,
  useVehiclesQuery,
} from '../../../../features/vehicles/api';
import { ActivateConfirmDialog } from '../../../../features/vehicles/components/ActivateConfirmDialog';
import { VehicleForm } from '../../../../features/vehicles/components/VehicleForm';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useVehicleQuery(id);
  const { data: listData } = useVehiclesQuery();
  const activateMutation = useActivateVehicleMutation();
  const deleteMutation = useDeleteVehicleMutation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<KycBlockReason | null>(null);

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const { vehicle } = data;
  const currentlyActive = listData?.vehicles.find((v) => v.is_active && v.id !== vehicle.id);

  const handleActivate = () => {
    activateMutation.mutate(vehicle.id, {
      onSuccess: () => {
        setConfirmVisible(false);
        setBlockReason(null);
      },
      onError: (error) => {
        setConfirmVisible(false);
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
  };

  const handleDelete = () => {
    deleteMutation.mutate(vehicle.id, {
      onSuccess: () => router.back(),
      onError: (error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to remove vehicle.');
      },
    });
  };

  return (
    <View className="flex-1">
      <View className="px-6 pt-6">
        {blockReason && (
          <KycBlockedBanner
            reason={blockReason}
            onDismiss={() => setBlockReason(null)}
            onPressAction={() =>
              router.push({ pathname: '/(app)/(tabs)/verify', params: { vehicleId: vehicle.id } })
            }
          />
        )}

        {errorMessage && (
          <Banner
            message={errorMessage}
            variant="error"
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-neutral-900">{vehicle.plate_number}</Text>
          <Badge
            label={vehicle.is_active ? 'Active' : 'Inactive'}
            variant={vehicle.is_active ? 'active' : 'inactive'}
          />
        </View>

        {!vehicle.is_active && (
          <View className="mb-2">
            <Button
              label="Activate"
              onPress={() => setConfirmVisible(true)}
              loading={activateMutation.isPending}
            />
          </View>
        )}

        <View className="mb-2">
          <Button
            label="Verify documents"
            variant="ghost"
            onPress={() =>
              router.push({ pathname: '/(app)/(tabs)/verify', params: { vehicleId: vehicle.id } })
            }
          />
        </View>
      </View>

      <VehicleForm
        mode="edit"
        vehicleId={vehicle.id}
        defaultValues={{
          plate_number: vehicle.plate_number,
          color: vehicle.color,
          model_name: vehicle.model_name,
          seat_count: vehicle.seat_count,
          category: vehicle.category,
        }}
      />

      <View className="px-6 pb-6">
        <Button
          label="Remove vehicle"
          variant="ghost"
          onPress={handleDelete}
          loading={deleteMutation.isPending}
        />
      </View>

      <ActivateConfirmDialog
        visible={confirmVisible}
        target={vehicle}
        currentlyActive={currentlyActive}
        onConfirm={handleActivate}
        onCancel={() => setConfirmVisible(false)}
        loading={activateMutation.isPending}
      />
    </View>
  );
}
