---
phase: 02-online-offline-foreground-location-maps
plan: 07
subsystem: ui
tags: [nativewind, react-hook-form, lucide-react-native, auth, jest, testing-library]

requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "Button 9-variant/size system, ScreenHeader, SectionCard, createLucideMock (plan 02-06); design tokens (plan 02-03)"
provides:
  - "TextInput with focus-aware border, inline errorText, and a password reveal toggle"
  - "D01 Sign in retrofitted to the mockup: indigo brand header, Welcome back heading, keystore note, 54px Sign in CTA"
  - "D02 Create account retrofitted to the mockup: ScreenHeader, two-column name row, indigo info banner, 54px Continue CTA"
affects: [02-09-vehicle-form, auth]

tech-stack:
  added: []
  patterns:
    - "TextInput's errorText/revealToggle props are the shared field contract every later form (D05 vehicle form, plan 02-09) should reuse rather than re-deriving focus/error/reveal styling"
    - "RNTL v14's fireEvent (not just render/rerender) must be awaited when the fired event triggers a state update the next query depends on"

key-files:
  created:
    - src/components/TextInput.test.tsx
  modified:
    - src/components/TextInput.tsx
    - src/app/(auth)/login.tsx
    - src/app/(auth)/signup.tsx
    - src/features/auth/components/LoginForm.tsx
    - src/features/auth/components/SignupForm.tsx

key-decisions:
  - "TextInput's onFocus/onBlur are destructured out of the TextInputProps spread and re-invoked inside internal wrapper handlers, so react-hook-form's Controller-supplied onBlur keeps firing while the component also tracks its own focus state for the border colour"
  - "RNTL v14's fireEvent must be awaited (like render/rerender) whenever the assertion that follows depends on the state update the event triggers — confirmed via isolated debug tests before fixing TextInput.test.tsx's focus/blur and reveal-toggle assertions"
  - "SignupForm's info banner is a purpose-built View (bg-primary-50 + Info icon), not the shared Banner component, since Banner owns its own margin and left border that the mockup does not use here"
  - "Login failure copy is now 401-specific ('Email or password is incorrect.') while every other ApiError still surfaces error.message and non-ApiError errors fall back to 'Unable to sign in.'"

requirements-completed: [PRES-01]

duration: 10min
completed: 2026-08-20
---

# Phase 02 Plan 07: D01/D02 Auth Retrofit and Shared TextInput Field Treatment Summary

**Focus-aware TextInput (52px, 2px indigo focus ring, inline errorText, Eye/EyeOff reveal toggle) plus D01 Sign in and D02 Create account rebuilt to `Driver App.dc.html`'s own layout, copy, and colour usage.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-20T14:29:13Z
- **Completed:** 2026-08-20T14:39:00Z
- **Tasks:** 3
- **Files modified:** 6 (1 new test file, 5 modified)

## Accomplishments
- `TextInput` now supports `errorText` and `revealToggle` on top of its existing `label`/`TextInputProps` contract, with a 2px `primary-500` focus border (1.5px `neutral-300` resting, `danger-500` when `errorText` is set) — covered by 6 new tests
- D01 (`login.tsx`) rebuilt with the indigo brand header block (wordmark, "Welcome back" heading, shift/session subtext), the mockup's "New driver? / Create an account" footer copy, and a pinned device-keystore note; session-expiry banner logic and the signup email handoff preserved verbatim
- D02 (`signup.tsx`) rebuilt with `ScreenHeader`, a two-column first/last name row, a revealable password field with inline "Use at least 8 characters." validation, and an indigo info banner with the mockup's exact account-only copy; the signup-succeeded/login-failed redirect preserved verbatim
- Both CTAs are now `size="large"` (54px) `Button`s ("Sign in" / "Continue")

## Task Commits

Each task was committed atomically:

1. **Task 1: TextInput focus state, inline error text, and password reveal toggle** - `90e6867` (feat)
2. **Task 2: D01 Sign in retrofit** - `fa0aeb6` (feat)
3. **Task 3: D02 Create account retrofit** - `3a26c26` (feat)

**Plan metadata:** committed with this SUMMARY.md, STATE.md, and ROADMAP.md updates.

## Files Created/Modified
- `src/components/TextInput.tsx` - Adds `errorText`, `revealToggle`, `testID`; focus/blur state drives border colour; `onFocus`/`onBlur` re-invoked so Controller wiring is unbroken
- `src/components/TextInput.test.tsx` - 6 tests: base classes, focus/blur border swap, errorText presence/absence, reveal-toggle secureTextEntry flip, no-toggle-when-unset, onChangeText passthrough
- `src/app/(auth)/login.tsx` - Indigo brand header, ScrollView body, footer link row, pinned keystore note; `bg-neutral-0` root instead of centred `bg-white`
- `src/features/auth/components/LoginForm.tsx` - "Sign in" CTA at `size="large"`, `revealToggle` on the password field, 401-specific error copy
- `src/app/(auth)/signup.tsx` - `ScreenHeader` top bar, `SignupForm` body, hairline-separated footer with "Already registered? / Sign in"
- `src/features/auth/components/SignupForm.tsx` - Two-column name row, revealable password field with inline `errorText`, indigo info banner, "Continue" CTA at `size="large"`

## Decisions Made
See `key-decisions` in frontmatter. Most notable: RNTL v14's `fireEvent` needed `await` in the same way `render`/`rerender` already did in this repo — confirmed by isolated debug tests (a bare `RNTextInput` with `onFocus` worked unawaited when only asserting the mock was called, but failed to reflect a dependent state update in the next query until awaited).

## Deviations from Plan

None - plan executed exactly as written. All acceptance-criteria greps, `npx tsc --noEmit`, `npx expo lint`, `npx jest --watchAll=false` (122/122 tests across 20 suites), and `npx expo export --platform android` all passed.

## Issues Encountered
- `npx expo export --platform android` failed on the first run because `MAP_API_KEY` was not exported into the shell environment (this Expo CLI command does not auto-load `.env`, a known behavior already documented in STATE.md from plan 02-03). Exported `MAP_API_KEY` from `.env` into the shell before re-running; export then succeeded. Not a code issue, no files changed for this.
- `TextInput.test.tsx`'s focus/blur and reveal-toggle assertions initially failed even though the component's `onFocus`/`onBlur`/`onPress` handlers were firing correctly (confirmed via `console.log`). Root cause: RNTL v14's `fireEvent` (like `render`/`rerender`) returns a promise that must be `await`ed before the next query reflects the state update it triggers. Fixed by awaiting all three `fireEvent` calls in the test file — a same-file test-isolation fix within Task 1, not a plan deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `TextInput`'s `errorText`/`revealToggle` contract is ready for plan 02-09's D05 vehicle form to reuse directly
- D01/D02 visual retrofit is isolated to this plan/wave per CONTEXT.md's "Visual rollout scope" decision — no regression risk to the location/map work in the remaining Phase 2 waves
- No blockers identified

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All 7 claimed files and all 3 task commit hashes (90e6867, fa0aeb6, 3a26c26) verified present.
