# Phase 2: Online/Offline + Foreground Location + Maps - Context

**Gathered:** 2026-08-18 (via `/gsd:discuss-phase 2`)
**Status:** Ready for planning

<domain>
## Phase Boundary

A driver with an active vehicle can go online and their live location is visible
on-device and broadcast to the backend (PRES-01, PRES-02, PRES-03). This phase also
carries the deferred "bold/vibrant visual identity" pass promised by Phase 1 and Phase
01.1's context files — the design handoff (`design_handoff_go_ride/`) now exists and
supplies it, so it lands here rather than in a separate later phase. That pulls in:
the app-wide font/radii token system, a navigation restructure from bottom-tabs to the
design's menu model, D06 Home, D07 Confirm-online, D03 Menu, and a visual retrofit of
the four already-built screens (D01 Sign in, D02 Create account, D04 Verification hub,
D05 Vehicles) to match their actual mockups. Job offers, the trip lifecycle, and
push notifications are NOT this phase (Phases 3/4/5).

</domain>

<decisions>
## Implementation Decisions

### Navigation architecture
- Full switch to the design's menu-based nav: `(tabs)` is removed. Home (D06) is the
  sole bottom-level screen, reached directly after auth. A tappable profile chip on
  Home (avatar, name, `<plate> · offline/online`, amber alert dot when verification is
  outstanding, chevron) opens D03 Menu as its own screen (push, not modal — matches
  "This screen is the entry point for KYC and vehicle registration").
- D03 Menu has two groups exactly as specified: **"Get ready to drive"** (Verification
  & documents — badge "Action needed" in danger tint when blocked, My vehicles — badge
  "Active", Profile) and **"Your work"** (Earnings, Trip history, Settings), then a
  destructive outlined Log out.
- Verification, My vehicles, and Profile route to the existing screens built in Phases
  1/01.1 (`src/app/(app)/(tabs)/verify`, `/vehicles`, `/profile` today — these move out
  from under `(tabs)` as part of this restructure, see Integration Points below).
- Earnings, Trip history, and Settings don't exist yet (Phases 5/6). Show their rows in
  D03 per the mockup, but disabled/"coming soon" (non-interactive or a simple
  placeholder) until their real phase lands. Don't omit them — the menu should look and
  read complete now, matching the design.
- Home (Phase 01.1) already has a KYC-status summary card. Keep it. D03's header status
  line + warning banner is the detailed explanation; Home's card is the quick glance.
  Slightly redundant, but that's what the two actual mockups show — don't remove either.

### Visual rollout scope
- Plus Jakarta Sans (weights 400–800) and the radii tokens (control 12, card 16, pill
  999, replacing the current `sm:6/md:10/lg:16/full:9999` scale) are wired app-wide in
  this phase, not scoped to new screens only. They're config/token-level changes
  (font loader + `theme/radii.ts` + wherever `rounded-*` classes reference the old
  scale) that every screen picks up for free via the shared `Button`/`Card`/`Badge`/
  `Banner`/etc. components and Tailwind classes — no per-screen font work needed for
  this part.
- Beyond fonts/radii, the four already-built screens (D01, D02, D04, D05) ALSO get
  retrofitted to match their actual design mockups in this phase — not deferred again.
  This is a deliberate scope expansion beyond the roadmap's PRES-01/02/03 wording,
  explicitly requested: match layout, spacing, copy, and colour usage against
  `Driver App.dc.html`'s D01/D02/D04/D05 sections, using the existing (correct, not
  placeholder — see README) `colors.js` palette. Treat this as its own plan/wave in
  the phase, separate from the new-screen (D06/D07/D03) and location/map plans, so a
  regression in one doesn't block the other.
- Driver app colours (`src/theme/colors.js`) are NOT changing — the design handoff's
  own README says this file is already the source of truth for the driver app, unlike
  the rider app's placeholder indigo. Only radii + typography + layout are in scope.

### Home screen (D06) scope
- Stat cards (today's earnings, online time) are built against real data in this
  phase, not stubbed: `GET /api/v1/driver-trips/earnings?period=today` and
  `GET /api/v1/driver-trips/online-time?period=today` on `driver-request-handler`
  (both already implemented server-side — see canonical refs). This pulls a thin slice
  of Phase 6 forward; Phase 6 itself will still build the fuller trip-history/earnings
  screens D03 routes to.
- D06's disabled `Go online` + primary blocker-routing action reuses Phase 01.1's
  `kycBlockReason`/`KycBlockedBanner` pattern exactly, per that phase's own forward
  note ("Phase 2's online toggle should reuse kycBlockReason + KycBlockedBanner
  unchanged for PATCH /driver/online"). No active vehicle → route to Vehicles (now
  under the Menu). KYC incomplete → route to Verify (now under the Menu).

### Confirm-online modal (D07)
- "Switch vehicle" closes the modal and navigates to the existing Vehicles screen
  (Phase 1's activate/switch-active flow already handles picking a different active
  vehicle) rather than building a new inline picker. Going online always passes
  through this confirmation (D06 → D07 → online), never a direct toggle — per the
  design's own stated rule.

### Claude's Discretion
- Exact foreground location ping interval/tiering (PRES-02 says "tiered interval" —
  balance battery vs. dispatch freshness; research should confirm a concrete number,
  e.g. faster while online-and-idle, matching what `trip-dispatch-worker`'s
  `DRIVER_LOCATION_FRESH_WINDOW_SECONDS=300` and dispatch sweep expect).
- Map re-centre control behaviour and exact marker/heading rendering (D06 has no
  drawn route yet — that's Phase 3+/rider-side; Phase 2's map just shows the driver's
  own position).
- "Coming soon" row treatment for Earnings/Trip history/Settings — greyed static row
  vs. tappable-to-a-placeholder-screen; either satisfies the design as long as it
  doesn't silently no-op or crash.
- Internal file/module organization for the new `src/features/presence/` (or similar)
  feature, mirroring the existing `vehicles`/`kyc` shape.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product/requirements
- `.planning/PROJECT.md` — core value, constraints, the "bold/vibrant, non-negotiable"
  visual-identity requirement this phase now finally delivers on
- `.planning/REQUIREMENTS.md` — PRES-01/02/03 acceptance criteria (under "Presence &
  Location"), KYC-04 cross-reference, traceability table
- `.planning/ROADMAP.md` — Phase 2 boundary, success criteria, dependency on Phase 1
- `.planning/phases/01.1-kyc-identity-and-vehicle-document-verification/01.1-CONTEXT.md`
  — blocked-state messaging pattern (`kycBlockReason`/`KycBlockedBanner`) this phase
  reuses verbatim for the online-toggle block; tab-nav precedent this phase reverses
- `.planning/phases/01.1-kyc-identity-and-vehicle-document-verification/01.1-07-PLAN.md`
  — explicit forward note that Phase 2's online toggle reuses the KYC block components

### Design handoff (this phase's primary spec for D03/D06/D07 and the visual retrofit)
- `../../design_handoff_go_ride/README.md` — design tokens (driver app: colours from
  `colors.js` as source of truth, radii control 12/card 16/pill 999, Plus Jakarta Sans
  400–800, spacing scale), screen descriptions D01–D11, interaction rules (going
  online always confirms via D07, KYC is two independent tracks, raw 403s must be
  translated)
- `../../design_handoff_go_ride/Driver App.dc.html` — search `data-screen-label="03
  Menu"`, `"06 Home"`, `"07 Confirm online"`, `"01 Sign in"`, `"02 Create account"`,
  `"04 Verification hub"`, `"05 Vehicles"` for exact layout/copy/spacing reference.
  Design reference only — do not port inline styles literally, express in NativeWind/
  theme tokens.
- `../../design_handoff_go_ride/Screen Flow Spec.dc.html` — given/when/then transitions
  for D06↔D07↔online, permission-refusal handling, KYC-block routing

### Architecture & stack (already locked, do not re-derive)
- `.planning/research/ARCHITECTURE.md` — project structure, TanStack Query vs Zustand
  split
- `.planning/research/STACK.md` — Expo SDK 57, RN 0.86.x, NativeWind v4, exact package
  versions already in use (`react-native-maps` 1.27.2, `expo-location` ~57.0.7,
  `expo-task-manager`/`expo-background-task` installed but unused — foreground only
  this phase per PROJECT.md's explicit v1/v2 split)
- `.planning/research/PITFALLS.md` — native rebuild required after config-plugin
  changes (font loading via `expo-font`, any location permission plugin config)

### Backend contract (verified directly against source this session — no OpenAPI spec)
- `go-ride-backend/interfaces/http/routes/driver_routes.go` — `PATCH /api/v1/driver/online`
  (`UpdateOnlineStatusRequest{is_online}`), `PATCH /api/v1/driver/pause` (Phase 3, not
  this phase, but same route group)
- `go-ride-backend/application/driver/dto.go` — `DriverResponse` now includes
  `is_online`/`is_paused`
- `go-ride-kafka-consumers/services/location-producers/internal/api/server.go` —
  `POST /api/v1/location/update-location` on its OWN service/port (local dev
  `HTTP_ADDR=:8081`, distinct from `go-ride-backend`'s `:8080`), body
  `{driver_id, latitude, longitude, event_time?, accuracy_m?, source?, event_id?}`,
  **no auth enforced today** (known backend gap, not in scope to fix here) — send the
  driver's own ID from the authenticated session
- `go-ride-kafka-consumers/services/driver-request-handler/internal/api/*.go` —
  `apiPrefix = "/api/v1/driver-trips"` on ITS OWN service/port (local dev
  `HTTP_ADDR=:8084`); this phase only needs its `GET /earnings?period=today` and
  `GET /online-time?period=today` (response shapes: `earningsResponse`,
  `onlineTimeResponse` in `earnings.go`/`online_time.go`) — driver JWT bearer auth,
  same token as `go-ride-backend`
- `go-ride-kafka-consumers/docs/driver-rider-realtime-communication.md` — confirms
  `driver.location.updated.v1` is a fleet-wide firehose filtered downstream by
  presence, not something this phase's client needs to reason about beyond POSTing pings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/{Button,Card,Badge,Banner}.tsx` — reused for D06/D07/D03; radii/font
  changes land in these once (token/class level) rather than per-screen.
- `src/features/kyc/kyc-errors.ts` (`kycBlockReason`) and
  `src/features/kyc/components/KycBlockedBanner.tsx` — reused unchanged for the
  online-toggle block, per Phase 01.1's own forward note.
- `src/api/http-client.ts` (`apiRequest<T>()`) — reuse for `/driver/online` (already
  wired via `driverClient.setOnlineStatus` in `src/api/driver-client.ts`) and the new
  earnings/online-time calls, BUT those live on `driver-request-handler`'s own base URL
  (`:8084` locally), not `go-ride-backend`'s (`:8080`) — needs either a second base-URL
  env var + client instance, or an `apiRequest` variant that takes a base override.
  Location-producers (`:8081`) needs a third. `EXPO_PUBLIC_API_BASE_URL` today points
  only at `go-ride-backend`.
- `src/stores/session-store.ts` — has the driver's id/token; location pings need the
  driver id, offline-first-safe (don't crash if the store hasn't hydrated).
- `react-native-maps` 1.27.2 and `expo-location` ~57.0.7 — installed, unreferenced
  outside `MapSmokeTest.tsx`; this phase is their first real use.

### Established Patterns
- Per-domain split: `src/api/<domain>-client.ts` + `src/features/<domain>/api.ts`
  (TanStack Query hooks) + `src/features/<domain>/schemas.ts` + `components/*` — mirror
  for a new `presence`/`home` feature (online toggle, location broadcast) and a `menu`
  feature (D03).
- Confirm-dialog-before-consequential-action pattern already used for vehicle
  activate/re-upload — D07 is the same shape (a confirmation sheet before a state
  change), reuse `ConfirmDialog` or a similar full-sheet variant if one is needed.

### Integration Points
- `src/app/(app)/(tabs)/_layout.tsx` and the `(tabs)` group are removed; `vehicles/`,
  `verify/`, `profile/` route directories move to sit directly under `src/app/(app)/`
  (or a non-tab group), with `src/app/(app)/_layout.tsx`'s `Stack` updated accordingly.
  Existing screens' internal logic is untouched by the move — only their position in
  the route tree and entry point (Menu row instead of tab bar) change.
- `src/app/(app)/(tabs)/index.tsx` (current Home) becomes the new top-level
  `src/app/(app)/index.tsx` (D06), gaining the map, profile chip, stat cards, and
  online-toggle flow; its existing KYC card is preserved.
- `src/theme/radii.ts`, `src/theme/colors.js`/`tokens.ts`, `tailwind.config.js` — token
  layer that both new and existing screens draw from; font loading is new (`expo-font`
  + `@expo-google-fonts/plus-jakarta-sans`, not yet installed — only
  `@expo-google-fonts/material-symbols` exists today) wired into `src/app/_layout.tsx`
  before `SplashScreen.hideAsync()`.
- `app.json` needs an `expo-location` foreground-permission plugin block (none exists
  today) and, once fonts are added, no plugin entry is needed for
  `@expo-google-fonts/*` (JS-only) but a native rebuild is still required for the
  location permission plugin per the PITFALLS.md precedent.

</code_context>

<specifics>
## Specific Ideas

No specific visual references beyond the design handoff files themselves — build D03/
D06/D07 and retrofit D01/D02/D04/D05 to match their actual mockups in
`Driver App.dc.html`, not a reinterpretation of them.

</specifics>

<deferred>
## Deferred Ideas

- Background location tracking (v2 requirement `LOC-01`) — explicitly out of this
  phase and this milestone's roadmap; foreground-only per PROJECT.md.
- An inline vehicle-switch picker inside the D07 modal — deferred in favor of linking
  out to the existing Vehicles screen; revisit only if user feedback says the extra tap
  is a real problem.
- Real Earnings/Trip history/Settings screens — Phases 5/6; D03 only shows their rows
  as "coming soon" this phase.
- iOS-specific location/permission handling — Android-first constraint unchanged.

</deferred>

---

*Phase: 02-online-offline-foreground-location-maps*
*Context gathered: 2026-08-18*
