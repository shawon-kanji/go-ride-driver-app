jest.mock('expo-location', () => require('../../test-utils/expo-mocks').createExpoLocationMock());
jest.mock('../../api/location-client', () => ({ locationClient: { updateLocation: jest.fn() } }));

import * as Location from 'expo-location';

import { locationClient } from '../../api/location-client';
import { makeLocationObject } from '../../test-utils/expo-mocks';
import { useSessionStore } from '../../stores/session-store';
import {
  HEARTBEAT_MAX_INTERVAL_MS,
  MIN_DISTANCE_METERS,
  MOVEMENT_MIN_INTERVAL_MS,
  isBroadcasting,
  startLocationBroadcast,
  stopLocationBroadcast,
} from './location-broadcaster';
import { usePresenceStore } from './presence-store';

describe('location-broadcaster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(0);
    // clearAllMocks() only clears calls/instances, not implementations set via
    // mockResolvedValue — re-assert the granted-happy-path defaults every test so
    // a prior test's override (e.g. the denied-permission case) cannot leak.
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (locationClient.updateLocation as jest.Mock).mockResolvedValue({
      accepted: true,
      event_id: 'e',
      published_at: 'p',
    });
    useSessionStore.setState({
      driver: { id: 'driver-uuid', email: 'a@b.c', first_name: 'A', last_name: 'B' },
    });
    usePresenceStore.getState().reset();
  });

  afterEach(() => {
    stopLocationBroadcast();
    jest.useRealTimers();
  });

  function getOnFix(): (fix: unknown) => void {
    return (Location.watchPositionAsync as jest.Mock).mock.calls[0][1];
  }

  it('is idempotent — calling start twice only calls watchPositionAsync once', async () => {
    await startLocationBroadcast();
    await startLocationBroadcast();

    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
  });

  it('does not start when permission is denied', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    await expect(startLocationBroadcast()).resolves.toBeUndefined();

    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    expect(isBroadcasting()).toBe(false);
  });

  it('posts the very first fix immediately', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject());

    expect(locationClient.updateLocation).toHaveBeenCalledTimes(1);
  });

  it('does not post a fix 3s later, 100m away (movement tier throttled to 10s)', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));
    (locationClient.updateLocation as jest.Mock).mockClear();

    jest.setSystemTime(3_000);
    onFix(makeLocationObject({ latitude: 3.14, longitude: 101.6879 }));

    expect(locationClient.updateLocation).not.toHaveBeenCalled();
  });

  it('posts a fix 11s later, 100m away', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));
    (locationClient.updateLocation as jest.Mock).mockClear();

    jest.setSystemTime(11_000);
    onFix(makeLocationObject({ latitude: 3.14, longitude: 101.6879 }));

    expect(locationClient.updateLocation).toHaveBeenCalledTimes(1);
  });

  it('does not post a stationary fix 30s later', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));
    (locationClient.updateLocation as jest.Mock).mockClear();

    jest.setSystemTime(30_000);
    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));

    expect(locationClient.updateLocation).not.toHaveBeenCalled();
  });

  it('posts a stationary fix 61s later (heartbeat tier)', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));
    (locationClient.updateLocation as jest.Mock).mockClear();

    jest.setSystemTime(61_000);
    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));

    expect(locationClient.updateLocation).toHaveBeenCalledTimes(1);
  });

  it('does not post a fix 11s later but only 5m away', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));
    (locationClient.updateLocation as jest.Mock).mockClear();

    jest.setSystemTime(11_000);
    // ~5m north
    onFix(makeLocationObject({ latitude: 3.13904_5, longitude: 101.6869 }));

    expect(locationClient.updateLocation).not.toHaveBeenCalled();
  });

  it('POSTs exactly the expected keys, omitting accuracy_m when accuracy is null', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ accuracy: null }));

    const body = (locationClient.updateLocation as jest.Mock).mock.calls[0][0];
    expect(Object.keys(body).sort()).toEqual(
      ['driver_id', 'event_time', 'latitude', 'longitude', 'source'].sort(),
    );
    expect('accuracy_m' in body).toBe(false);
  });

  it('includes accuracy_m when accuracy is a number', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ accuracy: 12 }));

    const body = (locationClient.updateLocation as jest.Mock).mock.calls[0][0];
    expect(Object.keys(body).sort()).toEqual(
      ['accuracy_m', 'driver_id', 'event_time', 'latitude', 'longitude', 'source'].sort(),
    );
    expect(body.accuracy_m).toBe(12);
  });

  it('sets source foreground normally and foreground_mocked when the mock-provider flag is set', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ mocked: false }));
    expect((locationClient.updateLocation as jest.Mock).mock.calls[0][0].source).toBe('foreground');

    (locationClient.updateLocation as jest.Mock).mockClear();
    jest.setSystemTime(61_000);
    onFix(makeLocationObject({ mocked: true }));
    expect((locationClient.updateLocation as jest.Mock).mock.calls[0][0].source).toBe('foreground_mocked');
  });

  it('does not call updateLocation and does not throw when driver is null', async () => {
    useSessionStore.setState({ driver: null });
    await startLocationBroadcast();
    const onFix = getOnFix();

    expect(() => onFix(makeLocationObject())).not.toThrow();
    expect(locationClient.updateLocation).not.toHaveBeenCalled();
  });

  it('updates presence-store lastCoords on every fix, including ones not POSTed', async () => {
    await startLocationBroadcast();
    const onFix = getOnFix();

    onFix(makeLocationObject({ latitude: 3.139, longitude: 101.6869 }));
    jest.setSystemTime(3_000);
    onFix(makeLocationObject({ latitude: 3.14, longitude: 101.6879 }));

    expect(usePresenceStore.getState().lastCoords).toEqual({ latitude: 3.14, longitude: 101.6879 });
  });

  it('does not throw and does not stop the watcher when updateLocation rejects', async () => {
    (locationClient.updateLocation as jest.Mock).mockRejectedValueOnce(new Error('network'));
    await startLocationBroadcast();
    const onFix = getOnFix();

    expect(() => onFix(makeLocationObject())).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(isBroadcasting()).toBe(true);
  });

  it('stop calls remove(), sets isBroadcasting false, and the stale callback posts nothing', async () => {
    await startLocationBroadcast();
    const subscription = await (Location.watchPositionAsync as jest.Mock).mock.results[0].value;
    const onFix = getOnFix();

    stopLocationBroadcast();

    expect(subscription.remove).toHaveBeenCalledTimes(1);
    expect(isBroadcasting()).toBe(false);
    expect(usePresenceStore.getState().broadcasting).toBe(false);

    onFix(makeLocationObject());
    expect(locationClient.updateLocation).not.toHaveBeenCalled();
  });

  it('resets throttle state after stop then start — next first fix posts immediately', async () => {
    await startLocationBroadcast();
    let onFix = getOnFix();
    onFix(makeLocationObject());
    stopLocationBroadcast();

    (locationClient.updateLocation as jest.Mock).mockClear();
    (Location.watchPositionAsync as jest.Mock).mockClear();

    jest.setSystemTime(5_000);
    await startLocationBroadcast();
    onFix = getOnFix();
    onFix(makeLocationObject());

    expect(locationClient.updateLocation).toHaveBeenCalledTimes(1);
  });

  it('exports the expected tiering constants', () => {
    expect(MOVEMENT_MIN_INTERVAL_MS).toBe(10_000);
    expect(HEARTBEAT_MAX_INTERVAL_MS).toBe(60_000);
    expect(MIN_DISTANCE_METERS).toBe(25);
  });
});
