import { Pressable, Text, View } from 'react-native';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  testID?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  testID,
}: SegmentedControlProps<T>) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-[13px] font-jakarta-bold text-neutral-700">{label}</Text>
      <View
        testID={testID}
        className="flex-row overflow-hidden rounded-control border-[1.5px] border-neutral-300"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              testID={`segment-${option.value}`}
              onPress={() => onChange(option.value)}
              // 44px minimum hit target (UI-SPEC Spacing exceptions).
              className={`min-h-[44px] flex-1 items-center justify-center px-3 ${selected ? 'bg-primary-500' : 'bg-transparent'}`}
            >
              <Text
                className={`text-[15px] font-jakarta-bold ${selected ? 'text-white' : 'text-neutral-600'}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
