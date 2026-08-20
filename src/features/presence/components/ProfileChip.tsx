import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

interface ProfileChipProps {
  firstName: string;
  lastName: string;
  /** null renders "No vehicle" in the plate position. */
  plate: string | null;
  isOnline: boolean;
  /** Amber dot, ONLY while verification is outstanding. UI-SPEC is explicit that
   *  a cleared driver has NO dot — there is no "all good" green variant. */
  hasAlert: boolean;
  onPress: () => void;
  testID?: string;
}

export function ProfileChip({
  firstName,
  lastName,
  plate,
  isOnline,
  hasAlert,
  onPress,
  testID,
}: ProfileChipProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className="flex-row items-center gap-[10px] rounded-pill bg-white px-3 py-2 shadow"
    >
      <View className="h-[34px] w-[34px] items-center justify-center rounded-pill bg-primary-50">
        <Text className="text-[13px] font-jakarta-extrabold text-primary-700">{initials}</Text>
      </View>
      <View>
        <Text className="text-[14px] font-jakarta-extrabold text-neutral-900">{firstName}</Text>
        <Text className="text-[12px] font-jakarta text-neutral-500">
          {`${plate ?? 'No vehicle'} · ${isOnline ? 'online' : 'offline'}`}
        </Text>
      </View>
      {hasAlert && (
        <View
          testID="profile-chip-alert"
          className="h-5 w-5 items-center justify-center rounded-pill bg-warning-500"
        >
          <AlertTriangle size={12} strokeWidth={2.4} color="#FFFFFF" />
        </View>
      )}
      <ChevronRight size={18} strokeWidth={2} color="#9CA3AF" />
    </Pressable>
  );
}
