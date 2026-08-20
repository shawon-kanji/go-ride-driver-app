---
phase: 02-online-offline-foreground-location-maps
plan: 05
subsystem: location
tags: [expo-location, zustand, foreground-tracking, watchPositionAsync, expo-router]

# Dependency graph
requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "lib/geo.ts haversineMeters, test-utils/expo-mocks.ts, flattened (app)/ route group (plan 02-02), location-client.ts + UpdateLocationPayload (plan 02-04)"
provides:
  - "ensureForegroundLocation / getForegroundLocationStatus permission helpers (request only from D07's press handler)"
  - "usePresenceStore volatile last-fix store for the map"
  - "startLocationBroadcast / stopLocationBroadcast / isBroadcasting tiered foreground watcher singleton"
  - "useLocationBroadcastLifecycle hook wired into src/app/(app)/_layout.tsx, driven by Driver.is_online"
affects: [02-09-go-online-sheet, 02-10-home-map, 02-12-home-screen]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "App-level singleton lifecycle (module-scope watcher state) started/stopped by a layout-level effect keyed on server truth (Driver.is_online), never by a screen mount"
    - "Deterministic JS-side throttle (Date.now() diffs) instead of watchPositionAsync's Android-only timeInterval, keeping cadence logic unit-testable under fake timers"
    - "Conditional payload key assignment (never spread-with-undefined) to satisfy a DisallowUnknownFields() Go decoder"

key-files:
  created:
    - src/features/presence/permissions.ts
    - src/features/presence/permissions.test.ts
    - src/features/presence/presence-store.ts
    - src/features/presence/presence-store.test.ts
    - src/features/presence/location-broadcaster.ts
    - src/features/presence/location-broadcaster.test.ts
    - src/features/presence/use-location-broadcast-lifecycle.ts
    - src/features/presence/use-location-broadcast-lifecycle.test.tsx
  modified:
    - src/app/(app)/_layout.tsx

key-decisions:
  - "expo-location's Android mock-provider flag is named `mocked` (boolean, optional) on LocationObject — confirmed via node_modules/expo-location/build/Location.types.d.ts, matching what plan 02-01's makeLocationObject already assumed. No deviation needed."
  - "lastSentAt initialized to -Infinity, not 0 — with 0 as the sentinel, a test (or a device with a misconfigured Unix-epoch clock) whose Date.now() is also 0 would fail the 'nothing sent yet' heartbeat check on the very first fix. Applied in module init, startLocationBroadcast(), and stopLocationBroadcast()."
  - "Task 2's test beforeEach must explicitly re-assert Location permission mock defaults (hasServicesEnabledAsync/getForegroundPermissionsAsync/requestForegroundPermissionsAsync) every test — jest.clearAllMocks() clears call history but not a previously-set mockResolvedValue, so a permission-denied test would otherwise leak into later tests."
  - "The broadcaster self-guards on permission via getForegroundLocationStatus() (read-only, no dialog) inside startLocationBroadcast() — callers (the lifecycle hook, and later D07/D06) never need to check readiness before calling start; a denied/services-off state is a silent no-op, not a throw."

patterns-established:
  - "Presence telemetry (usePresenceStore) is a separate zustand store from session-store.ts: volatile map-display state vs. persisted auth state, no persist middleware on either"

requirements-completed: [PRES-02]

# Metrics
duration: 9min
completed: 2026-08-20
---

# Phase 02 Plan 05: Foreground Location Broadcaster Summary

**A layout-level, server-truth-driven `watchPositionAsync` singleton that POSTs to location-producers on a 10s-movement/60s-heartbeat/25m-minimum-distance tier, decoupled from any screen's mount lifecycle.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-08-20T14:13:26Z
- **Completed:** 2026-08-20T14:22:31Z
- **Tasks:** 3
- **Files modified:** 9 (8 created, 1 modified)

## Accomplishments

- `ensureForegroundLocation` / `getForegroundLocationStatus` give a single tested seam for permission state, with the request-only variant restricted to a single call site by construction (grep-enforced)
- `usePresenceStore` lets the map read the driver's latest fix without a second GPS subscription
- `location-broadcaster.ts` implements the full RESEARCH.md-derived tiering (10s movement floor / 60s heartbeat / 25m minimum distance) as a deterministic, unit-testable JS throttle — 17 tests cover idempotency, permission guard, all four tiering branches, payload key shape (including omission of `accuracy_m`), the mock-provider flag, session-not-hydrated safety, POST failure isolation, and stop/reset correctness
- `useLocationBroadcastLifecycle` mounted once in `src/app/(app)/_layout.tsx` makes broadcasting survive navigation between Home/Menu/Vehicles/Verify/Profile, driven entirely by the server's `Driver.is_online`, with an unconditional stop-on-unmount effect

## Task Commits

1. **Task 1: Foreground-permission helper and the last-fix presence store** - `080376c` (feat)
2. **Task 2: The tiered location broadcaster singleton** - `e073c38` (feat)
3. **Task 3: Drive the broadcaster from Driver.is_online at the (app) layout level** - `d88dad9` (feat)

_TDD tasks: each commit bundles the RED test file with the GREEN implementation — tests were written and run to confirm failure before implementing, per the plan's `tdd="true"` requirement, but committed together as the task's single atomic commit._

## Files Created/Modified

- `src/features/presence/permissions.ts` - `ensureForegroundLocation` (request-capable, D07-only), `getForegroundLocationStatus` (read-only), `LocationReadiness` type
- `src/features/presence/presence-store.ts` - `usePresenceStore` zustand store: `lastCoords`, `lastFixAt`, `broadcasting`
- `src/features/presence/location-broadcaster.ts` - `startLocationBroadcast`/`stopLocationBroadcast`/`isBroadcasting`, tiering constants, module-singleton watcher
- `src/features/presence/use-location-broadcast-lifecycle.ts` - `useLocationBroadcastLifecycle`, two `useEffect`s (is_online-keyed start/stop, empty-deps stop-on-unmount)
- `src/app/(app)/_layout.tsx` - one-line wiring: `useLocationBroadcastLifecycle()` call added, `<Stack>` kept childless

## Decisions Made

- Confirmed expo-location's Android mock-provider flag name (`mocked`) via `node_modules/expo-location/build/Location.types.d.ts` — matches the plan's assumption, no adaptation needed
- `lastSentAt` sentinel changed from `0` to `-Infinity` (see Deviations)
- Broadcaster self-guards on permission; no caller needs a pre-check

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `lastSentAt` initial value of `0` defeats the "first fix always posts" guarantee under `Date.now() === 0`**
- **Found during:** Task 2, writing the "posts the very first fix immediately" test
- **Issue:** The plan's reference implementation initialized `lastSentAt = 0` on module load and on `startLocationBroadcast()`/`stopLocationBroadcast()`. Tests use `jest.useFakeTimers().setSystemTime(0)`, so `Date.now()` is also `0` at the first fix — `now - lastSentAt = 0 - 0 = 0`, which fails both the movement throttle (`>= 10_000`) and heartbeat (`>= 60_000`) checks, so the very first fix silently was NOT posted. This also latently affects any real device with a misconfigured clock near the Unix epoch.
- **Fix:** Changed the sentinel to `-Infinity` in all three places (module init, `startLocationBroadcast`, `stopLocationBroadcast`), so `now - lastSentAt` is always `Infinity` immediately after a (re)start regardless of the current wall-clock value.
- **Files modified:** `src/features/presence/location-broadcaster.ts`
- **Verification:** All 17 `location-broadcaster.test.ts` tests pass, including "posts the very first fix immediately" and "resets throttle state after stop then start".
- **Committed in:** `e073c38` (Task 2 commit)

**2. [Rule 1 - Bug] Test-file `beforeEach` didn't reset permission-mock overrides between tests**
- **Found during:** Task 2, after the sentinel fix, running the full `location-broadcaster.test.ts` suite (individual tests passed, sequential runs failed)
- **Issue:** `jest.clearAllMocks()` clears call/instance history but not a previously-assigned `mockResolvedValue` implementation. The "does not start when permission is denied" test set `getForegroundPermissionsAsync` to resolve `denied`, which then leaked into every subsequent test in file order, causing `startLocationBroadcast()` to silently no-op for the rest of the suite.
- **Fix:** Added explicit `mockResolvedValue` re-assertions for `hasServicesEnabledAsync`, `getForegroundPermissionsAsync`, and `requestForegroundPermissionsAsync` inside `beforeEach`, restoring the granted-happy-path default before every test.
- **Files modified:** `src/features/presence/location-broadcaster.test.ts`
- **Verification:** Full suite (`npx jest --watchAll=false`) passes, 17/17 in this file, 99/99 project-wide.
- **Committed in:** `e073c38` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bug fixes found while writing/running the TDD tests themselves)
**Impact on plan:** Both fixes are pure correctness fixes to test-fixture/implementation interaction discovered during the plan's own TDD process; no scope change, no new files beyond what the plan specified.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## User Setup Required

None - no external service configuration required. (`expo-location` and `zustand` were already installed by plan 02-01/earlier phases; no new dependencies added.)

## Next Phase Readiness

- `ensureForegroundLocation`/`getForegroundLocationStatus`, `usePresenceStore`, and `startLocationBroadcast`/`stopLocationBroadcast` are all exported with the exact signatures the plan's `<interfaces>` block promised — plans 02-09 (D07 Go Online sheet) and 02-10/02-12 (D06 Home map) can consume them directly with no further adaptation
- Verification gate is green: `npx tsc --noEmit`, `npx expo lint` (0 errors, pre-existing warning-only import-order style across the repo), `npx jest --watchAll=false` (99/99), and `npx expo export --platform android` all pass
- Architectural rules hold: `watchPositionAsync` only in `location-broadcaster.ts` (+ its test/mock), `requestForegroundPermissionsAsync` only in `permissions.ts` (+ its test), `startLocationBroadcast` only reached from `src/app/(app)/_layout.tsx` via the lifecycle hook, no screen file references the watcher, no background-location API referenced anywhere

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All 9 created/modified files verified present on disk; all 3 task commit hashes (`080376c`, `e073c38`, `d88dad9`) verified present in git history.
