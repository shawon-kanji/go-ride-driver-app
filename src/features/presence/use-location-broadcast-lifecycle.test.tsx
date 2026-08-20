import { renderHook } from '@testing-library/react-native';

jest.mock('./location-broadcaster', () => ({
  startLocationBroadcast: jest.fn(async () => {}),
  stopLocationBroadcast: jest.fn(),
}));
jest.mock('../profile/api', () => ({ useProfileQuery: jest.fn() }));

import { startLocationBroadcast, stopLocationBroadcast } from './location-broadcaster';
import { useProfileQuery } from '../profile/api';
import { useLocationBroadcastLifecycle } from './use-location-broadcast-lifecycle';

function mockProfile(isOnline: boolean | undefined) {
  (useProfileQuery as jest.Mock).mockReturnValue({
    data: isOnline === undefined ? undefined : { driver: { is_online: isOnline } },
  });
}

describe('useLocationBroadcastLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not start when is_online is false on first render', async () => {
    mockProfile(false);

    await renderHook(() => useLocationBroadcastLifecycle());

    expect(startLocationBroadcast).not.toHaveBeenCalled();
  });

  it('starts exactly once when is_online is true on first render', async () => {
    mockProfile(true);

    await renderHook(() => useLocationBroadcastLifecycle());

    expect(startLocationBroadcast).toHaveBeenCalledTimes(1);
  });

  it('starts when the query flips false -> true across a rerender', async () => {
    mockProfile(false);
    const { rerender } = await renderHook(() => useLocationBroadcastLifecycle());

    mockProfile(true);
    await rerender({});

    expect(startLocationBroadcast).toHaveBeenCalledTimes(1);
  });

  it('stops when the query flips true -> false across a rerender', async () => {
    mockProfile(true);
    const { rerender } = await renderHook(() => useLocationBroadcastLifecycle());

    mockProfile(false);
    await rerender({});

    expect(stopLocationBroadcast).toHaveBeenCalledTimes(1);
  });

  it('stops on unmount while online', async () => {
    mockProfile(true);
    const { unmount } = await renderHook(() => useLocationBroadcastLifecycle());

    await unmount();

    expect(stopLocationBroadcast).toHaveBeenCalled();
  });

  it('calls neither start nor stop while the profile query is still loading', async () => {
    mockProfile(undefined);

    await renderHook(() => useLocationBroadcastLifecycle());

    expect(startLocationBroadcast).not.toHaveBeenCalled();
    expect(stopLocationBroadcast).not.toHaveBeenCalled();
  });
});
