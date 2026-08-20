import * as Location from 'expo-location';

/** 'services_off' is device-wide location being disabled — distinct from an app
 *  permission denial and worth its own copy (UI-SPEC Copywriting Contract). */
export type LocationReadiness = 'granted' | 'denied' | 'services_off';

/** Read-only probe. Never shows an OS dialog, so it is safe to call on mount —
 *  D06 uses it to decide whether it may seed the map with a one-shot fix. */
export async function getForegroundLocationStatus(): Promise<LocationReadiness> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) return 'services_off';
  const current = await Location.getForegroundPermissionsAsync();
  return current.status === Location.PermissionStatus.GRANTED ? 'granted' : 'denied';
}

/** Requests permission if it is not already granted.
 *  LOCKED SEQUENCING (Screen Flow Spec §3, UI-SPEC Interaction Contract): this is
 *  called ONLY from D07's "Go online" press handler. Never on app launch, never on
 *  D06 mount — an unexplained cold-start dialog is the single biggest driver of
 *  reflexive denial (PITFALLS.md UX table). */
export async function ensureForegroundLocation(): Promise<LocationReadiness> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) return 'services_off';

  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === Location.PermissionStatus.GRANTED) return 'granted';

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === Location.PermissionStatus.GRANTED ? 'granted' : 'denied';
}
