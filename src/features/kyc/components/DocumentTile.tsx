import { Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import type { DocumentResponse, DocumentType } from '../../../api/types';
import { documentRowState } from '../verification-summary';
import { DOCUMENT_TYPE_LABELS } from '../schemas';
import { StatusDisc } from './StatusDisc';

interface DocumentTileProps {
  documentType: DocumentType;
  /** undefined means nothing has been uploaded for this type yet. */
  document?: DocumentResponse;
  onPress: () => void;
}

export function DocumentTile({ documentType, document, onPress }: DocumentTileProps) {
  const state = documentRowState(document);
  const rejected = state === 'rejected';
  const missing = state === 'missing';

  return (
    <Pressable
      testID="document-tile-row"
      onPress={onPress}
      className={`flex-row items-center gap-[10px] border-t border-neutral-200 px-4 py-[14px] ${rejected ? 'bg-danger-50' : 'active:bg-neutral-50'}`}
    >
      <StatusDisc state={state} />
      <View className="flex-1">
        <Text
          className={`text-[15px] font-jakarta-bold ${missing ? 'text-neutral-500' : 'text-neutral-900'}`}
        >
          {DOCUMENT_TYPE_LABELS[documentType]}
        </Text>
        {rejected && (
          <Text className="mt-0.5 text-[13px] font-jakarta text-danger-700">
            {`Rejected — ${document?.rejection_reason ?? 'no reason provided'}`}
          </Text>
        )}
      </View>
      {state === 'approved' && (
        <Text className="text-[13px] font-jakarta-bold text-success-700">Approved</Text>
      )}
      {state === 'in_review' && (
        <Text className="text-[13px] font-jakarta-bold text-warning-700">In review</Text>
      )}
      {state === 'rejected' && (
        <Button
          label="Re-upload"
          variant="destructive"
          shape="pill"
          size="compact"
          onPress={onPress}
          testID="document-reupload"
        />
      )}
      {state === 'missing' && (
        <Button
          label="Upload"
          variant="tonal"
          shape="pill"
          size="compact"
          onPress={onPress}
          testID="document-upload"
        />
      )}
    </Pressable>
  );
}
