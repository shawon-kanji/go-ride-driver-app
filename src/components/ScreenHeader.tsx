import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  /** Defaults to router.back(). Pass null for a header with no back affordance. */
  onBack?: (() => void) | null;
  right?: ReactNode;
  testID?: string;
}

export function ScreenHeader({ title, onBack, right, testID }: ScreenHeaderProps) {
  const showBack = onBack !== null;
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      testID={testID}
      // 20px screen gutter (UI-SPEC Spacing: D03/D04/D05 headers), white bg with a
      // neutral-200 hairline underneath — the design's only header treatment.
      className="flex-row items-center border-b border-neutral-200 bg-white px-5 py-3"
    >
      {showBack && (
        <Pressable
          testID="screen-header-back"
          onPress={handleBack}
          hitSlop={8}
          // 44x44 minimum hit target applies to icon-only controls too (UI-SPEC
          // Spacing exceptions). -ml-2 keeps the glyph optically on the gutter.
          className="-ml-2 h-11 w-11 items-center justify-center"
        >
          <ChevronLeft size={24} strokeWidth={2} color="#111827" />
        </Pressable>
      )}
      <Text className="flex-1 text-[17px] font-jakarta-extrabold text-neutral-900">{title}</Text>
      {right ? <View className="ml-3">{right}</View> : null}
    </View>
  );
}
