import { ChevronLeft, Car, Clock, Settings, ShieldCheck, TriangleAlert, User, Wallet } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { SectionCard } from '../../components/SectionCard';
import { deriveOnlineGate } from '../../features/presence/gating';
import { useKycStatusQuery } from '../../features/kyc/api';
import { useLogout } from '../../features/profile/logout';
import { useProfileQuery } from '../../features/profile/api';
import { useVehiclesQuery } from '../../features/vehicles/api';
import { IDENTITY_DOCUMENT_TYPES, VEHICLE_DOCUMENT_TYPES } from '../../features/kyc/schemas';
import { describeVerificationBlockers, summariseTrack } from '../../features/kyc/verification-summary';
import { MenuRow } from '../../features/menu/components/MenuRow';

export default function MenuScreen() {
  const { data: profile } = useProfileQuery();
  const { data: vehicleData } = useVehiclesQuery();
  const { data: kyc } = useKycStatusQuery();
  const logout = useLogout();

  const driver = profile?.driver;
  const vehicles = vehicleData?.vehicles;
  const gate = deriveOnlineGate({ vehicles, kyc });

  const identity = summariseTrack(IDENTITY_DOCUMENT_TYPES, kyc?.documents ?? [], undefined);
  const vehicleTrack = gate.activeVehicle
    ? summariseTrack(VEHICLE_DOCUMENT_TYPES, kyc?.documents ?? [], gate.activeVehicle.id)
    : null;
  const blockerSentence = describeVerificationBlockers(identity, vehicleTrack);

  const initials = driver
    ? `${driver.first_name.charAt(0)}${driver.last_name.charAt(0)}`.toUpperCase()
    : '';
  const fullName = driver ? `${driver.first_name} ${driver.last_name}`.trim() : 'Driver';
  const statusLine =
    gate.status === 'ready' ? 'Account active · ready to drive' : 'Account active · not yet cleared to drive';

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="bg-primary-500 px-5 pb-5 pt-[18px]">
        <Pressable
          testID="menu-back"
          onPress={() => router.back()}
          hitSlop={8}
          className="-ml-2 mb-2 h-11 w-11 items-center justify-center"
        >
          <ChevronLeft size={24} strokeWidth={2} color="#FFFFFF" />
        </Pressable>
        <View className="flex-row items-center gap-[10px]">
          <View className="h-[52px] w-[52px] items-center justify-center rounded-pill bg-white/20">
            <Text className="text-[18px] font-jakarta-extrabold text-white">{initials}</Text>
          </View>
          <View>
            <Text className="text-[19px] font-jakarta-extrabold text-white">{fullName}</Text>
            <Text className="mt-0.5 text-[13px] font-jakarta text-white/[0.82]">{statusLine}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-4 gap-4">
        {blockerSentence !== null && (
          <View
            testID="menu-warning-banner"
            className="flex-row items-start gap-3 rounded-control bg-warning-50 px-3 py-3"
          >
            <TriangleAlert size={20} strokeWidth={2} color="#92400E" />
            <Text className="flex-1 text-[14px] font-jakarta-semibold text-warning-700">
              {blockerSentence}
            </Text>
          </View>
        )}

        <SectionCard eyebrow="Get ready to drive">
          <MenuRow
            testID="menu-row-verification"
            icon={<ShieldCheck size={20} strokeWidth={2} color="#4338CA" />}
            title="Verification & documents"
            subtitle={`Identity ${identity.approvedCount} of 5${identity.rejectedCount > 0 ? ` · ${identity.rejectedCount} rejected` : ''}`}
            badge={gate.canGoOnline ? undefined : { label: 'Action needed', tone: 'danger' }}
            onPress={() => router.push('/verify')}
          />
          <MenuRow
            testID="menu-row-vehicles"
            icon={<Car size={20} strokeWidth={2} color="#4338CA" />}
            title="My vehicles"
            subtitle={`${vehicles?.length ?? 0} registered${gate.activeVehicle ? ` · ${gate.activeVehicle.plate_number} active` : ' · none active'}`}
            badge={gate.activeVehicle ? { label: 'Active', tone: 'success' } : undefined}
            onPress={() => router.push('/vehicles')}
          />
          <MenuRow
            testID="menu-row-profile"
            icon={<User size={20} strokeWidth={2} color="#4338CA" />}
            title="Profile"
            subtitle="Name, email, password"
            onPress={() => router.push('/profile')}
          />
        </SectionCard>

        <SectionCard eyebrow="Your work">
          <MenuRow testID="menu-row-earnings" icon={<Wallet size={20} strokeWidth={2} color="#9CA3AF" />} title="Earnings" />
          <MenuRow testID="menu-row-trip-history" icon={<Clock size={20} strokeWidth={2} color="#9CA3AF" />} title="Trip history" />
          <MenuRow testID="menu-row-settings" icon={<Settings size={20} strokeWidth={2} color="#9CA3AF" />} title="Settings" />
        </SectionCard>

        <Button
          label="Log out"
          variant="destructive-outline"
          shape="pill"
          size="large"
          onPress={() => {
            void logout();
          }}
          testID="menu-logout"
        />
      </ScrollView>
    </View>
  );
}
