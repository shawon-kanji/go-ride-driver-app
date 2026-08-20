import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { EmptyState } from '../../../components/EmptyState';
import { useKycStatusQuery } from '../../../features/kyc/api';
import { DocumentTile } from '../../../features/kyc/components/DocumentTile';
import { VehicleDocumentSelector } from '../../../features/kyc/components/VehicleDocumentSelector';
import {
  IDENTITY_DOCUMENT_TYPES,
  VEHICLE_DOCUMENT_TYPES,
} from '../../../features/kyc/schemas';
import { useVehiclesQuery } from '../../../features/vehicles/api';
import type { KycStatus } from '../../../api/types';

const KYC_STATUS_BADGE: Record<KycStatus, { label: string; variant: 'active' | 'inactive' | 'pending' | 'blocked' }> = {
  not_started: { label: 'Not started', variant: 'inactive' },
  in_review: { label: 'In review', variant: 'pending' },
  approved: { label: 'Approved', variant: 'active' },
  rejected: { label: 'Rejected', variant: 'blocked' },
};

export default function VerifyScreen() {
  const { data: kyc, isLoading } = useKycStatusQuery();
  const { data: vehicleData } = useVehiclesQuery();
  const { vehicleId: vehicleIdParam } = useLocalSearchParams<{ vehicleId?: string }>();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(vehicleIdParam);

  if (isLoading || !kyc) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const vehicles = vehicleData?.vehicles ?? [];
  const effectiveVehicleId = selectedVehicleId ?? vehicles[0]?.id;
  const statusBadge = KYC_STATUS_BADGE[kyc.kyc_status];

  return (
    <ScrollView className="flex-1 px-6 py-6" contentContainerClassName="pb-12">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-neutral-900">Verification</Text>
        <Badge label={statusBadge.label} variant={statusBadge.variant} />
      </View>
      <Text className="mb-6 text-sm text-neutral-600">
        Upload every document below. Approval is manual and can take a little while.
      </Text>

      <Text className="mb-3 text-lg font-semibold text-neutral-900">Identity</Text>
      {IDENTITY_DOCUMENT_TYPES.map((type) => (
        <DocumentTile
          key={type}
          documentType={type}
          document={kyc.documents.find((d) => d.document_type === type && d.vehicle_id === undefined)}
          onPress={() =>
            router.push({ pathname: '/verify/[documentType]', params: { documentType: type } })
          }
        />
      ))}

      <Text className="mb-3 mt-6 text-lg font-semibold text-neutral-900">Vehicle documents</Text>
      {vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          message="Register a vehicle before uploading its documents."
          ctaLabel="Add vehicle"
          onPressCta={() => router.push('/vehicles/new')}
        />
      ) : (
        <>
          {vehicles.length > 1 && effectiveVehicleId ? (
            <VehicleDocumentSelector
              vehicles={vehicles}
              value={effectiveVehicleId}
              onChange={setSelectedVehicleId}
            />
          ) : (
            <Text className="mb-4 text-sm font-medium text-neutral-700">
              {vehicles[0]?.plate_number}
            </Text>
          )}

          {effectiveVehicleId &&
            VEHICLE_DOCUMENT_TYPES.map((type) => (
              <DocumentTile
                key={type}
                documentType={type}
                document={kyc.documents.find(
                  (d) => d.document_type === type && d.vehicle_id === effectiveVehicleId,
                )}
                onPress={() =>
                  router.push({
                    pathname: '/verify/[documentType]',
                    params: { documentType: type, vehicleId: effectiveVehicleId },
                  })
                }
              />
            ))}
        </>
      )}
    </ScrollView>
  );
}
