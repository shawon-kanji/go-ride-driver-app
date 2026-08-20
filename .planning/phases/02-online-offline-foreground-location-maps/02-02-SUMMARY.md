---
phase: 02-online-offline-foreground-location-maps
plan: 02
subsystem: ui
tags: [expo-router, navigation, routing, typescript]

# Dependency graph
requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "Plan 02-01 groundwork (deps, geo utils, expo mocks, app.config.js)"
provides:
  - "Flattened, tab-less route tree under src/app/(app)/ with no (tabs) route group"
  - "app/(app)/_layout.tsx that auto-registers sibling routes with no explicit Stack.Screen children"
  - "All in-app navigation rewritten to bare flattened hrefs (/verify, /vehicles, /profile, etc.)"
affects: [02-03, 02-04, 02-menu-plan, 02-home-plan]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Expo Router: <Stack /> with no explicit <Stack.Screen> children auto-registers every sibling route file"
    - "Route groups (parenthesized dirs) never appear in the URL — always use the flattened href form, never a group-qualified one"

key-files:
  created: []
  modified:
    - src/app/(app)/_layout.tsx
    - src/app/(app)/index.tsx
    - src/app/(app)/vehicles/_layout.tsx
    - src/app/(app)/vehicles/index.tsx
    - src/app/(app)/vehicles/new.tsx
    - src/app/(app)/vehicles/[id].tsx
    - src/app/(app)/verify/_layout.tsx
    - src/app/(app)/verify/index.tsx
    - src/app/(app)/verify/[documentType].tsx
    - src/app/(app)/profile/_layout.tsx
    - src/app/(app)/profile/index.tsx
    - src/app/(app)/profile/edit.tsx
    - src/features/vehicles/components/VehicleListEmptyState.tsx
    - src/features/profile/components/ProfileView.tsx

key-decisions:
  - "Used git mv for every file move to preserve history, per plan instruction"
  - "Regenerated .expo/types/router.d.ts by running `npx expo start --clear` and confirmed via mtime + grep that (tabs) fully disappeared before running tsc"

patterns-established:
  - "Any future plan that adds a new route file under src/app/(app)/ must re-run `npx expo start` briefly before `tsc` will accept a router.push to it — .expo/types/router.d.ts is a gitignored, dev-server-only artifact"

requirements-completed: [PRES-01]

# Metrics
duration: 8min
completed: 2026-08-20
---

# Phase 02 Plan 02: Flatten (tabs) Route Tree Summary

**Deleted the `(tabs)` route group entirely and moved index/vehicles/verify/profile to sit directly under `src/app/(app)/`, rewriting all 10 stale `(tabs)`-qualified route literals to their flattened form.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-20T13:46:00Z
- **Completed:** 2026-08-20T13:54:39Z
- **Tasks:** 2 completed
- **Files modified:** 14 (12 route files + 2 feature components), plus 1 gitignored artifact regenerated (`.expo/types/router.d.ts`)

## Accomplishments
- `src/app/(app)/(tabs)/` deleted entirely (including the `<Tabs>` layout) — Home is now the sole top-level screen, matching the CONTEXT.md-locked "menu-based nav" decision
- All 12 route files (`index.tsx`, `vehicles/*`, `verify/*`, `profile/*`) moved via `git mv` to `src/app/(app)/` with import depths corrected for the one-level-shallower directory structure
- `src/app/(app)/_layout.tsx` rewritten to a bare `<Stack screenOptions={{ headerShown: false }} />` with no explicit `<Stack.Screen>` children, so later plans (D03 `/menu`, D06 `/` retrofit) can add sibling routes without touching this file
- All 10 stale `/(app)/(tabs)/X` route literals across 6 files rewritten to the flattened `/X` form
- `.expo/types/router.d.ts` regenerated via `npx expo start --clear`, confirmed to contain zero `(tabs)` references and to expose the new flattened path literals (`/vehicles/new`, `/verify/[documentType]`, `/profile/edit`, etc.)

## Task Commits

Each task was committed atomically:

1. **Task 1: Move the four route trees out of (tabs) and fix import depths** - `384f96a` (feat)
2. **Task 2: Rewrite all 10 stale (tabs) route literals to their flattened form** - `a3201a5` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/app/(app)/_layout.tsx` - Bare `<Stack>` with no explicit `Stack.Screen` children; `SessionExpiryBanner` unchanged
- `src/app/(app)/index.tsx` - Moved from `(tabs)/index.tsx`; import depths shortened by one level; 3 route literals flattened
- `src/app/(app)/vehicles/_layout.tsx`, `vehicles/index.tsx`, `vehicles/new.tsx`, `vehicles/[id].tsx` - Moved from `(tabs)/vehicles/*`; import depths fixed; 4 route literals flattened across `index.tsx` and `[id].tsx`
- `src/app/(app)/verify/_layout.tsx`, `verify/index.tsx`, `verify/[documentType].tsx` - Moved from `(tabs)/verify/*`; import depths fixed; 3 route literals flattened in `index.tsx`
- `src/app/(app)/profile/_layout.tsx`, `profile/index.tsx`, `profile/edit.tsx` - Moved from `(tabs)/profile/*`; import depths fixed (no route literals in these files)
- `src/features/vehicles/components/VehicleListEmptyState.tsx` - 1 route literal flattened (`/vehicles/new`)
- `src/features/profile/components/ProfileView.tsx` - 1 route literal flattened (`/profile/edit`)

## Decisions Made
- Followed the plan's exact file-move and literal-rewrite tables with no deviation from the specified mapping.
- Regenerated the typed-routes declaration file by running `npx expo start --clear` in the background, polling for the dev-server ready banner and the `.expo/types/router.d.ts` mtime change, then stopping the server — confirmed via `grep -c "(tabs)"` returning 0 before treating `tsc` as a meaningful signal (per RESEARCH.md Pitfall 2 / prior Phase 01.1 lesson already logged in STATE.md).

## Deviations from Plan

None - plan executed exactly as written. All 12 route files, the layout rewrite, and all 10 route-literal replacements match the plan's interfaces and replacement tables exactly.

## Issues Encountered
- `npx expo export --platform android` initially failed with `MAP_API_KEY is missing` even though `.env` contains the key — `npx expo start` loads `.env` automatically (confirmed via its "env: load .env" log line) but a bare `npx expo export` invocation in this shell did not pick it up from `.env` on the first try. Re-ran with the env vars passed explicitly (`env $(grep -v '^#' .env | xargs) npx expo export --platform android`) and the export succeeded cleanly, producing a bundled Android output with no missing-module or route-resolution errors — confirming the flattened route tree bundles correctly. This is a pre-existing environment/dotenv-loading quirk unrelated to the route restructure in this plan (out of scope per the deviation rules' scope boundary), not a regression introduced by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The route tree is now flat, tab-less, and fully verified (`tsc`, `expo lint`, `jest`, `expo export --platform android` all pass).
- Any later plan in this phase that adds a new sibling route file (e.g., D03's `/menu`) must re-run `npx expo start` briefly before `tsc` will accept a `router.push` to that new route — `.expo/types/router.d.ts` is gitignored and only produced by the dev-server file watcher.
- `src/app/(app)/_layout.tsx` has no explicit `<Stack.Screen>` children by design, so new route files auto-register without further edits to this layout.

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All 14 modified/created files confirmed present on disk. Both task commits (`384f96a`, `a3201a5`) confirmed in git log.
