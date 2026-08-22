import { useEffect } from 'react';

import { useProfileQuery } from '../profile/api';
import { useSessionStore } from '../../stores/session-store';
import { startLocationBroadcast, stopLocationBroadcast } from './location-broadcaster';

/** Owns the broadcaster's lifecycle for the whole authenticated app.
 *
 *  Mounted once, in src/app/(app)/_layout.tsx — deliberately NOT in a screen.
 *  ARCHITECTURE.md Anti-Pattern 1 / RESEARCH.md Pattern 1: a watcher started in
 *  HomeScreen's useEffect dies the moment the driver opens the Menu, and
 *  trip-dispatch-worker then treats them as stale after
 *  DRIVER_LOCATION_FRESH_WINDOW_SECONDS.
 *
 *  The source of truth is the SERVER's Driver.is_online, not local UI state, so a
 *  driver who was already online when the app cold-starts resumes broadcasting
 *  without any user action. startLocationBroadcast() self-guards on permission, so
 *  resuming without a granted permission is a safe no-op rather than a crash. */
export function useLocationBroadcastLifecycle(): void {
  const { data } = useProfileQuery();
  const isOnline = data?.driver.is_online;

  // A session restored via hydrate() (any relaunch after the initial login) never
  // repopulates session-store's `driver` — only setSession() at login does. The
  // broadcaster reads driver.id from there, so without this it silently no-ops on
  // every fix for the rest of the session. The profile query is the one thing here
  // guaranteed to have a fresh driver, so mirror it in on every load.
  useEffect(() => {
    if (!data?.driver) return;
    const { id, email, first_name, last_name } = data.driver;
    useSessionStore.setState({ driver: { id, email, first_name, last_name } });
  }, [data?.driver]);

  useEffect(() => {
    if (isOnline === undefined) return; // profile still loading — decide nothing yet
    if (isOnline) {
      void startLocationBroadcast();
    } else {
      stopLocationBroadcast();
    }
  }, [isOnline]);

  // Separate effect with an empty dep array: unmounting the authenticated group
  // (logout, session expiry) must always tear the watcher down, regardless of what
  // the last observed is_online value was.
  useEffect(() => () => stopLocationBroadcast(), []);
}
