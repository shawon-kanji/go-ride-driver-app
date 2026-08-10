import { Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { Card } from '../../../components/Card';
import type { DocumentResponse, DocumentStatus, DocumentType } from '../../../api/types';
import { DOCUMENT_TYPE_LABELS } from '../schemas';

const STATUS_BADGE: Record<DocumentStatus, { label: string; variant: 'active' | 'pending' | 'blocked' }> = {
  uploaded: { label: 'In review', variant: 'pending' },
  approved: { label: 'Approved', variant: 'active' },
  rejected: { label: 'Rejected', variant: 'blocked' },
};

interface DocumentTileProps {
  documentType: DocumentType;
  /** undefined means nothing has been uploaded for this type yet. */
  document?: DocumentResponse;
  onPress: () => void;
}

export function DocumentTile({ documentType, document, onPress }: DocumentTileProps) {
  const badge = document
    ? STATUS_BADGE[document.status]
    : { label: 'Not uploaded', variant: 'inactive' as const };

  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-base font-semibold text-neutral-900">
          {DOCUMENT_TYPE_LABELS[documentType]}
        </Text>
        <Badge label={badge.label} variant={badge.variant} />
      </View>

      {!document && <Text className="mt-1 text-sm text-neutral-600">Tap to upload</Text>}

      {document?.status === 'rejected' && (
        <Text className="mt-1 text-sm text-danger-700">
          {document.rejection_reason ?? 'No reason provided'}
        </Text>
      )}
    </Card>
  );
}
