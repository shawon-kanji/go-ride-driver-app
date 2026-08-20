import { router } from 'expo-router';
import { AlertTriangle, Car } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import type { Vehicle } from '../../../api/types';
import { VEHICLE_DOCUMENT_TYPES } from '../../kyc/schemas';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  /** Approved count for THIS vehicle's 5 documents, 0-5. */
  approvedDocumentCount: number;
  /** Rendered only when the vehicle is inactive AND fully verified. */
  onActivate?: () => void;
  activating?: boolean;
}

export function VehicleCard({
  vehicle,
  onPress,
  approvedDocumentCount,
  onActivate,
  activating = false,
}: VehicleCardProps) {
  const verified = approvedDocumentCount === VEHICLE_DOCUMENT_TYPES.length;
  const missing = VEHICLE_DOCUMENT_TYPES.length - approvedDocumentCount;

  return (
    <View
      testID="vehicle-card"
      className={`mb-3 overflow-hidden rounded-card border bg-white ${vehicle.is_active ? 'border-[2px] border-primary-500' : 'border-neutral-200'}`}
    >
      <Pressable
        testID="vehicle-card-body"
        onPress={onPress}
        className="flex-row items-center gap-3 p-4 active:bg-neutral-50"
      >
        <Car
          size={28}
          strokeWidth={2}
          color={vehicle.is_active || verified ? '#4338CA' : '#9CA3AF'}
        />
        <View className="flex-1">
          <Text className="text-[18px] font-jakarta-extrabold text-neutral-900">
            {vehicle.model_name}
          </Text>
          <Text className="mt-0.5 text-[14px] font-jakarta text-neutral-600">
            {`${vehicle.color} · ${vehicle.seat_count} seats · ${vehicle.category}`}
          </Text>
        </View>
        <Badge
          label={vehicle.is_active ? 'Active' : 'Inactive'}
          variant={vehicle.is_active ? 'active' : 'inactive'}
        />
      </Pressable>

      {/* Footer: two cells split by a vertical hairline */}
      <View className="flex-row border-t border-neutral-200">
        <View className="flex-1 border-r border-neutral-200 px-4 py-3">
          <Text className="text-[12px] font-jakarta-bold uppercase tracking-[0.08em] text-neutral-500">
            Plate
          </Text>
          <Text className="mt-1 text-[17px] font-jakarta-extrabold text-neutral-900">
            {vehicle.plate_number}
          </Text>
        </View>
        <View className="flex-1 flex-row items-center justify-between px-4 py-3">
          <View>
            <Text className="text-[12px] font-jakarta-bold uppercase tracking-[0.08em] text-neutral-500">
              Documents
            </Text>
            <Text
              className={`mt-1 text-[15px] font-jakarta-bold ${verified ? 'text-success-700' : 'text-warning-700'}`}
            >
              {`${approvedDocumentCount} of 5 approved`}
            </Text>
          </View>

          {/*
            Client-side gate, not the authority. go-ride-backend still returns
            403 VEHICLE_NOT_VERIFIED, and src/app/(app)/vehicles/[id].tsx still translates
            that via kycBlockReason + KycBlockedBanner (Phase 01.1 plan 07). This only stops
            the driver walking into a refusal they could have been warned about.
          */}
          {!vehicle.is_active && onActivate ? (
            verified ? (
              <Button
                label="Activate"
                variant="tonal"
                shape="pill"
                size="compact"
                loading={activating}
                onPress={onActivate}
                testID="vehicle-activate"
              />
            ) : (
              <Button
                label="Activate"
                variant="muted"
                shape="pill"
                size="compact"
                disabled
                onPress={() => {}}
                testID="vehicle-activate"
              />
            )
          ) : null}
        </View>
      </View>

      {!verified && (
        <View className="flex-row items-center gap-2 border-t border-neutral-200 bg-warning-50 px-4 py-3">
          <AlertTriangle size={16} strokeWidth={2} color="#92400E" />
          <Text className="flex-1 text-[13px] font-jakarta-semibold text-warning-700">
            {`${missing} ${missing === 1 ? 'document' : 'documents'} missing or rejected, so this vehicle can't be activated yet.`}
          </Text>
          <Pressable
            testID="vehicle-fix"
            hitSlop={8}
            onPress={() => router.push({ pathname: '/verify', params: { vehicleId: vehicle.id } })}
            className="h-11 justify-center px-2"
          >
            <Text className="text-[13px] font-jakarta-bold text-warning-700">Fix</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
