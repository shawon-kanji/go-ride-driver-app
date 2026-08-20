import { Pressable, Text, View } from 'react-native';

type Variant = 'error' | 'warning' | 'info' | 'success';

const VARIANT_CLASSES: Record<Variant, string> = {
  error: 'bg-danger-50 border-danger-500',
  warning: 'bg-warning-50 border-warning-500',
  info: 'bg-primary-50 border-primary-500',
  success: 'bg-success-50 border-success-500',
};

const VARIANT_TEXT_CLASSES: Record<Variant, string> = {
  error: 'text-danger-700',
  warning: 'text-warning-700',
  info: 'text-primary-700',
  success: 'text-success-700',
};

interface BannerProps {
  message: string;
  variant?: Variant;
  onDismiss?: () => void;
}

export function Banner({ message, variant = 'info', onDismiss }: BannerProps) {
  return (
    <View
      className={`mb-4 flex-row items-center justify-between rounded-control border px-3 py-3 ${VARIANT_CLASSES[variant]}`}
    >
      <Text className={`flex-1 text-[14px] font-jakarta-semibold ${VARIANT_TEXT_CLASSES[variant]}`}>
        {message}
      </Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8} className="ml-3">
          <Text className={`text-[14px] font-jakarta-bold ${VARIANT_TEXT_CLASSES[variant]}`}>
            ✕
          </Text>
        </Pressable>
      )}
    </View>
  );
}
