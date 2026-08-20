// Dynamic Expo config. app.json remains the static base — Expo passes its `expo`
// object in as `config` here. This file exists for one reason: static JSON cannot
// interpolate process.env, and react-native-maps' Android config plugin needs the
// Google Maps key as a literal plugin prop at prebuild time (it writes
// com.google.android.geo.API_KEY into AndroidManifest.xml). MAP_API_KEY is
// deliberately NOT EXPO_PUBLIC_-prefixed: it must never be inlined into the JS
// bundle, only read here in Node/config context, where Expo CLI has already
// loaded .env.
if (!process.env.MAP_API_KEY) {
  // Fail loudly at config-evaluation time rather than shipping a build whose map
  // silently renders a blank grey grid (RESEARCH.md Pitfall 3).
  throw new Error(
    'MAP_API_KEY is missing. Copy .env.example to .env and set MAP_API_KEY before running expo prebuild/start.'
  );
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.MAP_API_KEY,
      },
    ],
    [
      'expo-location',
      {
        // Foreground only this phase — LOC-01 (background tracking) is v2-deferred
        // per PROJECT.md. Leaving both Android background/foreground-service flags
        // false keeps ACCESS_BACKGROUND_LOCATION and FOREGROUND_SERVICE_LOCATION
        // out of the manifest, which keeps Play Store policy review out of scope.
        locationWhenInUsePermission:
          'GoRide Driver uses your location while you are online so nearby riders can be matched to you.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
  ],
});
