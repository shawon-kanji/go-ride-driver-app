---
phase: 02-online-offline-foreground-location-maps
plan: 03
subsystem: design-tokens
tags: [nativewind, tailwind, expo-font, plus-jakarta-sans, design-tokens, tdd]

# Dependency graph
requires: ["02-01"]
provides:
  - "rounded-control (12px) / rounded-card (16px) / rounded-pill (999px) NativeWind borderRadius classes"
  - "font-jakarta / font-jakarta-medium / font-jakarta-semibold / font-jakarta-bold / font-jakarta-extrabold NativeWind fontFamily classes, plus sans defaulting to PlusJakartaSans_400Regular"
  - "src/theme/typography.ts (PLUS_JAKARTA_SANS_FONT_MAP, fontFamilies)"
  - "src/theme/radii.ts rewritten to { control, card, pill }"
  - "Font-gated splash screen in src/app/_layout.tsx"
  - "Button shape ('rect'|'pill'), size ('compact'|'default'|'large'), testID props"
affects: ["02-06", "02-07", "02-08", "02-09", "02-10"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tailwind.config.js theme.extend.borderRadius/fontFamily as the single source NativeWind classes resolve against; src/theme/radii.ts duplicates the same numbers by hand for RN style-object APIs since tailwind.config.js is plain CJS with no TS transform"
    - "Single splash-hide gate in _layout.tsx extended (not duplicated) to also wait on useFonts — avoids a second preventAutoHideAsync/hideAsync race"
    - "Component tests read NativeWind's className prop directly (screen.getByTestId(...).props.className) rather than computed styles, since NativeWind's Jest transform does not reliably expose computed styles for custom borderRadius keys"

key-files:
  created:
    - src/theme/typography.ts
    - src/components/Button.test.tsx
  modified:
    - tailwind.config.js
    - src/theme/radii.ts
    - src/theme/colors.js
    - src/app/_layout.tsx
    - src/components/Button.tsx
    - src/components/Card.tsx
    - src/components/Badge.tsx
    - src/components/Banner.tsx
    - src/components/TextInput.tsx
    - src/components/Select.tsx
    - src/components/Stepper.tsx
    - src/components/ConfirmDialog.tsx
    - src/components/EmptyState.tsx

key-decisions:
  - "radii.ts rewritten from dead sm/md/lg/full keys to control/card/pill (12/16/999), matching the design handoff exactly; nothing imported the old keys so no migration was needed"
  - "tailwind.config.js borderRadius/fontFamily values are hand-duplicated from radii.ts/typography.ts rather than require()'d, because tailwind.config.js is plain CJS with no TS transform in this toolchain"
  - "Extended the single existing splash gate in _layout.tsx rather than adding a second preventAutoHideAsync/hideAsync pair, to avoid a race that would produce a visible system-font flash on cold start"
  - "fontError falls through to proceed (system font) rather than blocking the splash forever — a font asset failure must never lock the driver out of the app"
  - "Button's shape/size/testID additions are fully backward compatible: shape defaults to 'rect' and size to 'default', so every existing <Button label={...} onPress={...} /> caller keeps compiling and rendering unchanged"
  - "Split the original planned single onPress/disabled test into two single-render tests to avoid RNTL 'overlapping act() calls' warnings/contamination from two render() calls inside one test body"
  - "ActivityIndicator now accepts an optional testID (`${testID}-spinner`) so the loading state is queryable in tests, since RNTL v14 in this repo has no UNSAFE_getByType/type-based query helpers"

requirements-completed: [PRES-01]

# Metrics
duration: 10min
completed: 2026-08-20
---

# Phase 02 Plan 03: App-Wide Design Tokens — Radii & Plus Jakarta Sans Summary

**Wired the previously-dead `radii.ts` token file into `tailwind.config.js` (control:12/card:16/pill:999), gated the splash screen on Plus Jakarta Sans font loading via `useFonts`, and retokenised all nine shared `src/components/` primitives — including a TDD'd `Button` shape/size/testID extension — off Tailwind's stock radii/weight utilities onto the new semantic classes.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-20T13:56:00Z
- **Completed:** 2026-08-20T14:05:30Z
- **Tasks:** 3 (Task 3 executed as TDD: RED then GREEN, plus a mechanical retokenisation sub-step)
- **Files modified:** 14 (2 created, 12 modified)

## Accomplishments

- `tailwind.config.js` now carries `theme.extend.borderRadius = { control: '12px', card: '16px', pill: '999px' }` and six `fontFamily` keys (`jakarta`, `jakarta-medium`, `jakarta-semibold`, `jakarta-bold`, `jakarta-extrabold`, `sans`) — previously only `colors` was wired in, so `radii.ts` was confirmed dead code (RESEARCH.md Pitfall 1) until this plan
- `src/theme/radii.ts` rewritten from stale `sm/md/lg/full` (6/10/16/9999) to `control/card/pill` (12/16/999); nothing imported the old file, so no callers needed migration
- New `src/theme/typography.ts` exports `PLUS_JAKARTA_SANS_FONT_MAP` (the exact object `useFonts()` wants) and `fontFamilies` (string constants for RN style-object APIs); export names confirmed against plan 02-01's SUMMARY (`PlusJakartaSans_400Regular` through `_800ExtraBold`)
- `src/theme/colors.js`'s stale "Placeholder palette" header comment replaced with the confirmed source-of-truth note; zero hex values changed (`git diff` on that file touches comment lines only)
- `src/app/_layout.tsx`'s single existing splash gate extended with `useFonts(PLUS_JAKARTA_SANS_FONT_MAP)`; the hide-effect now depends on `[status, fontsLoaded, fontError]` and the early return is `status === 'unknown' || (!fontsLoaded && !fontError)` — a font load error falls through to the system font rather than hanging the splash forever
- `Button.tsx` gained `shape?: 'rect' | 'pill'` (default `'rect'`), `size?: 'compact' | 'default' | 'large'` (default `'default'`), and `testID?: string`, all backward-compatible; `Button.test.tsx` created first (RED, 6 failing assertions across the 7 test cases below split from the original 6), then implementation made it green
- All nine shared components (`Button`, `Card`, `Badge`, `Banner`, `TextInput`, `Select`, `Stepper`, `ConfirmDialog`, `EmptyState`) now use `rounded-control`/`rounded-card`/`rounded-pill` and explicit `font-jakarta*` family classes; zero `rounded-md`/`rounded-lg`/`rounded-full`/`font-medium`/`font-semibold`/`font-bold` remain under `src/components/`
- Full verification gate green: `npx tsc --noEmit && npx expo lint && npx jest --watchAll=false` (9 suites / 38 tests) plus `npx expo export --platform android` (confirmed to bundle all Plus Jakarta Sans weights when `MAP_API_KEY` is present in the shell env — see Deviations)

## New Classes Available to Later Plans

```
rounded-control   -> 12px      font-jakarta            -> PlusJakartaSans_400Regular
rounded-card      -> 16px      font-jakarta-medium     -> PlusJakartaSans_500Medium
rounded-pill      -> 999px     font-jakarta-semibold   -> PlusJakartaSans_600SemiBold
                                font-jakarta-bold       -> PlusJakartaSans_700Bold
                                font-jakarta-extrabold  -> PlusJakartaSans_800ExtraBold
                                sans (default)          -> PlusJakartaSans_400Regular
```

`src/theme/radii.ts` exports `{ control: 12, card: 16, pill: 999 }` for RN APIs needing numeric px values (e.g. `borderRadius` on a `style` object, SVG corner radii) rather than a className.

## Button's New Props

```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'; // default 'primary'
  shape?: 'rect' | 'pill';   // default 'rect'    — NEW
  size?: 'compact' | 'default' | 'large'; // default 'default' — NEW
  loading?: boolean;
  disabled?: boolean;
  testID?: string;          // NEW — also passed to the loading ActivityIndicator as `${testID}-spinner`
}
```
`shape='rect'` -> `rounded-control`; `shape='pill'` -> `rounded-pill`. Sizes map to `min-h-[36px]` / `min-h-[48px]` / `min-h-[54px]` with matching padding and label text sizes (13/15/17px). The design deliberately uses both shapes across screens (rect for form-submission CTAs, pill for confirmation/status CTAs) — this plan does not standardise on one shape.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire radii and Plus Jakarta Sans families into tailwind.config.js** - `2f92ce7` (feat)
2. **Task 2: Load Plus Jakarta Sans inside the existing splash-screen gate** - `cdac597` (feat)
3. **Task 3: Retokenise the nine shared components and add Button's shape/size props** - TDD split into:
   - `b13954a` (test, RED) — `Button.test.tsx` written first, confirmed 6/6 failing against the pre-change `Button.tsx`
   - `a5b539d` (feat, GREEN) — `Button.tsx` implementation, all tests passing
   - `d30e76e` (refactor) — mechanical retokenisation of the remaining eight components (`Card`, `Badge`, `Banner`, `TextInput`, `Select`, `Stepper`, `ConfirmDialog`, `EmptyState`) per the plan's exact replace-table, no layout/spacing/colour changes

**Plan metadata:** committed after this summary (docs: complete plan)

## Files Created/Modified

- `tailwind.config.js` — added `borderRadius` (control/card/pill) and `fontFamily` (jakarta + 4 weights + sans) to `theme.extend`
- `src/theme/radii.ts` — rewritten to `{ control: 12, card: 16, pill: 999 }`
- `src/theme/typography.ts` (new) — `PLUS_JAKARTA_SANS_FONT_MAP`, `fontFamilies`
- `src/theme/colors.js` — stale header comment fixed; zero colour values changed
- `src/app/_layout.tsx` — splash gate extended to also wait on `useFonts`
- `src/components/Button.tsx` — `shape`/`size`/`testID` props, `font-jakarta-bold` label
- `src/components/Button.test.tsx` (new) — 7 behaviour tests (default shape, pill shape, 3 sizes, press, disabled, loading, label font)
- `src/components/Card.tsx` — `rounded-lg` -> `rounded-card`
- `src/components/Badge.tsx` — `rounded-full` -> `rounded-pill`; `text-xs font-medium` -> `text-[12px] font-jakarta-bold`
- `src/components/Banner.tsx` — `rounded-md` -> `rounded-control`; message/dismiss text retokenised
- `src/components/TextInput.tsx` — label + input retokenised, input also gains `min-h-[52px]` and a `1.5px` border per the plan's exact replace string
- `src/components/Select.tsx` — label, trigger, dropdown panel, and selected-option text retokenised
- `src/components/Stepper.tsx` — label, control container, +/- buttons, and value text retokenised
- `src/components/ConfirmDialog.tsx` — `rounded-lg` -> `rounded-card`; title/message text retokenised; stays a centred `Modal` (unchanged structure — the D07 bottom sheet is a separate primitive built in plan 02-09)
- `src/components/EmptyState.tsx` — title/message text retokenised

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RNTL v14 has no `UNSAFE_getByType`/type-based query helpers on `screen` or the render result**
- **Found during:** Task 3, writing the loading-state test
- **Issue:** The plan's behaviour spec implied querying for an `ActivityIndicator` element type directly; this RNTL version's `screen`/render-result API (checked directly in `node_modules/@testing-library/react-native/dist/queries/`) only exposes text/testID/role/label/hint/placeholder/display-value queries, no type-based query
- **Fix:** Gave `Button.tsx`'s `ActivityIndicator` an optional `testID={`${testID}-spinner`}` (only set when the caller passes a `testID`), and asserted on that testID instead
- **Files modified:** `src/components/Button.tsx`, `src/components/Button.test.tsx`
- **Committed in:** `a5b539d`

**2. [Rule 1 - Bug] Original single "press + disabled" test caused RNTL `act()` overlap contamination into later tests**
- **Found during:** Task 3, GREEN run
- **Issue:** A single test body calling `render()` twice in sequence (once for the enabled case, once for the disabled case) without an intervening `cleanup()` produced "overlapping act() calls" console errors and left the next two tests unable to find their own elements (`Unable to find an element with testID: btn-spinner` / `Unable to find an element with text: Sign in`) even though each test passed in isolation
- **Fix:** Split into two separate `it()` blocks (`calls onPress once when pressed` / `never calls onPress when disabled`), each with exactly one `render()` call, relying on RNTL's automatic `afterEach(cleanup)` between tests
- **Files modified:** `src/components/Button.test.tsx`
- **Committed in:** `a5b539d`

**Total deviations:** 2 auto-fixed (both Rule 1/3, test-infrastructure only — no production behaviour changed beyond what the plan specified)
**Impact on plan:** No scope creep. Both fixes are confined to the test file plus one additive, backward-compatible `testID` prop on the `ActivityIndicator` that was already implied by "pass testID through" in the plan's action text.

## Issues Encountered

**`npx expo export --platform android` does not auto-load `.env`, unlike `npx expo lint`/`expo start`.** Investigated: `node_modules/expo/node_modules/@expo/cli/build/src/export/resolveOptions.js` calls `getConfig` directly with no `@expo/env` `loadEnvConfig` call beforehand, unlike other Expo CLI commands. This is pre-existing behavior of `app.config.js` (authored in plan 02-01) interacting with this specific Expo CLI command — not caused by anything touched in this plan (Tasks 1-3 never modified `app.config.js` or `.env`). Confirmed the export itself succeeds and correctly bundles all Plus Jakarta Sans font weights once `MAP_API_KEY` is exported into the shell environment manually (`export $(grep -v '^#' .env | xargs)`) before running the command. Logged here rather than fixed, since it is outside this plan's file-modification scope (deferred-items candidate for whichever later plan owns CI/build tooling, if any).

## User Setup Required

None new. (Plan 02-01's Google Maps Platform / KYC-approved-driver setup notes still apply for later device-verification plans, unrelated to this plan's scope.)

## Next Phase Readiness

- `rounded-control`/`rounded-card`/`rounded-pill` and all five `font-jakarta*` classes plus `sans` are available for immediate use by any screen-level JSX
- `Button`'s `shape`/`size`/`testID` props are ready for D06/D07-style pill CTAs and compact utility buttons
- **Outstanding:** screen-level `font-*`/`rounded-*` migrations *outside* `src/components/` (i.e. inline classes in screen files under `src/app/`) are NOT covered by this plan and are explicitly deferred to plans 02-06, 02-07, 02-08, and 02-10
- Visual confirmation that `rounded-control`/`rounded-card`/`rounded-pill` truly resolve to 12/16/999px on a real device is manual-only (per 02-VALIDATION.md) and folded into plan 02-11's device checkpoint — not attempted here

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All created files verified present on disk (`src/theme/typography.ts`, `src/components/Button.test.tsx`, this SUMMARY.md); all five task commit hashes (`2f92ce7`, `cdac597`, `b13954a`, `a5b539d`, `d30e76e`) verified present in git history.
