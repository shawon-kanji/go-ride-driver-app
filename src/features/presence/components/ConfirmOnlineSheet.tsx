import { router } from 'expo-router';
import { Car, Check, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import type { Vehicle } from '../../../api/types';
import { KycBlockedBanner } from '../../kyc/components/KycBlockedBanner';
import type { KycBlockReason } from '../../kyc/kyc-errors';
import { kycBlockReason } from '../../kyc/kyc-errors';
import { VEHICLE_DOCUMENT_TYPES } from '../../kyc/schemas';
import { useSetOnlineStatusMutation } from '../api';
import type { LocationReadiness } from '../permissions';
import { ensureForegroundLocation } from '../permissions';

interface ConfirmOnlineSheetProps {
  visible: boolean;
  /** The driver's active vehicle. D06 only opens the sheet when one exists. */
  vehicle: Vehicle;
  /** 0-5, from deriveOnlineGate().approvedVehicleDocumentCount. */
  approvedDocumentCount: number;
  /** Close without going online (scrim tap, drag handle, Switch vehicle). */
  onDismiss: () => void;
  /** PATCH /driver/online succeeded. D06 closes the sheet; the broadcaster is
   *  started by plan 02-05's layout-level lifecycle, NOT by this callback. */
  onWentOnline: () => void;
}

const GENERIC_ERROR = "Couldn't go online. Check your connection and try again.";

export function ConfirmOnlineSheet({
  visible,
  vehicle,
  approvedDocumentCount,
  onDismiss,
  onWentOnline,
}: ConfirmOnlineSheetProps) {
  const mutation = useSetOnlineStatusMutation();
  const [readiness, setReadiness] = useState<LocationReadiness | null>(null);
  const [blockReason, setBlockReason] = useState<KycBlockReason | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);

  const handleSwitchVehicle = () => {
    // No inline picker — CONTEXT.md defers it explicitly. Vehicles already owns the
    // activate/switch-active flow built in Phase 1.
    onDismiss();
    router.push('/vehicles');
  };

  const handleGoOnline = async () => {
    if (mutation.isPending) return;
    setBlockReason(null);
    setGenericError(null);

    // LOCKED SEQUENCING (Screen Flow Spec §3): the OS dialog fires HERE, on this
    // press — never on app launch, never on D06 mount.
    const result = await ensureForegroundLocation();
    setReadiness(result);
    if (result !== 'granted') return; // stay on the sheet and explain

    mutation.mutate(true, {
      onSuccess: () => onWentOnline(),
      onError: (error) => {
        const reason = kycBlockReason(error);
        if (reason) {
          setBlockReason(reason);
          return;
        }
        setGenericError(GENERIC_ERROR);
      },
    });
  };

  if (!visible) return null;

  const allDocumentsApproved = approvedDocumentCount === VEHICLE_DOCUMENT_TYPES.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      {/* Scrim: tapping it dismisses. */}
      <Pressable
        className="flex-1 justify-end bg-neutral-900/[0.55]"
        onPress={onDismiss}
        testID="confirm-online-scrim"
      >
        {/* Stop propagation: taps inside the sheet must not dismiss it. */}
        <Pressable className="rounded-t-[26px] bg-white px-5 pb-5 pt-[18px]" onPress={() => {}}>
          <View className="mb-4 h-1 w-11 self-center rounded-pill bg-neutral-200" />
          <Text className="text-[22px] font-jakarta-extrabold tracking-[-0.01em] text-neutral-900">
            Go online with this vehicle?
          </Text>
          <Text className="mt-2 text-[15px] font-jakarta text-neutral-600">
            Riders will be matched to the vehicle you confirm here, and its plate is shown to them at
            pickup.
          </Text>

          <View className="mt-4 overflow-hidden rounded-card border-[2px] border-primary-500 bg-primary-50">
            <View className="flex-row items-center px-4 py-3">
              <Car size={28} strokeWidth={2} color="#4338CA" />
              <View className="ml-3 flex-1">
                <Text className="text-[18px] font-jakarta-extrabold text-neutral-900">
                  {vehicle.model_name}
                </Text>
                <Text className="text-[14px] font-jakarta text-neutral-600">
                  {vehicle.color} · {vehicle.seat_count} seats · {vehicle.category}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[12px] font-jakarta-bold uppercase tracking-[0.08em] text-neutral-500">
                  PLATE
                </Text>
                <Text className="text-[17px] font-jakarta-extrabold text-neutral-900">
                  {vehicle.plate_number}
                </Text>
              </View>
            </View>

            {allDocumentsApproved && (
              <View className="flex-row items-center gap-2 bg-success-50 px-4 py-2">
                <Check size={16} strokeWidth={2} color="#166534" />
                <Text className="text-[13px] font-jakarta-bold text-success-700">
                  All {VEHICLE_DOCUMENT_TYPES.length} documents approved
                </Text>
              </View>
            )}
          </View>

          <View className="mt-4 flex-row items-start gap-2 rounded-control bg-neutral-50 px-3 py-3">
            <MapPin size={18} strokeWidth={2} color="#4B5563" />
            <Text className="flex-1 text-[13px] font-jakarta text-neutral-600">
              Your location is shared while you&apos;re online, and stops the moment you go offline.
            </Text>
          </View>

          {blockReason && (
            <KycBlockedBanner
              reason={blockReason}
              onPressAction={() => {
                onDismiss();
                router.push('/verify');
              }}
              onDismiss={() => setBlockReason(null)}
            />
          )}

          {!blockReason && readiness === 'denied' && (
            <View className="mt-4">
              <Text className="text-[15px] font-jakarta-bold text-warning-700">Turn on location</Text>
              <Text className="mt-1 text-[13px] font-jakarta text-neutral-600">
                Riders can only be matched to you while location sharing is on. Enable location access
                for Go Ride Driver in your device settings, then try again.
              </Text>
              <Button
                label="Try again"
                variant="ghost"
                shape="pill"
                size="compact"
                onPress={handleGoOnline}
                testID="confirm-online-try-again"
              />
            </View>
          )}

          {!blockReason && readiness === 'services_off' && (
            <View className="mt-4">
              <Text className="text-[15px] font-jakarta-bold text-warning-700">Turn on location</Text>
              <Text className="mt-1 text-[13px] font-jakarta text-neutral-600">
                Location services are off on this device. Turn them on in your device settings, then
                try again.
              </Text>
              <Button
                label="Try again"
                variant="ghost"
                shape="pill"
                size="compact"
                onPress={handleGoOnline}
                testID="confirm-online-try-again"
              />
            </View>
          )}

          {!blockReason && genericError && (
            <View className="mt-4">
              <Text className="text-[13px] font-jakarta text-warning-700">{genericError}</Text>
              <Button
                label="Try again"
                variant="ghost"
                shape="pill"
                size="compact"
                onPress={handleGoOnline}
                testID="confirm-online-try-again"
              />
            </View>
          )}

          <View className="mt-5 flex-row gap-3">
            <View className="w-[46%]">
              <Button
                label="Switch vehicle"
                variant="ghost"
                shape="pill"
                size="large"
                onPress={handleSwitchVehicle}
                testID="confirm-online-switch"
              />
            </View>
            <View className="flex-1">
              <Button
                label="Go online"
                variant="success"
                shape="pill"
                size="large"
                loading={mutation.isPending}
                onPress={handleGoOnline}
                testID="confirm-online-go"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
