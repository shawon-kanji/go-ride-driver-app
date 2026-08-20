import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Badge } from '../../../components/Badge';
import { Banner } from '../../../components/Banner';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { useKycStatusQuery, useUploadDocumentMutation } from '../../../features/kyc/api';
import { ReuploadConfirmDialog } from '../../../features/kyc/components/ReuploadConfirmDialog';
import {
  captureFromCamera,
  pickFromLibrary,
  type CaptureResult,
} from '../../../features/kyc/document-capture';
import {
  DOCUMENT_TYPE_LABELS,
  isDocumentType,
  isVehicleDocumentType,
} from '../../../features/kyc/schemas';
import type { DocumentStatus } from '../../../api/types';

const STATUS_BADGE: Record<DocumentStatus, { label: string; variant: 'active' | 'pending' | 'blocked' }> = {
  uploaded: { label: 'In review', variant: 'pending' },
  approved: { label: 'Approved', variant: 'active' },
  rejected: { label: 'Rejected', variant: 'blocked' },
};

interface PendingCapture {
  uri: string;
  contentType: string;
}

export default function DocumentCaptureScreen() {
  const { documentType, vehicleId } = useLocalSearchParams<{
    documentType: string;
    vehicleId?: string;
  }>();
  const { data, isLoading } = useKycStatusQuery();
  const uploadMutation = useUploadDocumentMutation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isDocumentType(documentType)) {
    return (
      <EmptyState
        title="Unknown document"
        message="This document type isn't recognised."
        ctaLabel="Back"
        onPressCta={() => router.back()}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const current = data.documents.find(
    (d) =>
      d.document_type === documentType &&
      (isVehicleDocumentType(documentType) ? d.vehicle_id === vehicleId : d.vehicle_id === undefined),
  );

  const badge = current
    ? STATUS_BADGE[current.status]
    : { label: 'Not uploaded', variant: 'inactive' as const };

  const startUpload = (fileUri: string, contentType: string) => {
    uploadMutation.mutate(
      { documentType, vehicleId, fileUri, contentType },
      {
        onSuccess: () => router.back(),
        onError: (error) =>
          setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.'),
      },
    );
  };

  const handleCapture = async (pick: () => Promise<CaptureResult>) => {
    const result = await pick();

    if (result.status === 'permission-denied') {
      setErrorMessage(
        'GoRide Driver needs permission to use your camera or photos. Enable it in Settings and try again.',
      );
      return;
    }
    if (result.status === 'canceled') return;

    if (current?.status === 'approved') {
      setPendingCapture({ uri: result.uri, contentType: result.contentType });
      setConfirmVisible(true);
      return;
    }

    startUpload(result.uri, result.contentType);
  };

  return (
    <View className="flex-1 px-6 py-6">
      {errorMessage && (
        <Banner message={errorMessage} variant="error" onDismiss={() => setErrorMessage(null)} />
      )}

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-neutral-900">
          {DOCUMENT_TYPE_LABELS[documentType]}
        </Text>
        <Badge label={badge.label} variant={badge.variant} />
      </View>

      {current?.status === 'rejected' && (
        <Banner variant="error" message={current.rejection_reason ?? 'No reason provided'} />
      )}

      <View className="mb-3">
        <Button
          label="Take photo"
          onPress={() => handleCapture(captureFromCamera)}
          loading={uploadMutation.isPending}
        />
      </View>
      <Button
        label="Choose from gallery"
        variant="ghost"
        onPress={() => handleCapture(pickFromLibrary)}
        disabled={uploadMutation.isPending}
      />

      <ReuploadConfirmDialog
        visible={confirmVisible}
        documentType={documentType}
        loading={uploadMutation.isPending}
        onConfirm={() => {
          setConfirmVisible(false);
          if (pendingCapture) startUpload(pendingCapture.uri, pendingCapture.contentType);
        }}
        onCancel={() => {
          setConfirmVisible(false);
          setPendingCapture(null);
        }}
      />
    </View>
  );
}
