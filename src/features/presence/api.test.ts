jest.mock('../../api/driver-client', () => ({ driverClient: { setOnlineStatus: jest.fn() } }));
jest.mock('../../api/driver-trips-client', () => ({
  driverTripsClient: { getEarnings: jest.fn(), getOnlineTime: jest.fn() },
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { driverClient } from '../../api/driver-client';
import { driverTripsClient } from '../../api/driver-trips-client';
import { ApiError } from '../../api/http-client';
import { createQueryWrapper, createTestQueryClient } from '../../test-utils/query-wrapper';
import { kycBlockReason } from '../kyc/kyc-errors';
import {
  useSetOnlineStatusMutation,
  useTodayEarningsQuery,
  useTodayOnlineTimeQuery,
} from './api';

const mockSetOnlineStatus = driverClient.setOnlineStatus as jest.Mock;
const mockGetEarnings = driverTripsClient.getEarnings as jest.Mock;
const mockGetOnlineTime = driverTripsClient.getOnlineTime as jest.Mock;

beforeEach(() => {
  mockSetOnlineStatus.mockReset();
  mockGetEarnings.mockReset();
  mockGetOnlineTime.mockReset();
});

describe('useSetOnlineStatusMutation', () => {
  it('calls driverClient.setOnlineStatus with exactly true', async () => {
    mockSetOnlineStatus.mockResolvedValue({ driver: { is_online: true } });
    const client = createTestQueryClient();
    const { result } = await renderHook(() => useSetOnlineStatusMutation(), {
      wrapper: createQueryWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync(true);
    });

    expect(mockSetOnlineStatus).toHaveBeenCalledWith(true);
  });

  it('calls driverClient.setOnlineStatus with exactly false', async () => {
    mockSetOnlineStatus.mockResolvedValue({ driver: { is_online: false } });
    const client = createTestQueryClient();
    const { result } = await renderHook(() => useSetOnlineStatusMutation(), {
      wrapper: createQueryWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync(false);
    });

    expect(mockSetOnlineStatus).toHaveBeenCalledWith(false);
  });

  it("invalidates the ['profile'] query key on success", async () => {
    mockSetOnlineStatus.mockResolvedValue({ driver: { is_online: true } });
    const client = createTestQueryClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => useSetOnlineStatusMutation(), {
      wrapper: createQueryWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync(true);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile'] });
    });
  });

  it('exposes a KYC_NOT_APPROVED rejection as an identity block reason', async () => {
    const error = new ApiError(403, { code: 'KYC_NOT_APPROVED', message: 'not approved' });
    mockSetOnlineStatus.mockRejectedValue(error);
    const client = createTestQueryClient();
    const { result } = await renderHook(() => useSetOnlineStatusMutation(), {
      wrapper: createQueryWrapper(client),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(true)).rejects.toThrow();
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(kycBlockReason(result.current.error)).toBe('identity');
  });

  it('exposes a VEHICLE_NOT_VERIFIED rejection as a vehicle block reason', async () => {
    const error = new ApiError(403, { code: 'VEHICLE_NOT_VERIFIED', message: 'not verified' });
    mockSetOnlineStatus.mockRejectedValue(error);
    const client = createTestQueryClient();
    const { result } = await renderHook(() => useSetOnlineStatusMutation(), {
      wrapper: createQueryWrapper(client),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(true)).rejects.toThrow();
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(kycBlockReason(result.current.error)).toBe('vehicle');
  });

  it('still rejects on a non-KYC failure, with kycBlockReason returning null', async () => {
    const error = new ApiError(500, { code: 'INTERNAL_ERROR', message: 'boom' });
    mockSetOnlineStatus.mockRejectedValue(error);
    const client = createTestQueryClient();
    const { result } = await renderHook(() => useSetOnlineStatusMutation(), {
      wrapper: createQueryWrapper(client),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(true)).rejects.toThrow();
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(kycBlockReason(result.current.error)).toBeNull();
  });
});

describe('useTodayEarningsQuery', () => {
  it("calls driverTripsClient.getEarnings('today') and exposes the response", async () => {
    const response = { period: 'today', total_earnings: 42, trip_count: 3 };
    mockGetEarnings.mockResolvedValue(response);
    const client = createTestQueryClient();
    const { result } = await renderHook(() => useTodayEarningsQuery(), {
      wrapper: createQueryWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetEarnings).toHaveBeenCalledWith('today');
    expect(result.current.data).toEqual(response);
  });
});

describe('useTodayOnlineTimeQuery', () => {
  it("calls driverTripsClient.getOnlineTime('today') and exposes the response", async () => {
    const response = { period: 'today', total_minutes: 120 };
    mockGetOnlineTime.mockResolvedValue(response);
    const client = createTestQueryClient();
    const { result } = await renderHook(() => useTodayOnlineTimeQuery(), {
      wrapper: createQueryWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetOnlineTime).toHaveBeenCalledWith('today');
    expect(result.current.data).toEqual(response);
  });
});
