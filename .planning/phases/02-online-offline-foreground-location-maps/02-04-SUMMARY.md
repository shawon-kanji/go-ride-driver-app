---
phase: 02-online-offline-foreground-location-maps
plan: 04
subsystem: api
tags: [tanstack-query, expo, location-producers, driver-request-handler, kyc-gating]

# Dependency graph
requires:
  - phase: 02-online-offline-foreground-location-maps
    provides: "plan 02-01's EXPO_PUBLIC_LOCATION_BASE_URL / EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL env vars; Phase 01.1's kycBlockReason/KycBlockedBanner vocabulary; vehicles/api.ts and kyc/api.ts query hooks"
provides:
  - "requestWithBase(baseUrl, path, options) — base-URL-aware core of the HTTP client, with apiRequest as a thin go-ride-backend-pinned wrapper"
  - "locationClient.updateLocation (POST /update-location against location-producers :8081)"
  - "driverTripsClient.getEarnings/getOnlineTime (GET against driver-request-handler :8084)"
  - "deriveOnlineGate — single pure function deciding online eligibility across 5 statuses"
  - "gateToKycBlockReason — maps gate statuses onto the existing KycBlockedBanner vocabulary"
  - "useSetOnlineStatusMutation / useTodayEarningsQuery / useTodayOnlineTimeQuery presence hooks"
affects: [02-05, 02-09, 02-10]

tech-stack:
  added: []
  patterns:
    - "requestWithBase(baseUrl, path, options) as the shared core; per-service clients each close over their own EXPO_PUBLIC_*_BASE_URL constant instead of repointing a single shared BASE_URL"
    - "Pure gating function (deriveOnlineGate) computed once and consumed by multiple screens/hooks, rather than re-derived per screen"

key-files:
  created:
    - src/api/location-client.ts
    - src/api/location-client.test.ts
    - src/api/driver-trips-client.ts
    - src/api/driver-trips-client.test.ts
    - src/features/presence/gating.ts
    - src/features/presence/gating.test.ts
    - src/features/presence/api.ts
    - src/features/presence/api.test.ts
  modified:
    - src/api/http-client.ts
    - src/api/types.ts

key-decisions:
  - "requestWithBase extracted as the shared core of apiRequest; apiRequest itself is unchanged in signature and behavior for every existing caller"
  - "UpdateLocationPayload is built by passing only explicitly-set keys through to requestWithBase's JSON.stringify — no spreading of possibly-undefined optional fields, since location-producers' Go decoder uses DisallowUnknownFields()"
  - "deriveOnlineGate evaluates identity (KYC) before vehicle documents, matching go-ride-backend's own 403 precedence (KYC_NOT_APPROVED before VEHICLE_NOT_VERIFIED)"
  - "approvedVehicleDocumentCount counts distinct required VEHICLE_DOCUMENT_TYPES scoped to vehicle_id === activeVehicle.id, not raw document rows — prevents duplicate uploads or another vehicle's approved docs from inflating the count"
  - "useSetOnlineStatusMutation does not try/catch the 403; callers use kycBlockReason(error) from ../kyc/kyc-errors, keeping the KYC error-mapping vocabulary in exactly one place"
  - "Location-watcher lifecycle (start/stop broadcasting) deliberately NOT wired into these hooks — it belongs at the app-layout level in plan 02-09"

patterns-established:
  - "Base-URL-aware request helper: any new backend service gets its own EXPO_PUBLIC_*_BASE_URL constant and a client file that calls requestWithBase(THAT_URL, path, options) — the shared BASE_URL/apiRequest pair stays pinned to go-ride-backend"

requirements-completed: [PRES-01, PRES-02]

duration: 12min
completed: 2026-08-20
---

# Phase 02 Plan 04: Presence data layer — location/driver-trips clients, online gating, presence hooks Summary

**Base-URL-aware HTTP core plus location-producers and driver-request-handler clients, a single pure `deriveOnlineGate` function covering all 5 online-eligibility outcomes, and four TanStack Query hooks for the online toggle and D06's two stat cards — 28 new unit tests, zero regressions.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-20T14:00:00Z
- **Completed:** 2026-08-20T14:12:26Z
- **Tasks:** 3
- **Files modified:** 10 (2 modified, 8 created)

## Accomplishments
- `src/api/http-client.ts` now exposes `requestWithBase<T>(baseUrl, path, options)` as the shared core; `apiRequest` is a one-line wrapper pinned to `EXPO_PUBLIC_API_BASE_URL`, byte-identical in behavior (204 short-circuit, `{code,message}` error fallback, centralized 401 → `clearSession`) for every existing caller
- `locationClient.updateLocation` and `driverTripsClient.{getEarnings,getOnlineTime}` each target their own base URL (`EXPO_PUBLIC_LOCATION_BASE_URL` :8081, `EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL` :8084) without touching go-ride-backend's client files
- `deriveOnlineGate` is the single, 11-test-covered pure function answering "may this driver go online, and if not, why" — reused verbatim by D06 (02-10) and D07 (02-09) instead of being re-derived per screen
- Four presence hooks (`useSetOnlineStatusMutation`, `useTodayEarningsQuery`, `useTodayOnlineTimeQuery`, plus the `presenceKeys` factory) wrap the online toggle and the two D06 stat cards, leaving KYC 403s intact for `kycBlockReason` to map

## Task Commits

Each task was committed atomically:

1. **Task 1: Base-URL-aware request helper + location and driver-trips clients** - `da1eebb` (feat, TDD)
2. **Task 2: deriveOnlineGate — single source of truth for "may this driver go online"** - `0b47640` (feat, TDD)
3. **Task 3: presence query hooks — online toggle with KYC mapping, plus the two stat cards** - `aaaf6af` (feat, TDD)

_Note: each task's tests were authored before/alongside the implementation in the same commit per the plan's tdd="true" flow; no separate RED-only commits were needed since acceptance required both test file and implementation to land together for the automated verify step._

## Files Created/Modified
- `src/api/http-client.ts` - extracted `requestWithBase`; `apiRequest` now delegates to it
- `src/api/types.ts` - added `EarningsResponse`, `OnlineTimeResponse`, `UpdateLocationPayload`, `UpdateLocationResponse`
- `src/api/location-client.ts` / `.test.ts` - `locationClient.updateLocation` against location-producers, 4 tests
- `src/api/driver-trips-client.ts` / `.test.ts` - `driverTripsClient.{getEarnings,getOnlineTime}` against driver-request-handler, 5 tests
- `src/features/presence/gating.ts` / `.test.ts` - `deriveOnlineGate`, `gateToKycBlockReason`, 11 tests
- `src/features/presence/api.ts` / `.test.ts` - `presenceKeys`, `useSetOnlineStatusMutation`, `useTodayEarningsQuery`, `useTodayOnlineTimeQuery`, 8 tests

## Exported Signatures (for 02-05, 02-09, 02-10)

```typescript
// src/features/presence/gating.ts
export type OnlineGateStatus = 'ready' | 'no_vehicle' | 'no_active_vehicle' | 'identity_blocked' | 'vehicle_blocked';
export interface OnlineGate {
  status: OnlineGateStatus;
  canGoOnline: boolean;
  activeVehicle: Vehicle | null;
  approvedVehicleDocumentCount: number;
}
export function deriveOnlineGate(input: { vehicles: Vehicle[] | undefined; kyc: KycStatusResponse | undefined }): OnlineGate;
export function gateToKycBlockReason(status: OnlineGateStatus): KycBlockReason | null;

// src/features/presence/api.ts
export const presenceKeys: {
  all: readonly ['presence'];
  earnings: (period: string) => readonly ['presence', 'earnings', string];
  onlineTime: (period: string) => readonly ['presence', 'online-time', string];
};
export function useSetOnlineStatusMutation(): UseMutationResult<{ driver: Driver }, unknown, boolean>;
export function useTodayEarningsQuery(): UseQueryResult<EarningsResponse>;
export function useTodayOnlineTimeQuery(): UseQueryResult<OnlineTimeResponse>;
```

## Important note for 02-09 (location broadcast wiring)

`location-producers`' `/update-location` handler calls `decoder.DisallowUnknownFields()`, so `UpdateLocationPayload` must be built by **omitting** unset optional keys (`event_time`, `geohash`, `s2_cell_id`, `accuracy_m`, `source`, `event_id`) rather than sending them as `undefined`/`null` — any extra key, even one set to `undefined` that still serializes in a spread, is a 400. `locationClient.updateLocation` in this plan only forwards exactly the keys the caller passes.

## Decisions Made
- `requestWithBase` extracted rather than parameterizing `apiRequest` directly, so `apiRequest`'s public signature and every existing caller (`driver-client.ts`, `vehicles-client.ts`, `kyc-client.ts`) needed zero changes — verified via `git diff` being empty on those three files.
- `deriveOnlineGate` checks identity before vehicle documents specifically to mirror the backend's own 403 precedence (`KYC_NOT_APPROVED` before `VEHICLE_NOT_VERIFIED`), so the client's block reason never contradicts what the server would have said.
- `useSetOnlineStatusMutation` has no try/catch — KYC 403 mapping stays in the single existing `kycBlockReason` utility rather than being duplicated.
- Location-watcher start/stop lifecycle intentionally left out of these hooks (belongs in plan 02-09 at the app-layout level, per RESEARCH.md's anti-pattern warning about watcher lifecycle tied to a screen/hook).

## Deviations from Plan

None - plan executed exactly as written. Two RNTL `renderHook` KYC-error-mapping tests needed an added `waitFor(() => expect(result.current.error).not.toBeNull())` before reading `result.current.error` (React state update from the rejected mutation was not yet flushed at the point `act()` resolved) — this is a test-authoring detail within Task 3's own test file, not a deviation from any plan-specified behavior or file.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `deriveOnlineGate`, `gateToKycBlockReason`, and all four presence hooks are ready for direct consumption by 02-05 (map/foreground shell), 02-09 (online toggle + location broadcast wiring), and 02-10 (D06 home screen stat cards and gating banner).
- Full verification gate green: `npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android`.
- No blockers for the next plan.

---
*Phase: 02-online-offline-foreground-location-maps*
*Completed: 2026-08-20*

## Self-Check: PASSED

All created files and task commit hashes verified present.
