import { ApiError } from '../../api/http-client';

import { kycBlockReason } from './kyc-errors';

describe('kycBlockReason', () => {
  it('maps KYC_NOT_APPROVED to identity', () => {
    const error = new ApiError(403, { code: 'KYC_NOT_APPROVED', message: 'kyc not approved' });
    expect(kycBlockReason(error)).toBe('identity');
  });

  it('maps VEHICLE_NOT_VERIFIED to vehicle', () => {
    const error = new ApiError(403, {
      code: 'VEHICLE_NOT_VERIFIED',
      message: 'vehicle not verified',
    });
    expect(kycBlockReason(error)).toBe('vehicle');
  });

  it('returns null for any other ApiError code', () => {
    const documentForbidden = new ApiError(403, { code: 'DOCUMENT_FORBIDDEN', message: 'x' });
    const validationError = new ApiError(400, { code: 'VALIDATION_ERROR', message: 'x' });
    expect(kycBlockReason(documentForbidden)).toBeNull();
    expect(kycBlockReason(validationError)).toBeNull();
  });

  it('returns null for non-ApiError values', () => {
    expect(kycBlockReason(new Error('boom'))).toBeNull();
    expect(kycBlockReason(null)).toBeNull();
    expect(kycBlockReason(undefined)).toBeNull();
  });
});
