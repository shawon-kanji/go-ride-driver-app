---
phase: 02-online-offline-foreground-location-maps
plan: 08
subsystem: ui
tags: [react-native, nativewind, lucide-react-native, kyc, jest, testing-library]

requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "SectionCard/ScreenHeader shared primitives and Button's nine-variant fill surface (plan 02-06)"
  - phase: 02-online-offline-foreground-location-maps
    provides: "deriveOnlineGate's distinct-required-type counting convention (plan 02-04/02-02)"
provides:
  - "StatusDisc — 26px status disc component for the four D04 row states"
  - "verification-summary.ts — pure summariseTrack/describeVerificationBlockers/documentRowState, reusable by D03 and D06"
  - "DocumentTile rewritten as a full-bleed row with inline rejection reason and trailing Upload/Re-upload pill"
  - "D04 Verification hub retrofitted to ScreenHeader + two SectionCard lists + one-sentence blocker banner"
affects: [02-11, 02-12]

tech-stack:
  added: []
  patterns:
    - "Pure, React-free summariser module (verification-summary.ts) shared by D03/D04/D06 rather than each screen re-deriving KYC counts"

key-files:
  created:
    - src/features/kyc/verification-summary.ts
    - src/features/kyc/verification-summary.test.ts
    - src/features/kyc/components/StatusDisc.tsx
    - src/features/kyc/components/StatusDisc.test.tsx
  modified:
    - src/features/kyc/components/DocumentTile.tsx
    - src/features/kyc/components/DocumentTile.test.tsx
    - src/app/(app)/verify/index.tsx

key-decisions:
  - "verification-summary.ts counts DISTINCT required document types per track, identical to deriveOnlineGate's counting rule, so the two never disagree"
  - "describeVerificationBlockers only names rejected/missing documents; in-review documents are progress, not a blocker, and are excluded from the sentence"
  - "StatusDisc's 'missing' state is a dashed outline with no glyph and no fill colour — never amber, which is reserved for in_review"

requirements-completed: [PRES-01]

duration: 15min
completed: 2026-08-20
---

# Phase 02 Plan 08: D04 Verification Hub Retrofit Summary

**Retrofitted the D04 Verification hub to ScreenHeader/SectionCard with a coloured status disc, inline rejection reasons, and a one-sentence blocker banner, backed by a new pure `verification-summary.ts` module shared with future D03/D06 plans.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-20T14:39:00Z
- **Completed:** 2026-08-20T14:54:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- `StatusDisc` renders the four D04 row treatments (approved/in_review/rejected/missing), with missing rendered as a dashed outline (never a fill)
- `verification-summary.ts` provides `summariseTrack`, `documentRowState`, and `describeVerificationBlockers` as pure, React-free functions with 10 tests, counting distinct required types identically to `deriveOnlineGate`
- `DocumentTile` is now a full-bleed row (no `Card` wrapper) with a disc, dimmed label when missing, `bg-danger-50` tint + inline reason when rejected, and a trailing Upload/Re-upload pill that fires the same `onPress` as the row
- D04 (`verify/index.tsx`) now renders `ScreenHeader` + status pill, a warning banner naming the exact blocker via `describeVerificationBlockers`, and two eyebrowed `SectionCard` lists ("Your identity" / "`<plate>` · Vehicle documents") — with Phase 01.1's vehicleId preselection, multi-vehicle selector, capture-screen routing, and empty-vehicle CTA all preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: StatusDisc and the pure verification summariser** - `4cc2086` (test)
2. **Task 2: Rewrite DocumentTile as a full-bleed document row** - `39cfa09` (feat)
3. **Task 3: D04 Verification hub screen retrofit** - `e74f6d3` (feat)

**Plan metadata:** pending (docs: complete plan)

_Note: Task 1 was TDD (tests written first as a single RED/GREEN commit, consistent with prior plans in this phase)._

## Exported Signatures (for plans 02-11 and 02-12)

```typescript
// src/features/kyc/verification-summary.ts
export type DocumentRowState = 'approved' | 'in_review' | 'rejected' | 'missing';
export interface TrackSummary {
  uploadedCount: number;
  approvedCount: number;
  rejectedCount: number;
  missingCount: number;
  total: number;
}
export function documentRowState(document: DocumentResponse | undefined): DocumentRowState;
export function summariseTrack(
  requiredTypes: readonly DocumentType[],
  documents: DocumentResponse[],
  vehicleId: string | undefined, // undefined = identity track
): TrackSummary;
export function describeVerificationBlockers(
  identity: TrackSummary,
  vehicle: TrackSummary | null,
): string | null;

// src/features/kyc/components/StatusDisc.tsx
export function StatusDisc(props: { state: DocumentRowState; testID?: string }): JSX.Element;
```

**Blocker-sentence format (verbatim, do not invent a second phrasing):**
`` `Can't go online: ${part1}, ${part2} and ${part3}.` ``
- Parts appear in this order when present: identity rejected, identity missing, vehicle rejected/missing (or `"no vehicle registered yet"` when `vehicle === null`).
- Each part reads `"<N> identity document(s) rejected"`, `"<N> identity document(s) missing"`, `"<N> vehicle document(s) rejected"`, `"<N> vehicle document(s) missing"` with correct singular/plural.
- Returns `null` when nothing blocks (no sentence, no banner).
- In-review documents are never mentioned — only rejected and missing count as blockers.

## Files Created/Modified
- `src/features/kyc/verification-summary.ts` - Pure summariser: per-track counts + blocker sentence
- `src/features/kyc/verification-summary.test.ts` - 10 tests covering counting, scoping, and sentence formatting
- `src/features/kyc/components/StatusDisc.tsx` - 26px status disc, four states
- `src/features/kyc/components/StatusDisc.test.tsx` - 4 tests covering the four disc treatments
- `src/features/kyc/components/DocumentTile.tsx` - Full-bleed row rewrite (disc + inline reason + trailing action)
- `src/features/kyc/components/DocumentTile.test.tsx` - 7 tests covering all four row states + press behaviour
- `src/app/(app)/verify/index.tsx` - ScreenHeader + blocker banner + two SectionCard lists

## Decisions Made
- `summariseTrack` counts distinct required types (never raw document rows), matching `deriveOnlineGate`'s rule exactly, so the gate and the hub display can never disagree about "how many documents are approved"
- `describeVerificationBlockers` excludes in-review documents from the sentence — an uploaded-and-pending document is progress, not a fault
- Kept `DocumentTile`'s three-prop signature byte-identical so `verify/index.tsx`'s call sites needed no prop changes, only the internal render

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All four verification-gate commands (`tsc --noEmit`, `expo lint`, `jest --watchAll=false`, `expo export --platform android`) passed on the first attempt after Task 3.

One out-of-scope finding was logged (not fixed, per scope boundary): `src/app/(app)/verify/[documentType].tsx` still uses a stale `font-semibold`/`text-lg` Tailwind default flagged by the plan's own grep gate. This file is explicitly out of scope for 02-08 ("this task is the hub screen only") — logged to `.planning/phases/02-online-offline-foreground-location-maps/deferred-items.md` for a future plan that retrofits D04's capture sub-screen.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `verification-summary.ts`'s exported signatures and blocker-sentence format are ready for plan 02-11 (D03's "Action needed" row subtitle) and plan 02-12 (D06's blocker warning card) to reuse directly rather than re-deriving KYC counts or inventing a second sentence phrasing
- D04 is now the fully-styled landing point for every KYC block in this phase (D06's blocker action, D03's row, D05's Fix link)

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All 8 created/modified files and all 3 task commit hashes (4cc2086, 39cfa09, e74f6d3) verified present.
