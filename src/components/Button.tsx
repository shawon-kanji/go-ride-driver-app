import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Shape = 'rect' | 'pill';
type Size = 'compact' | 'default' | 'large';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-secondary-500 active:bg-secondary-600',
  destructive: 'bg-danger-500 active:bg-danger-600',
  ghost: 'bg-transparent border border-neutral-300 active:bg-neutral-100',
};

const VARIANT_TEXT_CLASSES: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  destructive: 'text-white',
  ghost: 'text-neutral-800',
};

const SHAPE_CLASSES: Record<Shape, string> = {
  rect: 'rounded-control',
  pill: 'rounded-pill',
};

// Heights from the design handoff: utility pills 34-38px, standard form CTAs 48-54px,
// primary confirmation CTAs 54-60px. Every hit target stays >= 44px except the
// deliberately compact utility pill, which the handoff shows at 34-38px.
const SIZE_CLASSES: Record<Size, string> = {
  compact: 'min-h-[36px] px-4 py-2',
  default: 'min-h-[48px] px-4 py-3',
  large: 'min-h-[54px] px-5 py-3',
};

const SIZE_TEXT_CLASSES: Record<Size, string> = {
  compact: 'text-[13px]',
  default: 'text-[15px]',
  large: 'text-[17px]',
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  shape?: Shape;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  shape = 'rect',
  size = 'default',
  loading = false,
  disabled = false,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      className={`flex-row items-center justify-center ${SHAPE_CLASSES[shape]} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${isDisabled ? 'opacity-50' : ''}`}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? '#1F2937' : '#FFFFFF'}
          className="mr-2"
          testID={testID ? `${testID}-spinner` : undefined}
        />
      )}
      <Text
        className={`font-jakarta-bold ${SIZE_TEXT_CLASSES[size]} ${VARIANT_TEXT_CLASSES[variant]}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
