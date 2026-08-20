import { Check, X } from 'lucide-react-native';
import { View } from 'react-native';

import type { DocumentRowState } from '../verification-summary';

export type { DocumentRowState } from '../verification-summary';

const DISC_CLASSES: Record<DocumentRowState, string> = {
  approved: 'bg-success-500',
  in_review: 'bg-warning-500',
  rejected: 'bg-danger-500',
  // Missing is an OUTLINE, not a fill — UI-SPEC is explicit that missing uses a
  // dashed neutral-300 ring, never amber. Amber means "in review".
  missing: 'border-2 border-dashed border-neutral-300',
};

export function StatusDisc({ state, testID }: { state: DocumentRowState; testID?: string }) {
  return (
    <View
      testID={testID ?? `status-disc-${state}`}
      className={`h-[26px] w-[26px] items-center justify-center rounded-pill ${DISC_CLASSES[state]}`}
    >
      {state === 'approved' && <Check size={14} strokeWidth={3} color="#FFFFFF" />}
      {state === 'rejected' && <X size={14} strokeWidth={3} color="#FFFFFF" />}
      {state === 'in_review' && <View className="h-[8px] w-[8px] rounded-pill bg-white" />}
    </View>
  );
}
