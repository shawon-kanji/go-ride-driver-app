---
phase: 02-online-offline-foreground-location-maps
plan: 06
subsystem: ui
tags: [react-native, nativewind, lucide-react-native, jest, testing-library]

# Dependency graph
requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "Plan 02-03's retokenised Button/Card/Badge components and the design-token layer (rounded-card, rounded-control, rounded-pill, font-jakarta-*)"
provides:
  - "Button with nine variants (primary, secondary, destructive, ghost, tonal, dark, muted, success, destructive-outline) covering every CTA fill used across D01-D07"
  - "ScreenHeader shared top-bar component (back chevron, 17px/800 title, right slot)"
  - "SectionCard shared bordered container with uppercase eyebrow header row"
  - "createLucideMock() Jest mock factory in src/test-utils/expo-mocks.ts for icon-bearing component tests"
affects: [D03-menu, D04-kyc-documents, D05-vehicles, D06-online-toggle, D07-dashboard]

tech-stack:
  added: []
  patterns:
    - "Per-variant VARIANT_SPINNER_COLOR lookup on Button replaces a single ternary, so ActivityIndicator colour always tracks the variant's text colour rather than assuming a dark fill"
    - "SectionCard is a deliberate sibling to Card.tsx, not a variant of it — Card owns 16px all-side padding, SectionCard needs full-bleed child rows for row dividers to reach the card edge"
    - "createLucideMock() returns a Proxy so any icon name resolves to a testID-bearing View (`icon-<Name>`), keeping component tests independent of which specific lucide glyphs a screen imports"

key-files:
  created:
    - src/components/ScreenHeader.tsx
    - src/components/ScreenHeader.test.tsx
    - src/components/SectionCard.tsx
    - src/components/SectionCard.test.tsx
  modified:
    - src/components/Button.tsx
    - src/components/Button.test.tsx
    - src/test-utils/expo-mocks.ts
    - src/test-utils/expo-mocks.test.ts

key-decisions:
  - "Verified all 22 lucide-react-native (v1.33.0) icon names referenced by upcoming Phase 2 plans (Truck, ChevronLeft, ChevronRight, AlertTriangle, TriangleAlert, LogOut, MapPin, Check, X, Eye, EyeOff, Info, Plus, Lock, Car, Wallet, Clock, Settings, ShieldCheck, User, Crosshair, CircleAlert) resolve to real exports — no renames needed, so no substitution list is required for plans 02-07 through 02-12"
  - "muted Button variant has no active: class, matching UI-SPEC's non-interactive greyed Go online / unavailable Activate treatment"

patterns-established:
  - "Nine-variant Button union is the canonical CTA surface for the rest of Phase 2 — no later plan should add another ad-hoc fill to Button.tsx"
  - "ScreenHeader/SectionCard are the canonical D03/D04/D05 header and menu/document-list containers"

requirements-completed: [PRES-01]

duration: 9min
completed: 2026-08-20
---

# Phase 02 Plan 06: Shared Button Fills, ScreenHeader, SectionCard, and Lucide Jest Mock Summary

**Extended Button to nine variants covering every D01-D07 CTA fill, added ScreenHeader and SectionCard shared primitives, and added a Proxy-based lucide-react-native Jest mock factory — all unit-tested, no `src/app/` files touched.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-08-20T14:23:27Z
- **Completed:** 2026-08-20T14:32:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- `Button.tsx`'s `Variant` union grew from 4 to 9 members (`tonal`, `dark`, `muted`, `success`, `destructive-outline` added), each backed by a real UI-SPEC colour requirement and a per-variant `VARIANT_SPINNER_COLOR` entry
- New `ScreenHeader` and `SectionCard` shared components give D03/D04/D05 one tested source for the identical top bar and bordered/eyebrow section container instead of three hand-rolled copies
- `createLucideMock()` lets every future icon-bearing component test avoid loading `react-native-svg`'s native module under Jest
- Verified the real `lucide-react-native` export names every later plan needs — all 22 requested names resolved with no renames required

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Button with the five remaining design fills, and add the lucide Jest mock** - `714e4ae` (feat)
2. **Task 2: ScreenHeader and SectionCard shared primitives** - `873e6d8` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/components/Button.tsx` - Added `tonal`, `dark`, `muted`, `success`, `destructive-outline` variants; replaced the ghost-only spinner-colour ternary with `VARIANT_SPINNER_COLOR`
- `src/components/Button.test.tsx` - Appended 7 tests (success/muted/dark/tonal/destructive-outline styling, muted+disabled never fires onPress) to the 6 pre-existing tests
- `src/components/ScreenHeader.tsx` - New: white top bar, 44x44 back chevron (`router.back()` default, overridable, or `null` to hide), 17px/800 title, optional `right` slot
- `src/components/ScreenHeader.test.tsx` - New: 6 tests (title render, default back, overridden back, hidden back, right slot, 44px hit target)
- `src/components/SectionCard.tsx` - New: `rounded-card` bordered container with uppercase eyebrow row and optional right-aligned meta
- `src/components/SectionCard.test.tsx` - New: 4 tests (eyebrow render, meta present/absent, children render, container classes)
- `src/test-utils/expo-mocks.ts` - Appended `createLucideMock()` (6th export)
- `src/test-utils/expo-mocks.test.ts` - Appended a test asserting `__esModule` and that `ChevronLeft`/`AlertTriangle` resolve to functions

## Verified lucide-react-native (v1.33.0) export names

Ran the plan's verification command against the installed package; every requested name resolved as a real export — no glyph needed to be substituted:

```
Truck function, ChevronLeft function, ChevronRight function, AlertTriangle function,
TriangleAlert function, LogOut function, MapPin function, Check function, X function,
Eye function, EyeOff function, Info function, Plus function, Lock function, Car function,
Wallet function, Clock function, Settings function, ShieldCheck function, User function,
Crosshair function, CircleAlert function
```

No renames required. Plans 02-07 through 02-12 can use every one of these names directly.

## ScreenHeader / SectionCard prop signatures

```typescript
export function ScreenHeader(props: {
  title: string;
  onBack?: (() => void) | null; // defaults to router.back(); null hides the back control
  right?: ReactNode;
  testID?: string;
}): JSX.Element;

export function SectionCard(props: {
  eyebrow: string;       // rendered uppercase at 12px/700/0.08em tracking, neutral-500
  meta?: string;         // right-aligned on the eyebrow row, e.g. "4 of 5 uploaded"
  children: ReactNode;
  className?: string;
  testID?: string;
}): JSX.Element;
```

## Button `Variant` union (all nine, with design element served)

```typescript
type Variant =
  | 'primary'              // primary-500 fill, white text     — D01 Sign in, D02 Continue, D06 blocker action
  | 'secondary'             // secondary-500 fill, white text
  | 'destructive'           // danger-500 fill, white text      — D04 Re-upload
  | 'ghost'                 // transparent, neutral-300 border  — D07 Switch vehicle
  | 'tonal'                 // primary-50 fill, primary-700 text— D04 Upload, D05 + Add
  | 'dark'                  // neutral-900 fill, white text     — D05 Register vehicle
  | 'muted'                 // neutral-200 fill, neutral-500 text— D06 disabled Go online, D05 unavailable Activate
  | 'success'               // success-500 fill, white text     — D06/D07 Go online
  | 'destructive-outline';  // transparent, neutral-300 border, danger-600 text — D03 Log out
```

## Decisions Made
- Verified all 22 lucide icon names used by later Phase 2 plans resolve as real exports on the installed `lucide-react-native@1.33.0` — recorded above so 02-07 through 02-12 don't have to re-verify or guess at renames.
- `muted` deliberately has no `active:` class (UI-SPEC describes the greyed states it covers as non-interactive); callers still pass `disabled` to stop the press.
- `SectionCard` kept as a sibling of `Card.tsx`, not a prop-variant of it, per the plan's design note about full-bleed child rows vs. Card's uniform padding.

## Deviations from Plan

None - plan executed exactly as written. The one conditional branch in the plan (substituting a renamed lucide icon) was not triggered since all 22 verified names resolved.

## Issues Encountered
- `ScreenHeader.test.tsx`'s "explicit onBack callback" test initially failed because the shared `expo-router` mock's `router.back` jest.fn() carried call history over from the prior test (no `jest.clearAllMocks()`). Fixed by adding a `beforeEach(() => jest.clearAllMocks())` to the describe block — a same-file test-isolation fix within Task 2, not a plan deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- D03 (Menu), D04 (KYC documents), D05 (Vehicles), D06 (Online toggle), and D07 (Dashboard) can now all consume `Button`'s nine variants, `ScreenHeader`, `SectionCard`, and `createLucideMock` directly instead of re-deriving any of them.
- Full verification gate (`npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android`) is green: 19 test suites / 116 tests passing, 0 lint errors (34 pre-existing warnings, none introduced by this plan's require-import style match the existing `expo-mocks.ts` pattern), export bundles cleanly.
- No files under `src/app/` were touched by this plan.

## Self-Check: PASSED

All 4 created files and both task commit hashes (714e4ae, 873e6d8) verified present.

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*
