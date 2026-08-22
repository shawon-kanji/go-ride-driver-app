---
phase: 2
slug: online-offline-foreground-location-maps
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `jest-expo/android` preset (`jest@~29.7.0`, `@testing-library/react-native@^14.0.1`) |
| **Config file** | `jest.config.js` (repo root) |
| **Quick run command** | `npx jest --watchAll=false <path-to-changed-test-file>` |
| **Full suite command** | `npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android` |
| **Estimated runtime** | ~90s quick / ~4min full |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --watchAll=false <changed test file(s)>`
- **After every plan wave:** Run the full suite command above
- **Before `/gsd:verify-work`:** Full suite must be green, plus both human-verify checkpoints resolved
- **Max feedback latency:** ~90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-xx | TBD | 0 | PRES-01 | unit | `npx jest --watchAll=false src/features/presence/api.test.ts` | ❌ W0 | ⬜ pending |
| 02-xx | TBD | TBD | PRES-01 | unit (component) | `npx jest --watchAll=false src/features/presence/components/ConfirmOnlineSheet.test.tsx` | ❌ W0 | ⬜ pending |
| 02-xx | TBD | TBD | PRES-01 | unit (component) | `npx jest --watchAll=false src/app/(app)/index.test.tsx` | ❌ W0 | ⬜ pending |
| 02-xx | TBD | TBD | PRES-02 | unit (fake timers) | `npx jest --watchAll=false src/features/presence/location-broadcaster.test.ts` | ❌ W0 | ⬜ pending |
| 02-xx | TBD | TBD | PRES-02 | manual-only | N/A — real GPS/battery behavior over a session | N/A | ⬜ pending |
| 02-xx | TBD | TBD | PRES-03 | unit (component, mocked maps) | `npx jest --watchAll=false src/features/presence/components/HomeMap.test.tsx` | ❌ W0 | ⬜ pending |
| 02-xx | TBD | TBD | PRES-03 | manual-only | N/A — real device map render + API key | N/A | ⬜ pending |
| 02-xx | TBD | TBD | nav restructure | smoke | `npx expo start` (regen typed routes) `&& npx tsc --noEmit` | N/A | ⬜ pending |
| 02-xx | TBD | TBD | font/radii tokens | manual/visual | spike-verify NativeWind `borderRadius` key resolution, then visual check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — Task IDs/Plan/Wave filled in once gsd-planner assigns them.*

---

## Wave 0 Requirements

- [ ] `src/features/presence/api.test.ts` — online-toggle mutation + `kycBlockReason` mapping
- [ ] `src/features/presence/location-broadcaster.test.ts` — throttle/tiering logic, start/stop lifecycle
- [ ] `src/features/presence/components/ConfirmOnlineSheet.test.tsx` — D07 permission-denial branch
- [ ] `src/features/presence/components/HomeMap.test.tsx` — marker/camera-follow logic (map mocked)
- [ ] `src/app/(app)/index.test.tsx` — D06 routing branches (no active vehicle / KYC blocked / all-clear)
- [ ] `src/lib/geo.test.ts` (or similar) — `haversineMeters` pure-function test
- [ ] Jest manual mocks for `expo-location` and `react-native-maps` added to
      `src/test-utils/expo-mocks.ts` (neither is auto-mocked by `jest-expo` — confirmed
      against installed `node_modules/jest-expo`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Real GPS movement drives correct broadcast cadence and battery behavior over a multi-hour session | PRES-02 | Real hardware GPS/battery behavior isn't reproducible under Jest | Run `npx expo run:android` on a physical device, go online, walk/drive around for 15+ min, confirm pings land in `driver_locations` via Postgres and cadence roughly matches the 10s movement-tier / 60s heartbeat-tier design |
| Map renders tiles/marker correctly with a valid Google Maps API key on a real build | PRES-03 | Native Fabric map view cannot render under Jest; API key routing depends on the actual build profile (dev client vs. EAS internal) | Same device session: confirm the map tile layer loads (not blank/grey) and the driver's own position marker tracks movement |
| `rounded-control`/`rounded-card`/`rounded-pill` Tailwind classes resolve to 12px/16px/999px | visual polish | NativeWind's Jest transform doesn't reliably expose computed style snapshots for custom `borderRadius` keys | After wiring `tailwind.config.js`, visually inspect a Button (control), Card, and a pill Badge on-device or in Expo web preview |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

### Manual verification results (2026-08-22, real device `R5CR2116JDY` + local backend stack)

- Map tiles render correctly (MAP_API_KEY reaches the native build, matching SHA-1/package restriction) — confirmed.
- Full online → broadcast → offline loop confirmed end to end, including a real bug found and fixed along the way (session-store `driver` never repopulated after a session restore, silently blocking every broadcast POST) — see 02-13-SUMMARY.md.
- Extended multi-hour real-GPS cadence not exercised (inherently outside a single session, as this table already notes); first-ping and immediate-heartbeat behavior confirmed instead.

**Approval:** approved 2026-08-22 — see 02-13-SUMMARY.md for full detail and the two real bugs found/fixed during this pass.
