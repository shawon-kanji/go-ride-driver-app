import { Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
}

export function TextInput({ label, ...inputProps }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-[13px] font-jakarta-bold text-neutral-700">{label}</Text>
      <RNTextInput
        className="min-h-[52px] rounded-control border-[1.5px] border-neutral-300 px-3 py-3 text-[15px] font-jakarta-medium text-neutral-900"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
    </View>
  );
}
