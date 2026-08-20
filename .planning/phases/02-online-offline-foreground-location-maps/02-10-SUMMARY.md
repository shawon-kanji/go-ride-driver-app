---
phase: 02-online-offline-foreground-location-maps
plan: 10
subsystem: ui
tags: [react-native-maps, expo-router, tanstack-query, jest, testing-library]

requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "ensureForegroundLocation/getForegroundLocationStatus (plan 02-05) and useSetOnlineStatusMutation (plan 02-04)"
  - phase: 02-online-offline-foreground-location-maps
    provides: "Button's nine-variant fill surface and createReactNativeMapsMock/createLucideMock test helpers (plan 02-06)"
  - phase: 02-online-offline-foreground-location-maps
    provides: "KycBlockedBanner/kycBlockReason (kyc feature) and VEHICLE_DOCUMENT_TYPES (kyc schemas)"
provides:
  - "HomeMap — presentational react-native-maps view with own-position marker and a camera-follow/re-centre state machine"
  - "ConfirmOnlineSheet — D07 bottom sheet, the only path that requests foreground location and calls PATCH /driver/online"
affects: [02-12]

tech-stack:
  added: []
  patterns:
    - "HomeMap is purely presentational — it takes coords as a prop and never imports expo-location itself, keeping location-fetching centralized in plan 02-05's lifecycle/store"
    - "ConfirmOnlineSheet's Go online handler is the single call site in the entire app allowed to invoke ensureForegroundLocation(), and it never calls startLocationBroadcast — the broadcaster starts only from the (app) layout's is_online-driven lifecycle (02-05)"

key-files:
  created:
    - src/features/presence/components/HomeMap.tsx
    - src/features/presence/components/HomeMap.test.tsx
    - src/features/presence/components/ConfirmOnlineSheet.tsx
    - src/features/presence/components/ConfirmOnlineSheet.test.tsx
  modified: []

key-decisions:
  - "HomeMap's camera-follow state machine treats react-native-maps' own onPanDrag as the single source of truth for 'the driver touched the map' (no separate PanResponder/gesture detector), matching RESEARCH.md's 'Don't Hand-Roll' guidance"
  - "HomeMap always renders a valid Region (Kuala Lumpur fallback) via initialRegion when coords is null, so the native view never receives undefined/NaN before the first fix arrives"
  - "ConfirmOnlineSheet is built as a brand-new bottom-sheet Modal primitive rather than reshaping the existing centred ConfirmDialog — UI-SPEC calls for a materially different geometry (slide-up, drag handle, rounded-top-only)"
  - "Error-state precedence inside ConfirmOnlineSheet is fixed: a KYC 403 (blockReason) takes priority and renders KycBlockedBanner; only when there is no blockReason do the denied/services_off/generic explainer blocks render"

requirements-completed: [PRES-01, PRES-03]

duration: unknown (session interrupted before SUMMARY was written; both task commits carry timestamps 22:46:23 and 22:51:12 on 2026-08-20)
completed: 2026-08-20
---

# Phase 02 Plan 10: HomeMap + ConfirmOnlineSheet (D06 map, D07 confirm-online sheet) Summary

**Built the two standalone, natively-mockable presence components D06 composes: `HomeMap` (own-position marker + camera-follow/re-centre state machine over `react-native-maps`) and `ConfirmOnlineSheet` (D07 — the only UI path that requests foreground location and flips the driver online).**

## Performance

- **Duration:** not recorded — the executing agent's session was interrupted by the laptop sleeping before it could write this SUMMARY.md; both implementation tasks were already committed and verified intact by this documentation pass.
- **Tasks:** 2
- **Files modified:** 4 (all newly created)

## Accomplishments

- `HomeMap` renders a `PROVIDER_GOOGLE` `MapView` with an own-position `Marker` (`tracksViewChanges={false}`, asserted not assumed), follows the camera via a `region` prop derived from `coords` until `onPanDrag` fires, then shows a 44px `home-map-recentre` control that restores following when pressed — all covered by 9 tests, none of which instantiate a native map.
- `HomeMap` never imports `expo-location` — it is purely presentational, taking `coords: LatLng | null` as a prop, and falls back to a Kuala Lumpur `initialRegion` so the native view never receives `undefined`/`NaN` before permission is granted.
- `ConfirmOnlineSheet` (D07) renders as a new bottom-sheet `Modal` primitive (not a reshaped `ConfirmDialog`) with the active-vehicle card (model, colour · seats · category sub-line, plate), a `success-50` "All 5 documents approved" strip gated on the full `VEHICLE_DOCUMENT_TYPES` count, and the location-sharing note.
- `ensureForegroundLocation()` is called exclusively inside the `Go online` press handler (never in a `useEffect`, never on mount) — confirmed by a dedicated test asserting zero calls after render and exactly one after the press.
- Denied / services-off / generic-failure outcomes all keep the driver on the sheet with the correct explainer and a `Try again` action that re-runs the same handler; none of them call `PATCH /driver/online`. A KYC 403 renders `KycBlockedBanner`'s identity copy instead of the generic failure line.
- `Switch vehicle` dismisses the sheet and routes to `/vehicles` without touching the mutation; neither component calls `startLocationBroadcast()` — the broadcaster is exclusively driven by plan 02-05's layout-level lifecycle.
- 13 tests cover visibility, content, the approval-strip threshold, the location note, switch-vehicle, the happy path, denied/services-off/retry, a KYC 403, a generic 500, the loading/no-double-submit guard, and the mount-vs-press call-count assertion for `ensureForegroundLocation`.

## Task Commits

Each task was committed atomically:

1. **Task 1: HomeMap with own-position marker and camera-follow state machine** - `586b590` (feat) - 2026-08-20T22:46:23+08:00
2. **Task 2: D07 ConfirmOnlineSheet — the only path to going online** - `85b4fc0` (feat) - 2026-08-20T22:51:12+08:00

_Note: both tasks were `tdd="true"`; test files (`HomeMap.test.tsx`, `ConfirmOnlineSheet.test.tsx`) were written first per the plan and landed in the same commit as their implementation, consistent with prior plans in this phase (e.g. 02-08 Task 1)._

## Exported Signatures (for plan 02-12)

```typescript
// src/features/presence/components/HomeMap.tsx
export function HomeMap(props: {
  /** Latest known fix, or null when permission has never been granted. */
  coords: LatLng | null;
  testID?: string;
}): JSX.Element;

// src/features/presence/components/ConfirmOnlineSheet.tsx
export function ConfirmOnlineSheet(props: {
  visible: boolean;
  /** The driver's active vehicle. D06 only opens the sheet when one exists. */
  vehicle: Vehicle;
  /** 0-5, from deriveOnlineGate().approvedVehicleDocumentCount. */
  approvedDocumentCount: number;
  /** Close without going online (scrim tap, drag handle, Switch vehicle). */
  onDismiss: () => void;
  /** PATCH /driver/online succeeded. D06 closes the sheet; the broadcaster is
   *  started by plan 02-05's layout-level lifecycle, NOT by this callback. */
  onWentOnline: () => void;
}): JSX.Element;
```

**testIDs exposed (for D06's composition test, plan 02-12):**
- `map-view`, `map-marker`, `home-map-recentre` (HomeMap)
- `confirm-online-scrim`, `confirm-online-switch`, `confirm-online-go`, `confirm-online-go-spinner`, `confirm-online-try-again` (ConfirmOnlineSheet)

**Neither component starts the location broadcaster** — confirmed by `grep -rn "startLocationBroadcast" src` matching only `location-broadcaster.ts` and `use-location-broadcast-lifecycle.ts` (plan 02-05), and by the plan's own negative grep gates on both new files.

## Files Created/Modified

- `src/features/presence/components/HomeMap.tsx` - MapView + Marker, camera-follow state machine, re-centre control (70 lines)
- `src/features/presence/components/HomeMap.test.tsx` - 9 tests (marker, tracksViewChanges, null-coords, follow/pan/recentre, region derivation, KL fallback)
- `src/features/presence/components/ConfirmOnlineSheet.tsx` - D07 bottom sheet (223 lines)
- `src/features/presence/components/ConfirmOnlineSheet.test.tsx` - 13 tests (visibility, content, approval strip, switch-vehicle, happy path, denied/services-off/retry, KYC 403, generic 500, loading/no-double-submit, mount-vs-press call count)

## Decisions Made

- `HomeMap`'s follow/pan state is driven entirely by `react-native-maps`' own `onPanDrag` callback — no custom gesture detector, per RESEARCH.md's "Don't Hand-Roll" guidance.
- `HomeMap` always supplies a valid `initialRegion` (Kuala Lumpur fallback) so the native view is never handed `undefined`/`NaN` before the driver's first fix arrives.
- `ConfirmOnlineSheet` is a new bottom-sheet `Modal` primitive, deliberately not built on top of `ConfirmDialog` (a centred fade dialog) — enforced by the plan's own `grep -q "ConfirmDialog"` negative gate.
- Error-state precedence in `ConfirmOnlineSheet`: a KYC 403 (`blockReason`) is checked and rendered before the denied/services_off/generic explainer blocks, so a blocked driver never sees both a `KycBlockedBanner` and the generic failure line simultaneously.
- `ensureForegroundLocation()` fires only from the `Go online` press handler, never a `useEffect` — enforced by the plan's `grep -q "useEffect"` negative gate and a dedicated call-count test.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' acceptance-criteria greps (scope-creep negatives for `Polyline`/`showsUserLocation`/`Circle`/`heading`/`watchPositionAsync`/`getCurrentPositionAsync`/`expo-location` on `HomeMap.tsx`; `useEffect`/`startLocationBroadcast`/`watchPositionAsync`/`ConfirmDialog`/`KYC_NOT_APPROVED`/`VEHICLE_NOT_VERIFIED` on `ConfirmOnlineSheet.tsx`) were re-verified clean during this documentation pass, and both test files exceed their minimum `it(` block counts (9 and 13 respectively).

## Issues Encountered

None. This documentation pass re-ran the full verification gate (`npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android`) against the already-committed code and it passed cleanly: `tsc` clean, `expo lint` 0 errors (45 pre-existing warnings across the repo, none introduced by this plan), all 24 test suites / 160 tests passing, and `expo export --platform android` exporting successfully once `MAP_API_KEY` was present in the shell env (a documented, pre-existing quirk of `expo export` not auto-loading `.env`, per the 02-03 decision log — not a defect in this plan's code).

The original executing agent's session was interrupted (laptop sleep) after both task commits landed but before `SUMMARY.md`/`STATE.md`/`ROADMAP.md`/`REQUIREMENTS.md` were updated. This SUMMARY, plus the associated STATE/ROADMAP/REQUIREMENTS updates, closes that gap; no code changes were needed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 02-12 (D06 Home) can now compose `HomeMap` and `ConfirmOnlineSheet` directly using the prop signatures and testIDs recorded above, without re-deriving either component's internal state machine.
- `deriveOnlineGate().activeVehicle` and `.approvedVehicleDocumentCount` (plan 02-04) map directly onto `ConfirmOnlineSheet`'s `vehicle`/`approvedDocumentCount` props.

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All 4 created files and both task commit hashes (586b590, 85b4fc0) verified present on disk and in git history.
