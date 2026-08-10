import { apiRequest } from './http-client';
import type {
  ConfirmUploadPayload,
  DocumentResponse,
  KycStatusResponse,
  RequestUploadUrlPayload,
  RequestUploadUrlResponse,
} from './types';

// Mirrors go-ride-backend/interfaces/http/routes/kyc_routes.go. Response envelopes
// are NOT uniform here: upload-url and status return bare objects, confirm returns
// {document: ...} — verified against interfaces/http/handlers/kyc_handler.go.
export const kycClient = {
  requestUploadUrl: (payload: RequestUploadUrlPayload) =>
    apiRequest<RequestUploadUrlResponse>('/driver/kyc/documents/upload-url', {
      method: 'POST',
      body: payload,
    }),

  confirmUpload: (payload: ConfirmUploadPayload) =>
    apiRequest<{ document: DocumentResponse }>('/driver/kyc/documents/confirm', {
      method: 'POST',
      body: payload,
    }),

  getStatus: () => apiRequest<KycStatusResponse>('/driver/kyc/status'),
};
