import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  /** Renders a 13px/600 danger-600 message under the field. */
  errorText?: string;
  /** Renders a trailing eye / eye-off toggle that flips secureTextEntry. */
  revealToggle?: boolean;
  testID?: string;
}

export function TextInput({
  label,
  errorText,
  revealToggle = false,
  secureTextEntry,
  testID,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecure = secureTextEntry === true && !revealed;

  // Focus border is a real 2px indigo ring per UI-SPEC D01; the resting border is
  // 1.5px neutral-300. Both widths are explicit so the field does not shift by
  // half a pixel when focus changes.
  const borderClass = focused
    ? 'border-[2px] border-primary-500'
    : errorText
      ? 'border-[1.5px] border-danger-500'
      : 'border-[1.5px] border-neutral-300';

  return (
    <View className="mb-4">
      <Text className="mb-1 text-[13px] font-jakarta-bold text-neutral-700">{label}</Text>
      <View className="relative justify-center">
        <RNTextInput
          testID={testID}
          className={`min-h-[52px] rounded-control ${borderClass} px-3 py-3 ${revealToggle ? 'pr-12' : ''} text-[15px] font-jakarta-medium text-neutral-900`}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {revealToggle && (
          <Pressable
            testID="text-input-reveal"
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            className="absolute right-0 h-11 w-11 items-center justify-center"
          >
            {revealed ? (
              <EyeOff size={20} strokeWidth={2} color="#6B7280" />
            ) : (
              <Eye size={20} strokeWidth={2} color="#6B7280" />
            )}
          </Pressable>
        )}
      </View>
      {errorText ? (
        <Text className="mt-1 text-[13px] font-jakarta-semibold text-danger-600">{errorText}</Text>
      ) : null}
    </View>
  );
}
