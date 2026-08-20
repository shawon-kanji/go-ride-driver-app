import { router } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useKycStatusQuery } from '../../features/kyc/api';
import { KycBlockedBanner } from '../../features/kyc/components/KycBlockedBanner';
import { useProfileQuery } from '../../features/profile/api';
import { ConfirmOnlineSheet } from '../../features/presence/components/ConfirmOnlineSheet';
import { HomeMap } from '../../features/presence/components/HomeMap';
import { ProfileChip } from '../../features/presence/components/ProfileChip';
import { StatCards } from '../../features/presence/components/StatCards';
import { deriveOnlineGate, gateToKycBlockReason } from '../../features/presence/gating';
import { useSetOnlineStatusMutation } from '../../features/presence/api';
import { useHomeCoords } from '../../features/presence/use-home-coords';
import { useVehiclesQuery } from '../../features/vehicles/api';

const KYC_STATUS_BADGE = {
  not_started: { label: 'Not started', variant: 'inactive' },
  in_review: { label: 'In review', variant: 'pending' },
  approved: { label: 'Approved', variant: 'active' },
  rejected: { label: 'Rejected', variant: 'blocked' },
} as const;

export default function HomeScreen() {
  const { data: profile } = useProfileQuery();
  const { data: vehicleData } = useVehiclesQuery();
  const { data: kyc } = useKycStatusQuery();
  const coords = useHomeCoords();
  const setOnline = useSetOnlineStatusMutation();
  const [sheetVisible, setSheetVisible] = useState(false);

  const driver = profile?.driver;
  const isOnline = driver?.is_online === true;
  const gate = deriveOnlineGate({ vehicles: vehicleData?.vehicles, kyc });
  const blockReason = gateToKycBlockReason(gate.status);
  const needsVehicle = gate.status === 'no_vehicle' || gate.status === 'no_active_vehicle';

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Full-bleed map behind everything. */}
      <View className="absolute inset-0">
        <HomeMap coords={coords} />
      </View>

      {/* Floating chip, top-left. pt-14 clears the status bar without pulling in a
          SafeAreaProvider this app does not currently use. */}
      <View className="absolute left-5 right-5 top-14 flex-row">
        <ProfileChip
          firstName={driver?.first_name ?? ''}
          lastName={driver?.last_name ?? ''}
          plate={gate.activeVehicle?.plate_number ?? null}
          isOnline={isOnline}
          hasAlert={!gate.canGoOnline}
          onPress={() => router.push('/menu')}
          testID="home-profile-chip"
        />
      </View>

      {/* Anchored bottom sheet. */}
      <View className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-white px-5 pb-5 pt-4">
        <StatCards />

        {/* Preserved from Phase 01.1 — CONTEXT.md: "Keep it." D03's banner is the
            detailed explanation; this card is the quick glance. */}
        <Card onPress={() => router.push('/verify')} className="mt-4" testID="home-kyc-card">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-jakarta-bold text-neutral-900">Verification</Text>
            {kyc && (
              <Badge
                label={KYC_STATUS_BADGE[kyc.kyc_status].label}
                variant={KYC_STATUS_BADGE[kyc.kyc_status].variant}
              />
            )}
          </View>
          <Text className="mt-1 text-[13px] font-jakarta text-neutral-600">
            {kyc?.kyc_status === 'approved'
              ? 'Your identity documents are approved.'
              : 'Upload your identity and vehicle documents to get approved.'}
          </Text>
        </Card>

        {isOnline ? (
          <View className="mt-4">
            <Button
              label="Go offline"
              variant="destructive-outline"
              shape="pill"
              size="large"
              loading={setOnline.isPending}
              onPress={() => setOnline.mutate(false)}
              testID="home-go-offline"
            />
          </View>
        ) : (
          <>
            {blockReason && (
              <View className="mt-4">
                <KycBlockedBanner reason={blockReason} onPressAction={() => router.push('/verify')} />
              </View>
            )}

            {needsVehicle && (
              <View className="mt-4 flex-row items-start gap-3 rounded-control bg-warning-50 px-3 py-3">
                <AlertTriangle size={18} strokeWidth={2} color="#92400E" />
                <View className="flex-1">
                  <Text className="text-[14px] font-jakarta-bold text-warning-700">
                    No active vehicle
                  </Text>
                  <Text className="mt-0.5 text-[13px] font-jakarta-semibold text-warning-700/90">
                    Activate a vehicle before you can go online.
                  </Text>
                </View>
              </View>
            )}

            {needsVehicle && (
              <View className="mt-4">
                <Button
                  label="Go to Vehicles"
                  variant="primary"
                  shape="pill"
                  size="large"
                  onPress={() => router.push('/vehicles')}
                  testID="home-go-to-vehicles"
                />
              </View>
            )}

            <View className="mt-3">
              {gate.canGoOnline ? (
                <Button
                  label="Go online"
                  variant="success"
                  shape="pill"
                  size="large"
                  onPress={() => setSheetVisible(true)}
                  testID="home-go-online"
                />
              ) : needsVehicle ? (
                <Button
                  label="Go online"
                  variant="muted"
                  shape="pill"
                  size="large"
                  onPress={() => router.push('/vehicles')}
                  testID="home-go-online"
                />
              ) : (
                <Button
                  label="Go online"
                  variant="muted"
                  shape="pill"
                  size="large"
                  disabled
                  onPress={() => {}}
                  testID="home-go-online"
                />
              )}
            </View>

            <Text className="mt-3 text-center text-[12px] font-jakarta text-neutral-500">
              Once you&apos;re cleared, Go online asks you to confirm the vehicle first.
            </Text>
          </>
        )}
      </View>

      {gate.activeVehicle && (
        <ConfirmOnlineSheet
          visible={sheetVisible}
          vehicle={gate.activeVehicle}
          approvedDocumentCount={gate.approvedVehicleDocumentCount}
          onDismiss={() => setSheetVisible(false)}
          onWentOnline={() => setSheetVisible(false)}
        />
      )}
    </View>
  );
}
