import type { DocumentResponse, DocumentType, KycStatusResponse } from '../api/types';

export const TEST_VEHICLE_ID = '11111111-1111-4111-8111-111111111111';

export function makeDocument(
  documentType: DocumentType,
  overrides: Partial<DocumentResponse> = {},
): DocumentResponse {
  return {
    id: `doc-${documentType}`,
    document_type: documentType,
    status: 'uploaded',
    ...overrides,
  };
}

export function makeKycStatus(overrides: Partial<KycStatusResponse> = {}): KycStatusResponse {
  return { kyc_status: 'not_started', documents: [], ...overrides };
}
