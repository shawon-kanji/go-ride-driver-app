import * as Location from 'expo-location';

import { locationClient } from '../../api/location-client';
import { haversineMeters, type LatLng } from '../../lib/geo';
import { useSessionStore } from '../../stores/session-store';
import { getForegroundLocationStatus } from './permissions';
import { usePresenceStore } from './presence-store';
import type { UpdateLocationPayload } from '../../api/types';

// Tiering derived in RESEARCH.md from trip-dispatch-worker's own constants:
// DRIVER_LOCATION_FRESH_WINDOW_SECONDS=300 (a driver goes stale after 5 min) and
// DISPATCH_SWEEP_INTERVAL_SECONDS=3. A 60s heartbeat keeps a parked driver 5x
// inside the freshness window; a 10s movement floor bounds the request rate for a
// driver on a highway; 25m filters GPS jitter while standing still.
export const MOVEMENT_MIN_INTERVAL_MS = 10_000;
export const HEARTBEAT_MAX_INTERVAL_MS = 60_000;
export const MIN_DISTANCE_METERS = 25;

let subscription: Location.LocationSubscription | null = null;
// -Infinity, not 0: tests (and real cold starts near the Unix epoch on a device
// with a wrong clock) must still treat "nothing sent yet" as due for a heartbeat,
// which a literal 0 would defeat if Date.now() also happened to be 0.
let lastSentAt = -Infinity;
let lastSentCoords: LatLng | null = null;

export function isBroadcasting(): boolean {
  return subscription !== null;
}

export async function startLocationBroadcast(): Promise<void> {
  if (subscription) return; // idempotent — the lifecycle effect may re-run

  // Guard, do not request. The OS dialog is D07's job and only D07's job.
  const readiness = await getForegroundLocationStatus();
  if (readiness !== 'granted') return;

  lastSentAt = -Infinity;
  lastSentCoords = null;

  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      // Android-only hint to the OS provider about how often to hand us a fix.
      // It is deliberately NOT the POST cadence — that is the JS throttle below,
      // so the send rate stays deterministic and unit-testable.
      timeInterval: 4000,
      distanceInterval: MIN_DISTANCE_METERS,
    },
    handleFix,
  );

  usePresenceStore.getState().setBroadcasting(true);
}

export function stopLocationBroadcast(): void {
  subscription?.remove();
  subscription = null;
  lastSentAt = -Infinity;
  lastSentCoords = null;
  usePresenceStore.getState().setBroadcasting(false);
}

function handleFix(fix: Location.LocationObject): void {
  const coords = { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
  const now = Date.now();

  // 1. Always feed the map first — display smoothness is independent of send rate.
  usePresenceStore.getState().setLastCoords(coords, now);

  // 2. Guard: a stale callback after stop() must do nothing.
  if (!subscription) return;

  // 3. Tiering.
  const movedFar =
    lastSentCoords === null || haversineMeters(lastSentCoords, coords) >= MIN_DISTANCE_METERS;
  const throttleOk = now - lastSentAt >= MOVEMENT_MIN_INTERVAL_MS;
  const dueForHeartbeat = now - lastSentAt >= HEARTBEAT_MAX_INTERVAL_MS;
  if (!((movedFar && throttleOk) || dueForHeartbeat)) return;

  // 4. Never crash if the session store has not hydrated.
  const driverId = useSessionStore.getState().driver?.id;
  if (!driverId) return;

  lastSentAt = now;
  lastSentCoords = coords;

  // 5. Build the payload by conditional assignment, NOT by spreading undefined —
  //    location-producers' decoder uses DisallowUnknownFields() and a key present
  //    with a null/undefined value is a 400.
  const payload: UpdateLocationPayload = {
    driver_id: driverId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    event_time: new Date(fix.timestamp).toISOString(),
    // PITFALLS.md Pitfall 10 — client-side mock-provider signal. Server-side
    // validation is a documented backend gap, not this phase's job; flagging it
    // in `source` at least makes mocked pings identifiable downstream.
    source: fix.mocked ? 'foreground_mocked' : 'foreground',
  };
  if (typeof fix.coords.accuracy === 'number') {
    payload.accuracy_m = fix.coords.accuracy;
  }

  // 6. Best-effort. A failed ping must never surface to the driver mid-shift and
  //    must never tear down the watcher.
  void locationClient.updateLocation(payload).catch(() => {});
}
