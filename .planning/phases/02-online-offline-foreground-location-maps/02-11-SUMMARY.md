---
phase: 02-online-offline-foreground-location-maps
plan: 11
subsystem: ui
tags: [react-native, nativewind, expo-router, lucide-react-native, jest, testing-library]

# Dependency graph
requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "Plan 02-02's flattened (app) route tree with auto-registering sibling routes; plan 02-04's deriveOnlineGate; plan 02-06's Button/SectionCard/lucide-mock primitives; plan 02-08's verification-summary.ts (summariseTrack/describeVerificationBlockers)"
provides:
  - "MenuRow: a reusable 56px-min menu row with icon chip, title/subtitle, optional danger/success badge, chevron, and a greyed non-interactive coming-soon state"
  - "/menu — D03 Menu screen: indigo profile header (initials + name + gate-derived status line), conditional warning banner, 'Get ready to drive' and 'Your work' SectionCard groups, single-tap Log out"
  - "Typed route registration for /menu (regenerated .expo/types/router.d.ts) so plan 02-12's router.push('/menu') will compile"
  - "metro.config.js resolver.blockList entry excluding *.test.* files from Metro bundling, fixing a real (not previously encountered) expo export break caused by co-locating a screen's *.test.tsx inside src/app"
affects: [D06-home-profile-chip]

tech-stack:
  added: []
  patterns:
    - "MenuRow is presentational only (no useQuery/router imports) — screens own all data derivation and navigation, MenuRow just renders what it's given"
    - "Coming-soon rows omit onPress entirely rather than passing a no-op — MenuRow derives its own disabled/dimmed/no-chevron treatment from onPress's absence"

key-files:
  created:
    - src/features/menu/components/MenuRow.tsx
    - src/features/menu/components/MenuRow.test.tsx
    - src/app/(app)/menu.tsx
    - src/app/(app)/menu.test.tsx
  modified:
    - metro.config.js

key-decisions:
  - "MenuRow's badge tone->Badge variant mapping is danger->'blocked', success->'active' — reuses Badge.tsx's existing four-variant vocabulary rather than adding new tokens"
  - "Header status line strings are locked exactly as: 'Account active · ready to drive' (gate.status === 'ready') and 'Account active · not yet cleared to drive' (every other gate status) — D06's profile chip (plan 02-12) must reuse these verbatim if it echoes status, not invent a variant"
  - "metro.config.js resolver.blockList now excludes /\\.test\\.[jt]sx?$/ project-wide — Expo Router's require.context (src/_ctx.*.js) only excludes +api/+html/+middleware by convention, so any *.test.tsx co-located inside src/app is otherwise auto-registered as its own route AND bundled into the production build, pulling @testing-library/react-native's Node-only console polyfill into the Metro graph and hard-failing `expo export`. Jest resolves test files via jest.config.js independently and is unaffected by this Metro-only exclusion."

patterns-established:
  - "Any future screen test file placed inside src/app/(app)/ (sibling to the route it tests, per this plan's own convention) is now safe by construction — the blockList fix is project-wide, not menu-specific"

requirements-completed: [PRES-01]

# Metrics
duration: ~20min
completed: 2026-08-21
---

# Phase 02 Plan 11: D03 Menu Screen at /menu Summary

**New `/menu` route: indigo profile header, gate-derived warning banner, two SectionCard groups (Verification/Vehicles/Profile live, Earnings/Trip history/Settings inert), single-tap Log out — plus a real metro.config.js fix for a Metro/Expo-Router test-file bundling collision this plan's own file layout exposed.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `MenuRow` — one component covers the three interactive "Get ready to drive" rows, their badge variants, and the three greyed/chevron-less "Your work" coming-soon rows, at 8/8 tests green
- `/menu` screen composes `deriveOnlineGate` + `describeVerificationBlockers` (both plan 02-04/02-08 exports, not re-derived) into the header status line, warning banner, and Verification badge — 11/11 tests green
- `.expo/types/router.d.ts` regenerated via `expo start --clear`; `/menu` is now a valid typed `Href`, unblocking plan 02-12's `router.push('/menu')`
- Log out is the existing `useLogout()` verbatim — no duplicated `setOnlineStatus(false)` call, no confirmation modal
- Found and fixed a real Metro/Expo-Router bundling bug (see Deviations) rather than working around it by relocating the test file, since the plan's own file layout (test file co-located inside `src/app/(app)/`) is the pattern future D06/D07-adjacent screens will likely reuse

## Task Commits

Each task was committed atomically:

1. **Task 1: MenuRow with badge, subtitle, and a greyed coming-soon state** - `d4322cd` (feat)
2. **Task 2: The D03 Menu screen at /menu** - `6c386b7` (feat, includes the metro.config.js fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/features/menu/components/MenuRow.tsx` - Presentational row: icon chip, title/subtitle, badge, chevron; disabled branch when `onPress` is omitted
- `src/features/menu/components/MenuRow.test.tsx` - 8 tests: title/subtitle render, press behavior with/without onPress, chevron presence, both badge tones, min-height class
- `src/app/(app)/menu.tsx` - D03 Menu screen; composes `useProfileQuery`/`useVehiclesQuery`/`useKycStatusQuery`, `deriveOnlineGate`, `summariseTrack`, `describeVerificationBlockers`, `useLogout`
- `src/app/(app)/menu.test.tsx` - 11 tests: identity/initials render, ready vs blocked status line and banner, badge conditionality (verification + vehicles), routing for all three live rows, coming-soon rows render/inert/no-subtitle, logout single-tap with no modal, back control
- `metro.config.js` - Added `resolver.blockList` entry for `*.test.*` files (see Deviations)

## Decisions Made
- Header status-line copy locked to `"Account active · ready to drive"` / `"Account active · not yet cleared to drive"` — D06's profile chip should reuse these strings if it surfaces gate status, per the plan's own output note.
- Badge tone mapping (`danger` -> `blocked`, `success` -> `active`) reuses `Badge.tsx`'s existing variant vocabulary rather than adding a fifth variant.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `expo export --platform android` failed after adding `menu.test.tsx` inside `src/app/(app)/`**
- **Found during:** Task 2 verification (`npx expo export --platform android`)
- **Issue:** Expo Router's `require.context` (`node_modules/expo-router/_ctx.android.js`) auto-registers every `.tsx`/`.ts` file under `src/app` as a route, excluding only `+api`/`+html`/`+middleware` by convention — there is no built-in exclusion for Jest test files. Because this plan's own action block specifies co-locating `menu.test.tsx` as a sibling of `menu.tsx` inside the route directory (the same pattern D01/D02/D04/D05 avoided since none of those screens had `.test.tsx` files living inside `src/app`), Expo Router picked it up as its own `/menu.test` route and Metro tried to bundle it for production, pulling in `@testing-library/react-native/dist/helpers/logger.js`'s `require("console")` (a Node built-in with no React Native equivalent) and hard-failing the bundle with `Unable to resolve module console`.
- **Fix:** Added a `resolver.blockList` entry to `metro.config.js` (`/\.test\.[jt]sx?$/`, appended to the existing default blockList array) so Metro excludes all `*.test.*` files from module resolution project-wide. This only affects Metro's bundling graph (`expo start`/`expo export`) — Jest resolves test files independently via `jest.config.js` and required zero changes.
- **Files modified:** `metro.config.js`
- **Verification:** `MAP_API_KEY=test npx expo export --platform android` now exits 0 and produces a clean bundle; re-ran `expo start --clear` afterward to confirm `.expo/types/router.d.ts` still contains `/menu`.
- **Committed in:** `6c386b7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for `expo export` to succeed at all; the fix is generic (not menu-specific) so it also protects any future plan that co-locates a screen test file inside `src/app`.

## Issues Encountered
- The typed-routes CLI generator (a separate code path from Metro's bundler) still lists `/menu.test` as a valid `Href` in `.expo/types/router.d.ts` even after the `metro.config.js` blockList fix — this is a cosmetic TypeScript-only artifact (the route is not actually reachable at runtime since Metro excludes the module from the bundle) and was left as-is rather than chased further, since the plan's acceptance criteria only requires `/menu` to be present, not `/menu.test` to be absent.
- RNTL v14's `fireEvent.press` needed `await` on the row-press assertions in `menu.test.tsx` (per the standing repo convention) — without it, back-to-back `fireEvent.press` calls across sequential tests produced "overlapping act() calls" warnings and caused a later test's `render()` to come back empty. Fixed by awaiting every `fireEvent.press` call in the new test file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/menu` is a real, typed, registered route. Plan 02-12 (D06 Home) can compile `router.push('/menu')` from its profile chip immediately.
- `MenuRow`'s prop signature (`icon`, `title`, `subtitle?`, `badge?: { label, tone: 'danger'|'success' }`, `onPress?`, `testID?`) and the exact header status-line strings are recorded above for D06 consistency.
- Full verification gate (`npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android`) is green: 28 test suites / 194 tests passing, 0 lint errors (48 pre-existing require-import/import-order warnings, none introduced by this plan), export bundle 6.7MB.
- No files under `src/app/(auth)` or other Phase-1/1.1 areas were touched.

## Self-Check: PASSED

All 4 created files and both task commit hashes (`d4322cd`, `6c386b7`) verified present.

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-21*
