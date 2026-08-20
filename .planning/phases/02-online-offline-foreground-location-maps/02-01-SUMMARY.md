---
phase: 02-online-offline-foreground-location-maps
plan: 01
subsystem: infra
tags: [expo, expo-config-plugins, google-maps, expo-location, jest, haversine, fonts, lucide]

# Dependency graph
requires: []
provides:
  - "app.config.js dynamic Expo config injecting MAP_API_KEY into the react-native-maps Android plugin"
  - "expo-location Android manifest config (foreground-only permissions)"
  - "src/lib/geo.ts haversineMeters pure helper"
  - "src/test-utils/expo-mocks.ts expo-location / react-native-maps Jest mock factories"
  - "EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL and EXPO_PUBLIC_LOCATION_BASE_URL env vars"
  - "expo-font, @expo-google-fonts/plus-jakarta-sans, react-native-svg, lucide-react-native as direct deps"
affects: [02-03 (fonts/icons), 02-04 (service base URLs), 02-05, 02-09, 02-10 (location/maps mocks and haversine)]

# Tech tracking
tech-stack:
  added: [expo-font, "@expo-google-fonts/plus-jakarta-sans", react-native-svg, lucide-react-native]
  patterns:
    - "Dynamic app.config.js layered on top of static app.json — app.json stays the base, app.config.js only adds env-dependent plugin config"
    - "Non-EXPO_PUBLIC_-prefixed secrets (MAP_API_KEY) read only in Node/config context, never bundled into JS"
    - "Per-file jest.mock() factories in src/test-utils/expo-mocks.ts for native modules with no jest-expo auto-mock"

key-files:
  created:
    - app.config.js
    - src/lib/geo.ts
    - src/lib/geo.test.ts
    - src/test-utils/expo-mocks.test.ts
  modified:
    - package.json
    - package-lock.json
    - .env
    - .env.example
    - app.json (auto-modified by `npx expo install expo-font` — registered the expo-font config plugin)
    - src/test-utils/expo-mocks.ts

key-decisions:
  - "Kept app.json as the static base; app.config.js only layers the react-native-maps and expo-location plugin configs (env-dependent), per plan design"
  - "expo-location plugin configured foreground-only (isAndroidBackgroundLocationEnabled/isAndroidForegroundServiceEnabled/isIosBackgroundLocationEnabled all false) — LOC-01 background tracking is v2-deferred"
  - "app.config.js throws at config-evaluation time if MAP_API_KEY is unset, to fail loudly instead of silently stripping the manifest meta-data (RESEARCH.md Pitfall 3)"
  - "Did not touch eas.json — dynamic config works transparently with EAS Build"

patterns-established:
  - "Shared Jest mock factories (makeLocationObject, createExpoLocationMock, createReactNativeMapsMock) live in src/test-utils/expo-mocks.ts for reuse across plans 02-05/02-09/02-10"
  - "TDD RED/GREEN split commits for pure-function + mock-factory work (test commit, then feat commit)"

requirements-completed: [PRES-02, PRES-03]

# Metrics
duration: 6min
completed: 2026-08-20
---

# Phase 02 Plan 01: Wave-0 Groundwork — Deps, Dynamic Config, Geo/Test Infra Summary

**Dynamic `app.config.js` wires `MAP_API_KEY` into `AndroidManifest.xml` via the react-native-maps plugin (verified by `expo prebuild`), plus a hand-rolled `haversineMeters` helper and shared `expo-location`/`react-native-maps` Jest mock factories.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-20T13:43:30Z
- **Completed:** 2026-08-20T13:49:30Z
- **Tasks:** 3 (Task 3 executed as TDD: RED then GREEN)
- **Files modified:** 10

## Accomplishments
- Installed `expo-font`, `@expo-google-fonts/plus-jakarta-sans`, `react-native-svg`, `lucide-react-native` as direct dependencies without bumping the already-pinned `react-native-maps@1.27.2` / `expo-location@~57.0.7`
- Added `EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL` and `EXPO_PUBLIC_LOCATION_BASE_URL` to `.env`/`.env.example` (fixed missing trailing newline in `.env` along the way)
- Converted the app to a dynamic Expo config (`app.config.js`) that injects `process.env.MAP_API_KEY` into the react-native-maps Android plugin and throws if it's missing; `app.json` remains the untouched static base
- Ran `npx expo prebuild --platform android --clean` and confirmed `AndroidManifest.xml` carries `com.google.android.geo.API_KEY` (real key value, starts with `AIza`) plus `ACCESS_FINE_LOCATION`, with no background-location permissions
- Implemented `src/lib/geo.ts` (`haversineMeters`) with 5 passing behaviour tests (identity, known-distance, cosine-scaled longitude, symmetry, southern-hemisphere finiteness)
- Extended `src/test-utils/expo-mocks.ts` with `makeLocationObject`, `createExpoLocationMock`, `createReactNativeMapsMock`, plus a smoke test proving they're importable under the `jest-expo/android` preset

### Confirmed Plus Jakarta Sans export names

Ran `grep -o "PlusJakartaSans_[A-Za-z0-9]*" node_modules/@expo-google-fonts/plus-jakarta-sans/index.js | sort -u`. All five expected weights are present, plus two additional lighter weights not listed in the plan (available but not required this phase):

- `PlusJakartaSans_200ExtraLight` (extra, not required)
- `PlusJakartaSans_300Light` (extra, not required)
- `PlusJakartaSans_400Regular`
- `PlusJakartaSans_500Medium`
- `PlusJakartaSans_600SemiBold`
- `PlusJakartaSans_700Bold`
- `PlusJakartaSans_800ExtraBold`

### Native rebuild required before the Maps key takes effect

`npx expo prebuild --platform android --clean` regenerated `android/` with the real `MAP_API_KEY` baked into `AndroidManifest.xml`. A JS reload is **not** sufficient to pick this up on a device — a native rebuild (`npx expo run:android`, or a fresh EAS dev-client build) is required. Plan 02-11's device checkpoint should treat this rebuild as already having happened at the native-project level, but any device/emulator testing session must install a build produced after this commit.

### New `.env` variables (local-dev values)

```
EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL=http://localhost:8084/api/v1/driver-trips   # .env (localhost)
EXPO_PUBLIC_LOCATION_BASE_URL=http://localhost:8081/api/v1/location            # .env (localhost)

EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL=http://10.0.2.2:8084/api/v1/driver-trips     # .env.example (Android emulator host)
EXPO_PUBLIC_LOCATION_BASE_URL=http://10.0.2.2:8081/api/v1/location             # .env.example (Android emulator host)
```

`EXPO_PUBLIC_API_BASE_URL` (go-ride-backend, :8080) was left unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install missing packages and add the two new service base URLs** - `8d29a50` (chore)
2. **Task 2: Convert to dynamic Expo config so MAP_API_KEY reaches AndroidManifest.xml** - `c1f7a93` (feat)
3. **Task 3: Jest mocks for expo-location / react-native-maps, plus the haversineMeters helper** - `c628ed4` (test, RED) then `47ba966` (feat, GREEN)

**Plan metadata:** committed after this summary (docs: complete plan)

_Note: Task 3 was TDD — test commit (failing) followed by feat commit (passing). No refactor commit needed._

## Files Created/Modified
- `app.config.js` - Dynamic Expo config injecting `MAP_API_KEY` into react-native-maps plugin + foreground-only expo-location plugin config; throws if the key is missing
- `src/lib/geo.ts` - `haversineMeters` pure great-circle-distance helper (IUGG mean Earth radius, asin-clamped)
- `src/lib/geo.test.ts` - 5 behaviour tests for `haversineMeters`
- `src/test-utils/expo-mocks.ts` - Added `makeLocationObject`, `createExpoLocationMock`, `createReactNativeMapsMock` (existing `makeImagePickerAsset`/`makeUploadResponse` untouched)
- `src/test-utils/expo-mocks.test.ts` - Smoke test for the new mock factories
- `package.json` / `package-lock.json` - Added `expo-font`, `@expo-google-fonts/plus-jakarta-sans`, `react-native-svg`, `lucide-react-native` as direct deps
- `.env` / `.env.example` - Added the two new `EXPO_PUBLIC_*` base URLs; fixed missing trailing newline in `.env`
- `app.json` - Auto-modified by `npx expo install expo-font` to register the `expo-font` config plugin (side effect of the install command, not a manual edit)

## Decisions Made
- Kept `app.json` as the static base and layered `app.config.js` on top per the plan's design, rather than converting `app.json` itself to a `.js`/`.ts` file
- `expo-location` plugin left fully foreground-only (all Android background flags `false`) to keep `ACCESS_BACKGROUND_LOCATION`/`FOREGROUND_SERVICE_LOCATION` out of the manifest and Play Store background-location review out of scope, matching PROJECT.md's v2-deferral of LOC-01
- `app.config.js` fails loudly (throws) at config-evaluation time if `MAP_API_KEY` is unset, rather than allowing the react-native-maps plugin to silently strip the manifest meta-data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking/expected tooling side effect] `npx expo install expo-font` auto-registered the `expo-font` config plugin in `app.json`**
- **Found during:** Task 1 (package install)
- **Issue:** `expo-font` requires a config plugin for asset registration; `npx expo install` detected this and appended `"expo-font"` to `app.json`'s `plugins` array as a side effect of the install command itself (not something this plan's Task 1 action explicitly requested)
- **Fix:** No fix needed — this is Expo tooling's correct, expected behavior for a package that ships a config plugin. Left as-is.
- **Files modified:** `app.json`
- **Verification:** Task 2's acceptance criterion "`app.json` still exists and is unmodified (`git diff --stat app.json` shows no changes)" was verified *after Task 1's commit already included this change* — Task 2 itself made zero further edits to `app.json`, confirmed by `git diff --stat app.json` showing no output during Task 2
- **Committed in:** `8d29a50` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking/tooling side effect)
**Impact on plan:** No scope creep — this was Expo CLI's own behavior when installing a package with a required config plugin, not a manual change. Task 2's "app.json unmodified" acceptance criterion still holds relative to Task 2's own actions.

## Issues Encountered
None.

## User Setup Required

Per this plan's frontmatter `user_setup`, a Google Maps Platform check is still owed by the user before device verification (not owed to this execution, informational only):
- Confirm `MAP_API_KEY` (already in `.env`) is either unrestricted or has an Android application restriction listing the SHA-1 of whichever keystore signs the dev-client build (debug keystore for `expo run:android`, EAS-managed keystore for `eas build`), alongside package name `com.goride.driver`, in Google Cloud Console → APIs & Services → Credentials
- Confirm "Maps SDK for Android" is enabled on the project that owns that key, in Google Cloud Console → APIs & Services → Library

Neither step blocks this plan's code from being correct — `npx expo prebuild` confirmed the key reaches the manifest regardless of its Cloud Console restrictions. This is only needed before a real device renders map tiles.

## Next Phase Readiness
- `src/lib/geo.ts` and the three new mock factories in `src/test-utils/expo-mocks.ts` are ready for plans 02-04, 02-05, 02-09, 02-10 to import
- `app.config.js` + prebuilt `android/` directory are ready for any plan needing a native rebuild (`npx expo run:android`) later in this phase
- `EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL` / `EXPO_PUBLIC_LOCATION_BASE_URL` are ready for plan 02-04's HTTP clients
- Plus Jakarta Sans font weights and `lucide-react-native` are installed and ready for plan 02-03
- No blockers identified for subsequent waves

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All created files verified present on disk; all four task commit hashes (`8d29a50`, `c1f7a93`, `c628ed4`, `47ba966`) verified present in git history.
