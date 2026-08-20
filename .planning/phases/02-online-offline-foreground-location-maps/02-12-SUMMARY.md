---
phase: 02-online-offline-foreground-location-maps
plan: 12
subsystem: ui
tags: [react-native, nativewind, expo-router, react-query, zustand, expo-location, jest, testing-library]

# Dependency graph
requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "Plan 02-04's deriveOnlineGate/gateToKycBlockReason and useSetOnlineStatusMutation/useTodayEarningsQuery/useTodayOnlineTimeQuery; plan 02-05's presence-store/permissions/location-broadcaster and the layout-level useLocationBroadcastLifecycle; plan 02-06's Button variant surface; plan 02-08's verification-summary; plan 02-10's HomeMap + ConfirmOnlineSheet; plan 02-11's /menu route"
provides:
  - "ProfileChip: floating avatar/name/plate+online-label/amber-alert-dot/chevron chip"
  - "StatCards: today's earnings and online-time cards backed by driver-request-handler, with correct singular/plural and zero-state copy"
  - "useHomeCoords: one-shot map seed (read-only permission probe, never prompts) plus a reactive read of the broadcaster's lastCoords"
  - "src/app/(app)/index.tsx — the rebuilt D06 Home screen: full-bleed map, floating chip, anchored bottom sheet, preserved Phase 01.1 KYC card, gate-driven Go online/Go offline control"
affects: []

tech-stack:
  added: []
  patterns:
    - "StatCards and ProfileChip read/receive only the exact fields they render (StatCards owns its two query hooks itself; ProfileChip is pure props) so D06 stays a thin composition layer"
    - "D06's control block switches on deriveOnlineGate's five statuses directly rather than re-deriving a shadow gate — mirrors the pattern set by /menu (plan 02-11) and ConfirmOnlineSheet (plan 02-10)"

key-files:
  created:
    - src/features/presence/components/ProfileChip.tsx
    - src/features/presence/components/ProfileChip.test.tsx
    - src/features/presence/components/StatCards.tsx
    - src/features/presence/components/StatCards.test.tsx
    - src/features/presence/use-home-coords.ts
    - src/features/presence/use-home-coords.test.tsx
    - src/app/(app)/index.test.tsx
  modified:
    - src/app/(app)/index.tsx

key-decisions:
  - "The Phase 01.1 Verification card's copy strings were kept verbatim (per CONTEXT.md's 'Keep it') but its className was migrated from legacy Tailwind classes (text-base/font-semibold/text-sm) to the design-system's font-jakarta-*/pixel-size tokens already used everywhere else on D06 — the plan's own interfaces block showed the old classes, but its acceptance criteria bans them project-wide, so the classes (not the copy) were updated to resolve that internal conflict"
  - "The no-vehicle/no-active-vehicle 'Go online' button stays a pressable muted Button routing to /vehicles, distinct from the truly `disabled` muted button used for the two KYC-blocked statuses — this matches UI-SPEC's Interaction Contract distinction between 'skip D07, go fix the vehicle' and 'you cannot proceed at all yet'"

requirements-completed: [PRES-01, PRES-03]

# Metrics
duration: ~25min
completed: 2026-08-21
---

# Phase 02 Plan 12: D06 Home Rebuild Summary

**Rebuilt `src/app/(app)/index.tsx` from Phase 01.1's placeholder card list into the full D06 Home: full-bleed self-position map, floating profile chip routing to /menu, an anchored bottom sheet with real earnings/online-time stat cards and the preserved KYC summary card, and a gate-driven online/offline control that routes through D07's ConfirmOnlineSheet — closing the last Wave 0 test-coverage gap in 02-VALIDATION.md.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3
- **Files modified:** 8 (7 created, 1 modified)

## Accomplishments

- `ProfileChip` — floating avatar/name/plate+online label/amber alert dot (only when something is outstanding, never a green "cleared" variant)/chevron, 6/6 tests green
- `StatCards` — reads `useTodayEarningsQuery`/`useTodayOnlineTimeQuery` itself, computes currency/amount/trip singular-plural/`formatMinutes` (h/m with no `0h` prefix) and both zero-state copies (`Not online yet`, and the implicit `RM 0.00`/`0 trips`), 9/9 tests green
- `useHomeCoords` — seeds the map from a single `getCurrentPositionAsync` only when the store is empty AND the read-only `getForegroundLocationStatus()` probe already reports `granted`; never calls `requestForegroundPermissionsAsync`; reactively reflects the broadcaster's `lastCoords` once it starts writing, 7/7 tests green
- D06 Home screen: composes `HomeMap`, `ProfileChip`, `StatCards`, the preserved Phase 01.1 Verification `Card`, `KycBlockedBanner`, and `ConfirmOnlineSheet` behind `deriveOnlineGate`'s five statuses; 14/14 tests green
- Every Wave 0 test file listed in 02-VALIDATION.md now exists — `src/app/(app)/index.test.tsx` was the last gap and is now in place with 14 passing tests covering all routing branches
- Full verification gate green: `npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android` — 32 suites / 230 tests passing, 0 lint errors, export bundle produced cleanly

## D06 Control-Block Branches

| Gate status | Button state | Press behavior |
|---|---|---|
| `no_vehicle` / `no_active_vehicle` | Muted "Go online" (pressable, not disabled) + a separate "Go to Vehicles" CTA | Both route to `/vehicles`; the confirm sheet never opens |
| `identity_blocked` / `vehicle_blocked` | Muted "Go online", `disabled` | Pressing does nothing; `KycBlockedBanner` renders above it with its own "Go to Verify" action routing to `/verify` |
| `ready` | Success "Go online" | Opens `ConfirmOnlineSheet` (D07) locally via `setSheetVisible(true)`; no router call |
| `driver.is_online === true` | Destructive-outline "Go offline" (only control shown; no blocker card, no footer note) | `useSetOnlineStatusMutation().mutate(false)` — going offline never calls `mutate(true)`, and the location broadcaster is stopped by plan 02-05's layout-level `useLocationBroadcastLifecycle()` reacting to the invalidated `['profile']` query, not by this screen |

The footer note (`Once you're cleared, Go online asks you to confirm the vehicle first.`) renders in all three offline branches and is suppressed once `isOnline === true`.

## Task Commits

Each task was committed atomically:

1. **Task 1: ProfileChip and StatCards** - `2974fe5` (feat)
2. **Task 2: useHomeCoords** - `f8a6f7d` (feat)
3. **Task 3: Rebuild src/app/(app)/index.tsx as D06 Home** - `315c9cd` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/features/presence/components/ProfileChip.tsx` / `.test.tsx` — floating chip, 6 tests
- `src/features/presence/components/StatCards.tsx` / `.test.tsx` — earnings + online-time cards, exports `formatMinutes`, 9 tests
- `src/features/presence/use-home-coords.ts` / `.test.tsx` — map seed hook, mount-only effect with an empty dependency array, 7 tests
- `src/app/(app)/index.tsx` — rebuilt D06 screen (Phase 01.1's Vehicles/Profile placeholder cards deleted; the KYC_STATUS_BADGE map and Verification card's copy strings preserved verbatim, className migrated to design tokens)
- `src/app/(app)/index.test.tsx` — 14 tests covering all routing branches and gate-derived UI state

## Decisions Made

- The Verification card's copy strings stayed verbatim per CONTEXT.md, but its className was updated from legacy `text-base font-semibold`/`text-sm` to `font-jakarta-bold`/`font-jakarta` pixel-size tokens, resolving a conflict between the plan's own reproduced interface block (which showed the old classes) and its acceptance criteria (which bans them repo-wide). See key-decisions above.
- No-vehicle gates keep a pressable (not disabled) muted "Go online" that routes to `/vehicles`, distinct from the truly disabled muted button used for KYC-blocked statuses, per UI-SPEC's Interaction Contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Verification card's legacy Tailwind classes failed the plan's own no-legacy-classes acceptance grep**
- **Found during:** Task 3 acceptance-criteria verification
- **Issue:** The plan's `<action>` block reproduced the Phase 01.1 Verification card with its original `text-base font-semibold`/`text-sm` classes (per "keep the Verification card's two copy strings unchanged"), but the same task's acceptance criteria requires `grep -rE "font-(medium|semibold|bold)\b|text-(xs|sm|base|lg|xl|2xl)\b|rounded-(md|lg|full)"` to return no matches across `index.tsx` and `src/features/presence/components`.
- **Fix:** Kept the two copy strings byte-for-byte identical; replaced only the className with the design-system's `font-jakarta-bold`/`font-jakarta` + explicit pixel sizes already used by every other D06 element (`ProfileChip`, `StatCards`).
- **Files modified:** `src/app/(app)/index.tsx`
- **Commit:** `315c9cd`

---

**Total deviations:** 1 auto-fixed (1 bug — internal plan inconsistency, not a code defect)
**Impact on plan:** None — resolved before the Task 3 commit; all acceptance-criteria greps pass.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None — no external service configuration required.

## Manual Verification Needed (plan 02-13)

- **Bottom sheet height against the map on a real screen:** the anchored sheet (`StatCards` + Verification card + control block + footer note) is sized by content, not a fixed height — confirm on a real device/emulator that it doesn't crowd out too much of the map, especially in the three-line offline-blocked branches (banner + warning strip + two buttons + footer note all stacked).
- **Whether `pt-14` clears the status bar on the test device:** the profile chip's top offset (`top-14`, i.e. 56px) is a fixed value chosen because this app has no `SafeAreaProvider` — verify it sits below the status bar/notch on the actual test device rather than under it.
- **HomeMap's own-position marker and camera-follow behavior** were already verified in plan 02-10; this plan only re-confirms `HomeMap` receives real coords from `useHomeCoords` (unit-tested here) — a real device check of the marker rendering at those coords is still plan 02-13's job, not re-litigated here.

## Next Phase Readiness

- D06 is fully composed and is the last plan of Phase 02's wave structure per this plan's frontmatter (`wave: 6`).
- Every Wave 0 screen test file listed in 02-VALIDATION.md now exists: D01–D07 and `/menu` all have passing test suites.
- Full verification gate (`npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android`) is green: 32 test suites / 230 tests passing, 0 lint errors (59 pre-existing require-import/import-order warnings, none introduced by this plan), export bundle produced cleanly.
- No files under `src/app/(auth)` or other Phase-1/1.1 areas were touched.
- Remaining phase work (if any) is plan 02-13's manual on-device verification pass; no further D06 code changes are anticipated before it.

## Self-Check: PASSED

All 7 created files and all 3 task commit hashes (`2974fe5`, `f8a6f7d`, `315c9cd`) verified present.

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-21*
