import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';

interface MenuRowProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: { label: string; tone: 'danger' | 'success' };
  /** Omit to render the greyed, non-interactive "coming soon" treatment.
   *  UI-SPEC picks greyed-and-inert over a tappable placeholder deliberately:
   *  none of Earnings / Trip history / Settings has real data until Phases 5-6,
   *  so a tap-through would be a dead end. The row still renders — the menu must
   *  read complete. */
  onPress?: () => void;
  testID?: string;
}

export function MenuRow({ icon, title, subtitle, badge, onPress, testID }: MenuRowProps) {
  const disabled = !onPress;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      // Rows are direct children of SectionCard, which owns the radius and outer
      // border — this component contributes only the inter-row hairline.
      className={`min-h-[56px] flex-row items-center gap-[10px] border-t border-neutral-200 px-4 py-3 ${disabled ? 'opacity-45' : 'active:bg-neutral-50'}`}
    >
      <View className="h-[38px] w-[38px] items-center justify-center rounded-control bg-neutral-100">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-jakarta-bold text-neutral-900">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[13px] font-jakarta text-neutral-500">{subtitle}</Text>
        ) : null}
      </View>
      {badge ? (
        <Badge label={badge.label} variant={badge.tone === 'danger' ? 'blocked' : 'active'} />
      ) : null}
      {!disabled && <ChevronRight size={20} strokeWidth={2} color="#9CA3AF" />}
    </Pressable>
  );
}
