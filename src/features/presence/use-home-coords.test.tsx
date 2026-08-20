jest.mock('expo-location', () => require('../../test-utils/expo-mocks').createExpoLocationMock());
jest.mock('./permissions', () => ({ getForegroundLocationStatus: jest.fn() }));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { getForegroundLocationStatus } from './permissions';
import { usePresenceStore } from './presence-store';
import { useHomeCoords } from './use-home-coords';

const mockGetForegroundLocationStatus = getForegroundLocationStatus as jest.Mock;
const mockGetCurrentPositionAsync = Location.getCurrentPositionAsync as jest.Mock;
const mockRequestForegroundPermissionsAsync = Location.requestForegroundPermissionsAsync as jest.Mock;

describe('useHomeCoords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePresenceStore.getState().reset();
    mockGetForegroundLocationStatus.mockResolvedValue('granted');
  });

  it('Test 1: granted permission with an empty store seeds lastCoords via one getCurrentPositionAsync call', async () => {
    const { result } = await renderHook(() => useHomeCoords());

    await waitFor(() => {
      expect(usePresenceStore.getState().lastCoords).not.toBeNull();
    });

    expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual(usePresenceStore.getState().lastCoords);
  });

  it('Test 2: denied permission never calls getCurrentPositionAsync and returns null', async () => {
    mockGetForegroundLocationStatus.mockResolvedValue('denied');

    const { result } = await renderHook(() => useHomeCoords());

    await waitFor(() => {
      expect(mockGetForegroundLocationStatus).toHaveBeenCalled();
    });

    expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('Test 3: services_off behaves the same as denied', async () => {
    mockGetForegroundLocationStatus.mockResolvedValue('services_off');

    const { result } = await renderHook(() => useHomeCoords());

    await waitFor(() => {
      expect(mockGetForegroundLocationStatus).toHaveBeenCalled();
    });

    expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('Test 4: store already holds coords (broadcaster running) -> never calls getCurrentPositionAsync, returns existing coords', async () => {
    const existing = { latitude: 1, longitude: 2 };
    usePresenceStore.getState().setLastCoords(existing, 123);

    const { result } = await renderHook(() => useHomeCoords());

    expect(result.current).toEqual(existing);
    expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('Test 5: getCurrentPositionAsync rejecting does not throw and returns null', async () => {
    mockGetCurrentPositionAsync.mockRejectedValue(new Error('nope'));

    const { result } = await renderHook(() => useHomeCoords());

    await waitFor(() => {
      expect(mockGetCurrentPositionAsync).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });

  it('Test 6: requestForegroundPermissionsAsync is never called in any branch', async () => {
    mockGetForegroundLocationStatus.mockResolvedValue('denied');
    await renderHook(() => useHomeCoords());
    await waitFor(() => expect(mockGetForegroundLocationStatus).toHaveBeenCalled());

    mockGetForegroundLocationStatus.mockResolvedValue('granted');
    await renderHook(() => useHomeCoords());
    await waitFor(() => expect(mockGetCurrentPositionAsync).toHaveBeenCalled());

    expect(mockRequestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('Test 7: reactively reflects a later setLastCoords call, not a snapshot', async () => {
    mockGetForegroundLocationStatus.mockResolvedValue('denied');
    const { result } = await renderHook(() => useHomeCoords());
    await waitFor(() => expect(mockGetForegroundLocationStatus).toHaveBeenCalled());

    expect(result.current).toBeNull();

    const fresh = { latitude: 9, longitude: 10 };
    await act(async () => {
      usePresenceStore.getState().setLastCoords(fresh, 456);
    });

    await waitFor(() => {
      expect(result.current).toEqual(fresh);
    });
  });
});
