import * as Location from 'expo-location';
import { useEffect } from 'react';

import type { LatLng } from '../../lib/geo';
import { getForegroundLocationStatus } from './permissions';
import { usePresenceStore } from './presence-store';

/** Feeds D06's map.
 *
 *  Two sources, in priority order:
 *   1. The broadcaster's watcher, which writes lastCoords on every fix while the
 *      driver is online. Nothing to do here in that case.
 *   2. A single getCurrentPositionAsync when the store is still empty AND
 *      permission has already been granted from an earlier session — so a driver
 *      who is offline but previously granted access still sees themselves on the
 *      map instead of a blank city view.
 *
 *  Deliberately uses the read-only getForegroundLocationStatus(): D06 must never
 *  raise the OS permission dialog. That belongs to D07's Go online press and
 *  nowhere else (Screen Flow Spec §3, RESEARCH.md Pattern 2). */
export function useHomeCoords(): LatLng | null {
  const lastCoords = usePresenceStore((s) => s.lastCoords);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (usePresenceStore.getState().lastCoords) return; // broadcaster already feeding it
      const readiness = await getForegroundLocationStatus();
      if (readiness !== 'granted' || cancelled) return;
      try {
        const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        usePresenceStore
          .getState()
          .setLastCoords(
            { latitude: fix.coords.latitude, longitude: fix.coords.longitude },
            fix.timestamp,
          );
      } catch {
        // A failed one-shot fix is not an error the driver needs to see — the map
        // simply stays on its fallback region until the broadcaster provides one.
      }
    })();

    return () => {
      cancelled = true;
    };
    // Mount-only: re-running on every lastCoords change would defeat the empty-store guard.
  }, []);

  return lastCoords;
}
