import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface SectionCardProps {
  eyebrow: string;
  /** Right-aligned meta on the eyebrow row, e.g. "4 of 5 uploaded" (D04). */
  meta?: string;
  children: ReactNode;
  className?: string;
  testID?: string;
}

/** Deliberately not a variant of Card.tsx: Card owns 16px padding on all sides,
 *  while these containers must let their rows run full-bleed to the border so the
 *  row dividers reach the card edge (D03 menu rows, D04 document rows). */
export function SectionCard({ eyebrow, meta, children, className = '', testID }: SectionCardProps) {
  return (
    <View
      testID={testID}
      className={`overflow-hidden rounded-card border border-neutral-200 bg-white ${className}`}
    >
      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Text className="text-[12px] font-jakarta-bold uppercase tracking-[0.08em] text-neutral-500">
          {eyebrow}
        </Text>
        {meta ? (
          <Text className="text-[13px] font-jakarta-bold text-neutral-600">{meta}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
