---
phase: 02-online-offline-foreground-location-maps
plan: 09
subsystem: ui
tags: [react-native, nativewind, react-hook-form, tanstack-query, expo-router]

# Dependency graph
requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "Plan 02-06's Button variants + ScreenHeader; plan 02-07's TextInput errorText; plan 02-08's summariseTrack; plan 02-04's presence gating conventions"
provides:
  - "SegmentedControl — a 2+-option single-select control (src/components/SegmentedControl.tsx)"
  - "VehicleForm retrofitted to the dashed 'ADD A VEHICLE' create-mode container with a neutral-900 Register vehicle CTA and SegmentedControl-backed Category"
  - "VehicleCard rebuilt with a PLATE/DOCUMENTS footer split, an in-UI unverified-vehicle gate, and a warning strip that routes into Verification preselected to that vehicle"
  - "D05 Vehicles list (src/app/(app)/vehicles/index.tsx) on ScreenHeader + a tonal + Add pill, one KYC query for the whole screen, in-list activation translating 403s via KycBlockedBanner"
affects: [D06-home-online-toggle, D07-confirm-online-sheet]

tech-stack:
  added: []
  patterns:
    - "SegmentedControl is a deliberate sibling of Select, not a replacement — Select's modal list still backs the vehicle-document picker, a 2-option category uses the mockup's segmented control instead"
    - "VehicleCard stays presentational: the parent screen owns useKycStatusQuery once and passes approvedDocumentCount per row, so the card never runs a query"
    - "The unverified-Activate gate in VehicleCard is documented in-code as a UX pre-empt only — src/app/(app)/vehicles/[id].tsx's 403 -> kycBlockReason -> KycBlockedBanner path (Phase 01.1 plan 07) remains untouched and is still the authoritative backstop"

key-files:
  created:
    - src/components/SegmentedControl.tsx
    - src/components/SegmentedControl.test.tsx
    - src/features/vehicles/components/VehicleCard.test.tsx
  modified:
    - src/features/vehicles/components/VehicleForm.tsx
    - src/features/vehicles/components/VehicleCard.tsx
    - src/features/vehicles/components/VehicleListEmptyState.tsx
    - src/app/(app)/vehicles/index.tsx

key-decisions:
  - "VehicleCard sub-line format is exactly `\"<colour> · <N> seats · <category>\"` (e.g. \"Black · 4 seats · normal\") — plan 02-10's D07 ConfirmOnlineSheet must render the identical line for the confirmed vehicle, not invent a variant"
  - "Warning-strip copy is `\"<N> document(s) missing or rejected, so this vehicle can't be activated yet.\"` with a trailing `Fix` control (testID `vehicle-fix`) routing to `{ pathname: '/verify', params: { vehicleId } }` — D06 should reuse this exact phrasing rather than re-deriving it"
  - "Activate control testID is `vehicle-activate`; muted+disabled when unverified, tonal+enabled (loading tracked via `activating`) when verified and inactive; renders nothing when already active or when the parent omits onActivate"

patterns-established:
  - "SegmentedControl<T extends string> generic API mirrors Select's SegmentOption<T> shape for easy reuse by any future 2+-option single-select field"

requirements-completed: [PRES-01]

# Metrics
duration: 20min
completed: 2026-08-20
---

# Phase 02 Plan 09: D05 Vehicles Retrofit Summary

**Rebuilt the D05 Vehicles list and register form to the mockup: a `SegmentedControl` category picker in a dashed "ADD A VEHICLE" container, a `VehicleCard` with a PLATE/DOCUMENTS footer split and a client-side gate on activating an unverified vehicle, and a `ScreenHeader` + `+ Add` pill list screen with one KYC query feeding every row.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-20T15:43:00Z
- **Completed:** 2026-08-20T16:03:39Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- New `SegmentedControl` component (2-option `primary-500`-filled segmented control), fully unit-tested (6 tests), backing `VehicleForm`'s Category field in place of the modal `Select`
- `VehicleForm`'s create mode now renders inside the mockup's dashed `neutral-300` "ADD A VEHICLE" container behind a `neutral-900` `Register vehicle` CTA, with plate number + seats stepper in a two-column row and inline per-field error text; edit mode (used inside `/vehicles/[id]`) is visually unaffected
- `VehicleCard` rebuilt as a pure presentational component: model row, PLATE/DOCUMENTS footer split (green when fully approved, amber otherwise), an indigo 2px border when active, a greyed non-interactive Activate control when unverified, and a warning strip whose `Fix` link routes into `/verify` preselected to that vehicle — all backed by 9 new tests
- D05's list screen (`src/app/(app)/vehicles/index.tsx`) now uses `ScreenHeader` with a tonal `+ Add` pill, runs a single `useKycStatusQuery` for the whole screen (not per row), and wires in-list `Activate` through `useActivateVehicleMutation`, translating a KYC 403 into the same `KycBlockedBanner`/`Banner` pattern Phase 01.1 plan 07 established on the vehicle-detail screen

## Task Commits

Each task was committed atomically:

1. **Task 1: SegmentedControl, and the register-form treatment** - `dbce154` (feat)
2. **Task 2: Rebuild VehicleCard with the PLATE/DOCUMENTS footer, activate gate, and warning strip** - `177a703` (feat)
3. **Task 3: D05 Vehicles list screen retrofit** - `153d84a` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/components/SegmentedControl.tsx` - New 2+-option single-select control, `rounded-control` border, `min-h-[44px]` segments, `bg-primary-500` selected fill
- `src/components/SegmentedControl.test.tsx` - 6 tests covering labels, selected/unselected styling, onChange (including idempotent re-select), and layout tokens
- `src/features/vehicles/components/VehicleForm.tsx` - Dashed create-mode container, two-column plate/seats row, `SegmentedControl`-backed Category, inline `errorText` per field, `dark`/`primary` CTA split by mode
- `src/features/vehicles/components/VehicleCard.tsx` - Rewritten with `approvedDocumentCount`, `onActivate?`, `activating?` props; PLATE/DOCUMENTS footer; client-side Activate gate; warning strip with `Fix` -> `/verify`
- `src/features/vehicles/components/VehicleCard.test.tsx` - 9 tests covering title/sub-line, footer cells, success/warning colour, disabled vs enabled Activate, active-vehicle rendering, card-press vs Fix-press routing
- `src/features/vehicles/components/VehicleListEmptyState.tsx` - Copy updated to the mockup's voice ("Register a vehicle and upload its documents before you can go online.")
- `src/app/(app)/vehicles/index.tsx` - Rewritten: `ScreenHeader` + `+ Add` pill, single `useKycStatusQuery`, in-list `Activate` wired to `useActivateVehicleMutation` with `KycBlockedBanner`/`Banner` 403 handling, `FlatList` supplying `VehicleCard`'s new props

## Decisions Made
- Kept `src/components/Select.tsx` and `src/components/Stepper.tsx` untouched — `Select` still backs the vehicle-document picker elsewhere; only `VehicleForm`'s Category field switched to `SegmentedControl`
- Left `src/app/(app)/vehicles/[id].tsx` and `src/features/vehicles/api.ts` completely untouched per the plan's explicit constraint — the vehicle-card gate is a UX pre-empt layered on top of, not a replacement for, Phase 01.1 plan 07's 403 handling
- `VehicleListEmptyState` renders inside the same root `View` as `ScreenHeader` (not as an early return) so the header — and its `+ Add` pill — stays visible with zero vehicles

## Deviations from Plan

None - plan executed exactly as written. One acceptance-criteria grep is worth noting: `grep -c "useKycStatusQuery" src/app/(app)/vehicles/index.tsx` returns `2`, not `1`, because the string appears once in the import statement and once in the single call site — this is unavoidable with a named import and does not indicate a per-row query; `useKycStatusQuery()` is called exactly once in the component body, confirmed by reading the file.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- D05 Vehicles is now visually and behaviourally aligned with the mockup and ready as the landing target for D06's "no active vehicle" branch and D07's "Switch vehicle" action
- The exact sub-line format (`"<colour> · <N> seats · <category>"`) and warning-strip copy are recorded above for plan 02-10's D07 sheet (and any later D06 work) to reuse verbatim
- Full verification gate (`tsc`, `expo lint`, `jest`, `expo export --platform android`) is green

## Self-Check: PASSED

All created/modified files and all three task commit hashes (`dbce154`, `177a703`, `153d84a`) verified present.

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*
