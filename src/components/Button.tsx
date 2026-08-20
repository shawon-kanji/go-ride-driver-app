import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'ghost'
  | 'tonal'
  | 'dark'
  | 'muted'
  | 'success'
  | 'destructive-outline';
type Shape = 'rect' | 'pill';
type Size = 'compact' | 'default' | 'large';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-secondary-500 active:bg-secondary-600',
  destructive: 'bg-danger-500 active:bg-danger-600',
  ghost: 'bg-transparent border border-neutral-300 active:bg-neutral-100',
  // UI-SPEC "Explicit non-primary CTA colors" — each of these is a verified,
  // per-button design decision, not a theme default. Do not collapse them into
  // `primary`. There is no primary-100/success-600-tint token in colors.js, so
  // pressed states that have no token use active:opacity-80.
  tonal: 'bg-primary-50 active:opacity-80', // D04 Upload, D05 + Add
  dark: 'bg-neutral-900 active:bg-neutral-800', // D05 Register vehicle
  muted: 'bg-neutral-200', // D06 disabled Go online, D05 unavailable Activate
  success: 'bg-success-500 active:bg-success-600', // D06 + D07 Go online
  'destructive-outline': 'bg-transparent border border-neutral-300 active:bg-danger-50', // D03 Log out
};

const VARIANT_TEXT_CLASSES: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  destructive: 'text-white',
  ghost: 'text-neutral-800',
  tonal: 'text-primary-700',
  dark: 'text-white',
  muted: 'text-neutral-500',
  success: 'text-white',
  'destructive-outline': 'text-danger-600',
};

// Spinner colour must track the variant's TEXT colour, not its fill.
const VARIANT_SPINNER_COLOR: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  destructive: '#FFFFFF',
  ghost: '#1F2937',
  tonal: '#3730A3',
  dark: '#FFFFFF',
  muted: '#6B7280',
  success: '#FFFFFF',
  'destructive-outline': '#B91C1C',
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
          color={VARIANT_SPINNER_COLOR[variant]}
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
