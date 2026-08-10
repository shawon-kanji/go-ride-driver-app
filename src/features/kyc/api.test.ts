jest.mock('../../api/kyc-client', () => ({
  kycClient: { requestUploadUrl: jest.fn(), confirmUpload: jest.fn(), getStatus: jest.fn() },
}));
jest.mock('../../api/kyc-upload', () => ({ putDocumentBytes: jest.fn() }));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { kycClient } from '../../api/kyc-client';
import { putDocumentBytes } from '../../api/kyc-upload';
import { TEST_VEHICLE_ID } from '../../test-utils/kyc-fixtures';
import { createQueryWrapper, createTestQueryClient } from '../../test-utils/query-wrapper';
import { useUploadDocumentMutation } from './api';

const mockRequestUploadUrl = kycClient.requestUploadUrl as jest.Mock;
const mockConfirmUpload = kycClient.confirmUpload as jest.Mock;
const mockPutDocumentBytes = putDocumentBytes as jest.Mock;

let calls: string[];

beforeEach(() => {
  calls = [];
  mockRequestUploadUrl.mockReset();
  mockConfirmUpload.mockReset();
  mockPutDocumentBytes.mockReset();

  mockRequestUploadUrl.mockImplementation(async () => {
    calls.push('upload-url');
    return { upload_url: 'https://s3.example/put', key: 'documents/some-key.jpg' };
  });
  mockPutDocumentBytes.mockImplementation(async () => {
    calls.push('put');
  });
  mockConfirmUpload.mockImplementation(async () => {
    calls.push('confirm');
    return { document: { id: 'doc-1', document_type: 'selfie', status: 'uploaded' } };
  });
});

describe('useUploadDocumentMutation', () => {
  describe('identity documents', () => {
    it('omits vehicle_id entirely from the upload-url and confirm payloads', async () => {
      const client = createTestQueryClient();
      const { result } = renderHook(() => useUploadDocumentMutation(), {
        wrapper: createQueryWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({
          documentType: 'selfie',
          fileUri: 'file:///tmp/selfie.jpg',
          contentType: 'image/jpeg',
        });
      });

      const uploadUrlPayload = mockRequestUploadUrl.mock.calls[0][0];
      const confirmPayload = mockConfirmUpload.mock.calls[0][0];
      expect('vehicle_id' in uploadUrlPayload).toBe(false);
      expect('vehicle_id' in confirmPayload).toBe(false);
    });
  });

  describe('upload sequence', () => {
    it('calls upload-url, then the raw PUT, then confirm, in that order', async () => {
      const client = createTestQueryClient();
      const { result } = renderHook(() => useUploadDocumentMutation(), {
        wrapper: createQueryWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({
          documentType: 'selfie',
          fileUri: 'file:///tmp/selfie.jpg',
          contentType: 'image/jpeg',
        });
      });

      expect(calls).toEqual(['upload-url', 'put', 'confirm']);
    });

    it('invalidates the kyc status query after a successful upload', async () => {
      const client = createTestQueryClient();
      const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
      const { result } = renderHook(() => useUploadDocumentMutation(), {
        wrapper: createQueryWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({
          documentType: 'selfie',
          fileUri: 'file:///tmp/selfie.jpg',
          contentType: 'image/jpeg',
        });
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['kyc'] });
      });
    });
  });

  describe('vehicle-scoped documents', () => {
    it('includes vehicle_id in the upload-url and confirm payloads', async () => {
      const client = createTestQueryClient();
      const { result } = renderHook(() => useUploadDocumentMutation(), {
        wrapper: createQueryWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({
          documentType: 'vehicle_registration',
          vehicleId: TEST_VEHICLE_ID,
          fileUri: 'file:///tmp/reg.jpg',
          contentType: 'image/jpeg',
        });
      });

      const uploadUrlPayload = mockRequestUploadUrl.mock.calls[0][0];
      const confirmPayload = mockConfirmUpload.mock.calls[0][0];
      expect(uploadUrlPayload.vehicle_id).toBe(TEST_VEHICLE_ID);
      expect(confirmPayload.vehicle_id).toBe(TEST_VEHICLE_ID);
    });

    it('throws before any network call when vehicle_id is missing', async () => {
      const client = createTestQueryClient();
      const { result } = renderHook(() => useUploadDocumentMutation(), {
        wrapper: createQueryWrapper(client),
      });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            documentType: 'vehicle_registration',
            fileUri: 'file:///tmp/reg.jpg',
            contentType: 'image/jpeg',
          }),
        ).rejects.toThrow();
      });

      expect(mockRequestUploadUrl).toHaveBeenCalledTimes(0);
      expect(mockPutDocumentBytes).toHaveBeenCalledTimes(0);
    });
  });
});
