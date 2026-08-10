import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { kycClient } from '../../api/kyc-client';
import { putDocumentBytes } from '../../api/kyc-upload';
import type { ConfirmUploadPayload, DocumentType, RequestUploadUrlPayload } from '../../api/types';
import { isVehicleDocumentType } from './schemas';

export const kycKeys = {
  all: ['kyc'] as const,
  status: () => [...kycKeys.all, 'status'] as const,
};

export function useKycStatusQuery() {
  return useQuery({ queryKey: kycKeys.status(), queryFn: kycClient.getStatus });
}

export interface UploadDocumentInput {
  documentType: DocumentType;
  /** Required for vehicle-scoped types, must be omitted for identity types. */
  vehicleId?: string;
  fileUri: string;
  /** Computed ONCE by document-capture.resolveContentType and reused for both
   *  the /upload-url content_type and the PUT header — see research Pitfall 1. */
  contentType: string;
}

/**
 * Sequences the backend's three-step upload as one mutation:
 *   POST /kyc/documents/upload-url -> raw PUT to storage -> POST /kyc/documents/confirm
 * The UI never juggles three loading states.
 */
export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentType, vehicleId, fileUri, contentType }: UploadDocumentInput) => {
      const needsVehicle = isVehicleDocumentType(documentType);
      if (needsVehicle && !vehicleId) {
        // Fail fast, before any network call — the backend rejects this too,
        // but a round trip to learn it is wasted on a known-invalid request.
        throw new Error('A vehicle must be selected before uploading this document.');
      }

      // vehicle_id must be ABSENT (not an empty string, not present-but-undefined)
      // for identity types — go-ride-backend/application/kyc/validation.go rejects
      // a present-but-empty vehicle_id exactly like a wrong one.
      const scope = needsVehicle ? { vehicle_id: vehicleId } : {};

      const uploadUrlPayload: RequestUploadUrlPayload = {
        document_type: documentType,
        content_type: contentType,
        ...scope,
      };
      const { upload_url, key } = await kycClient.requestUploadUrl(uploadUrlPayload);

      await putDocumentBytes(upload_url, fileUri, contentType);

      const confirmPayload: ConfirmUploadPayload = {
        document_type: documentType,
        key,
        ...scope,
      };
      const { document } = await kycClient.confirmUpload(confirmPayload);
      return document;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kycKeys.all }),
  });
}
