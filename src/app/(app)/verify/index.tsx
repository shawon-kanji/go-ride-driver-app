import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { EmptyState } from '../../../components/EmptyState';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { SectionCard } from '../../../components/SectionCard';
import { useKycStatusQuery } from '../../../features/kyc/api';
import { DocumentTile } from '../../../features/kyc/components/DocumentTile';
import { VehicleDocumentSelector } from '../../../features/kyc/components/VehicleDocumentSelector';
import {
  IDENTITY_DOCUMENT_TYPES,
  VEHICLE_DOCUMENT_TYPES,
} from '../../../features/kyc/schemas';
import { describeVerificationBlockers, summariseTrack } from '../../../features/kyc/verification-summary';
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
  const selectedVehicle = vehicles.find((v) => v.id === effectiveVehicleId);
  const statusBadge = KYC_STATUS_BADGE[kyc.kyc_status];

  const identity = summariseTrack(IDENTITY_DOCUMENT_TYPES, kyc.documents, undefined);
  const vehicleTrack = effectiveVehicleId
    ? summariseTrack(VEHICLE_DOCUMENT_TYPES, kyc.documents, effectiveVehicleId)
    : null;
  const blockerSentence = describeVerificationBlockers(identity, vehicleTrack);

  return (
    <View className="flex-1 bg-neutral-50">
      <ScreenHeader
        title="Verification"
        right={<Badge label={statusBadge.label} variant={statusBadge.variant} />}
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12 pt-4">
        {blockerSentence && (
          <View className="flex-row items-start gap-3 rounded-control bg-warning-50 px-3 py-3">
            <AlertTriangle size={18} strokeWidth={2} color="#92400E" />
            <Text className="flex-1 text-[14px] font-jakarta-semibold text-warning-700">
              {blockerSentence}
            </Text>
          </View>
        )}

        <SectionCard eyebrow="Your identity" meta={`${identity.uploadedCount} of 5 uploaded`}>
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
        </SectionCard>

        {vehicles.length === 0 ? (
          <SectionCard eyebrow="Vehicle documents">
            <EmptyState
              title="No vehicles yet"
              message="Register a vehicle before uploading its documents."
              ctaLabel="Add vehicle"
              onPressCta={() => router.push('/vehicles/new')}
            />
          </SectionCard>
        ) : (
          <>
            {vehicles.length > 1 && effectiveVehicleId && (
              <VehicleDocumentSelector
                vehicles={vehicles}
                value={effectiveVehicleId}
                onChange={setSelectedVehicleId}
              />
            )}

            {effectiveVehicleId && vehicleTrack && (
              <SectionCard
                eyebrow={`${selectedVehicle?.plate_number ?? 'Vehicle'} · Vehicle documents`}
                meta={`${vehicleTrack.uploadedCount} of 5 uploaded`}
              >
                {VEHICLE_DOCUMENT_TYPES.map((type) => (
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
              </SectionCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
