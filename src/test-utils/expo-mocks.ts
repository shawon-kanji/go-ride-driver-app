import type { ReactNode } from 'react';

/** Matches expo-image-picker's ImagePickerAsset fields this app actually reads. */
export function makeImagePickerAsset(overrides: Record<string, unknown> = {}) {
  return { uri: 'file:///tmp/test-document.jpg', mimeType: 'image/jpeg', width: 100, height: 100, ...overrides };
}

/** Minimal stand-in for an `expo/fetch` Response — only .ok/.status are read
 *  by src/api/kyc-upload.ts (S3 error bodies are XML and are never parsed). */
export function makeUploadResponse(ok = true, status = 200) {
  return { ok, status };
}

/** Shape-accurate expo-location LocationObject. Field list copied from
 *  node_modules/expo-location/build/Location.types.d.ts — `mocked` is the
 *  Android-only mock-provider flag (PITFALLS.md Pitfall 10). */
export function makeLocationObject(
  overrides: {
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
    timestamp?: number;
    mocked?: boolean;
  } = {},
) {
  const {
    latitude = 3.139,
    longitude = 101.6869,
    accuracy = 12,
    timestamp = 1_700_000_000_000,
    mocked = false,
  } = overrides;
  return {
    coords: { latitude, longitude, altitude: 30, accuracy, altitudeAccuracy: 5, heading: 0, speed: 0 },
    timestamp,
    mocked,
  };
}

/** jest.mock factory for 'expo-location'.
 *  Usage: jest.mock('expo-location', () => require('../../test-utils/expo-mocks').createExpoLocationMock());
 *  Every function is a jest.fn() so individual tests can set per-case resolutions.
 *  watchPositionAsync resolves to a subscription whose remove() is also a jest.fn(),
 *  so start/stop lifecycle assertions are possible without a real subscription. */
export function createExpoLocationMock() {
  return {
    Accuracy: { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5, BestForNavigation: 6 },
    PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
    hasServicesEnabledAsync: jest.fn(async () => true),
    getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    getCurrentPositionAsync: jest.fn(async () => makeLocationObject()),
    watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  };
}

/** jest.mock factory for 'react-native-maps'. MapView and Marker render as plain
 *  Views carrying testIDs so component tests can assert marker presence and props
 *  without instantiating the native Fabric map view (which cannot render under Jest). */
export function createReactNativeMapsMock() {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = (props: Record<string, unknown> & { children?: ReactNode }) =>
    React.createElement(View, { testID: 'map-view', ...props }, props.children);
  const Marker = (props: Record<string, unknown> & { children?: ReactNode }) =>
    React.createElement(View, { testID: 'map-marker', ...props }, props.children);
  return { __esModule: true, default: MapView, MapView, Marker, PROVIDER_GOOGLE: 'google' };
}

/** jest.mock factory for 'lucide-react-native'.
 *  Usage: jest.mock('lucide-react-native', () => require('../../test-utils/expo-mocks').createLucideMock());
 *  Returns a Proxy so ANY icon name resolves — tests never break when a screen
 *  swaps one glyph for another, and react-native-svg's native module is never
 *  loaded under Jest. Each icon renders a View with testID `icon-<Name>`. */
export function createLucideMock() {
  const React = require('react');
  const { View } = require('react-native');
  const cache = new Map<string, unknown>();
  return new Proxy(
    { __esModule: true },
    {
      get: (target: Record<string, unknown>, prop: string) => {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        if (!cache.has(prop)) {
          const Icon = (props: Record<string, unknown>) =>
            React.createElement(View, { testID: `icon-${prop}`, ...props });
          Icon.displayName = prop;
          cache.set(prop, Icon);
        }
        return cache.get(prop);
      },
    },
  );
}
