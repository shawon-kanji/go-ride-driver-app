# Project Research Summary

**Project:** go-ride-driver-app
**Domain:** Android-first Expo/React Native ride-hailing driver app (realtime WebSocket job offers, background location, push notifications, maps)
**Researched:** 2026-08-01
**Confidence:** MEDIUM-HIGH

> **Resolved 2026-08-09:** every "unclear whether the backend enforces document/vehicle KYC" callout below (executive summary, Gaps section, feature table) is now answered — `go-ride-backend` implemented it. See `.planning/REQUIREMENTS.md` VEH-04 and `go-ride-backend/doc/DRIVER_KYC_PLAN.md` for current behavior; left the analysis below as-written since it accurately reflects the state at research time and the reasoning ("changes whether vehicle registration is one-phase or two-phase") is still relevant context for why VEH-04 was scoped as a separate, deferred requirement rather than folded into Phase 1.

## Executive Summary

This is a driver-side mobile client for a ride-hailing platform — a well-understood product category (Uber Driver, Bolt Driver, Grab Driver, Lyft Driver all converge on the same core loop: go online → receive offer → accept → navigate → complete trip → get paid). The recommended build is Expo SDK 57 (React Native 0.86, React 19.2, New Architecture mandatory — there is no "legacy architecture" fallback available anymore), with `expo-router` for navigation, TanStack Query for server state, Zustand for ephemeral/realtime session state, NativeWind v4 for the required bold/vibrant visual identity, and `react-native-maps` for map display. The single most important architectural decision is treating the WebSocket connection and location broadcaster as app-level singletons wired to app lifecycle (not screen-scoped `useEffect`s) — the entire product's core value proposition ("without missing or losing a job offer") depends on this.

The recommended approach is a phased build that gets the core dispatch loop (auth → vehicle → online toggle → WS job offers → accept → trip lifecycle → cash collection) working end-to-end first, foreground-only, before layering in background location, push-notification hardening, and safety/earnings features. Two feature gaps not currently in PROJECT.md's Active requirements — trip history and a basic earnings summary — are cheap, expected-by-every-competitor additions that should be pulled into v1 rather than deferred. A third gap, document/vehicle KYC verification, is flagged as unresolved: it's unclear whether the backend enforces this at all, and it changes whether vehicle registration is a one-phase or two-phase feature.

The key risks are almost all Android platform/OS-level realities that are easy to miss in development but severe in production: OEM battery managers (Xiaomi/Huawei/OnePlus/Samsung) killing the app well before stock Android's Doze even engages; data-only FCM push messages not reliably executing JS when the app is fully killed; WebSocket connections silently dying in the background with no signal to the app; and Android 14's mandatory foreground-service-type declarations causing crashes or Play Store rejection if missed. All of these are mitigated by concrete, well-documented patterns (notification-type + full-screen-intent FCM messages, `AppState`-driven reconnect-and-replay, OEM battery-exemption onboarding, real-device testing with the app force-stopped) — but they must be designed for explicitly in the relevant phases, not discovered late. Two backend gaps (JWT audience mismatch blocking end-to-end auth, no refresh-token endpoint) are external blockers that shape client-side UX (proactive session-expiry warnings, distinguishing auth-close from network-close on WS reconnect) but cannot be fixed from this repo.

## Key Findings

### Recommended Stack

Expo SDK 57 (`react-native@0.86.x`, `react@19.2.x`) is the current stable, no-breaking-changes-over-56 release, and since SDK 55 removed Legacy Architecture entirely, there's no safer older SDK to fall back to — starting on current stable avoids an immediate forced upgrade. Data/state layering is TanStack Query (server-owned data: profile, vehicles, trip history, accept mutation) plus Zustand (ephemeral/realtime: online flag, WS status, pending offer + TTL, trip state machine) — already decided in PROJECT.md and confirmed as still the ecosystem standard. `react-native-maps` (not `expo-maps`, which remains alpha with no iOS Google Maps) is the correct map library, though its New Architecture/Fabric support is only partial as of v1.29.0 and warrants an early spike. `expo-notifications` requires FCM v1 API setup (Firebase service-account JSON, not the sunset Legacy FCM key) from the start of the push-notification phase, not retrofitted later.

**Core technologies:**
- Expo SDK 57 + expo-router: managed native runtime + file-based, typed-route navigation — current stable, no viable older/safer alternative
- @tanstack/react-query + zustand: server-state cache vs. client/realtime-ephemeral state split — the domain's 15s offer TTL makes staleness a functional bug, not just UX, so this split must be consistent from day one
- react-native-maps 1.29.0: map/marker/route display — de facto production standard, but New Architecture support is incomplete (partial iOS Fabric only), budget a verification spike
- expo-location + expo-task-manager + expo-notifications: foreground/background location and push — each has Android-specific config-plugin gotchas (foreground-service permissions, FCM v1) covered in Pitfalls
- NativeWind v4 (not v5, still pre-release) + react-native-reanimated v4 (requires separate `react-native-worklets` peer dependency): styling and animation for the required bold/vibrant identity

### Expected Features

Every incumbent driver app converges on the same core loop; this project's PROJECT.md already correctly scopes almost all of it. Two additions are recommended for v1, and one compliance question needs a direct answer before roadmap finalization.

**Must have (table stakes) — already scoped:**
- Sign up/log in, profile view/edit, vehicle registration/activation (gates going online)
- Online/offline toggle, foreground location broadcast
- Realtime job offers (WS + push + reconnect replay), accept within TTL (first-wins)
- Trip lifecycle (start/end/collect cash/cancel), bold/vibrant visual identity

**Must have — NOT currently scoped, recommend adding to v1:**
- Trip history list — every incumbent has it, cheap byproduct of trip-lifecycle data already being captured
- Basic earnings summary (today/week totals) — drivers check this constantly; trivial once trip history exists

**Should have (v1.x, gated on triggers):**
- Document/vehicle KYC verification — biggest flagged gap; unclear if backend enforces this at all (see Gaps)
- Basic SOS/emergency affordance — near-table-stakes for trust/liability; even a simple "call emergency services" deep link
- Driver rating visibility, trip-sharing with trusted contact (cheap once background location lands), refresh-token UX

**Defer (v2+):**
- Demand heatmap, in-app masked calling/chat, multi-stop trips, gamified incentive tiers, in-app payment gateway, driver decline/reject-offer UX — all blocked on backend work that doesn't exist yet, explicitly out of scope per PROJECT.md, or requires a mature driver base to be meaningful

### Architecture Approach

The client is structured in five layers: presentation (expo-router screens + NativeWind), state/data (TanStack Query for server-owned data, Zustand for session/realtime state), a realtime+background layer (WebSocket client, location broadcaster, push handler — all app-level singletons independent of screen lifecycle), a networking layer (typed API client with JWT/Idempotency-Key/X-Correlation-ID headers), and persistence (expo-secure-store for tokens, MMKV/AsyncStorage for non-sensitive cache). The project structure separates `realtime/` and `location/` from `features/` deliberately, because both must outlive any single screen's mount/unmount.

**Major components:**
1. WebSocket client (hand-rolled singleton) — owns connect/reconnect/backoff/replay-on-reconnect/heartbeat, writes directly to the Zustand session store; the single highest-risk, highest-craft-investment component in the app
2. TanStack Query + Zustand split — server-truth data vs. ephemeral/realtime-derived state, never mixed (e.g., never poll/cache job offers via Query — there's no REST fallback endpoint)
3. Location broadcaster — foreground `watchPositionAsync` now, `expo-task-manager` + Android foreground service later; started/stopped by the online-toggle feature, not self-directed
4. Push notification layer — treated purely as an OS-level wakeup/deep-link mechanism (never as offer data source); reconciles against live WS/REST before showing accept-able details
5. Trip state machine — explicit state machine (`offline → online_idle → offer_pending → trip_assigned → trip_in_progress → trip_completing`) in the session store, not scattered booleans

### Critical Pitfalls

1. **OEM battery managers (Xiaomi/Huawei/OnePlus/Samsung) kill the app before stock Android's Doze engages** — treat as a first-class feature: OEM detection + settings deep-links + `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` exemption + real (non-Pixel) device soak testing, designed alongside the online/offline toggle phase, not bolted on later.
2. **Data-only FCM messages don't reliably execute JS when the app is killed** — use `notification`-type, high-priority FCM messages with full-screen-intent (VoIP-call-style takeover) for job offers; verify with the app force-stopped, not just backgrounded; never trust a JS `setTimeout` countdown, derive expiry from server timestamp.
3. **WebSocket dies silently in the background with no signal** — proactively reconnect on every `AppState` foreground transition (don't wait for a stale read timeout), re-run replay on every reconnect, cap backoff low relative to the 15s TTL; push notifications are the accepted load-bearing fallback for this gap, not something to "fix" purely at the WS layer.
4. **Android 14 foreground-service-type mismatch crashes the app / blocks Play review** — explicitly request `ACCESS_BACKGROUND_LOCATION` before starting the foreground service, declare `FOREGROUND_SERVICE_LOCATION` + Play Console foreground-service-type justification; test on a real Android 14+ device, not an old emulator.
5. **First-wins accept race has no dedicated UI state** — design an explicit "offer no longer available" state (distinct from generic errors) returning cleanly to waiting-for-offers; test with ≥2 concurrent driver sessions, not single-driver happy path only.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation — Auth, Profile, Vehicles
**Rationale:** Everything else depends on a logged-in driver with an active vehicle; this is the acyclic root of the feature dependency graph (vehicle-active gates going online, which gates everything realtime).
**Delivers:** Sign up/login, profile view/edit, vehicle CRUD + activate/deactivate, secure token storage, proactive session-expiry warning UX (mitigates Pitfall 6 early even though no refresh endpoint exists).
**Addresses:** Sign up/login, profile, vehicle registration (FEATURES.md table stakes).
**Avoids:** Pitfall 6 (silent JWT expiry) — build expiry-tracking now, not retrofitted after a mid-shift logout is reported.

### Phase 2: Online/Offline + Foreground Location + Maps
**Rationale:** Must exist before job offers are meaningful (dispatch needs a locatable driver); also the natural place to establish the map-rendering foundation and app-level singleton pattern for location broadcasting before adding the higher-stakes WS singleton in Phase 3.
**Delivers:** Online/offline toggle gated on active vehicle, foreground `watchPositionAsync` broadcast to `location-producers`, map view with driver marker, mock-location basic check.
**Uses:** `expo-location`, `react-native-maps` (with `tracksViewChanges={false}` performance tuning from day one).
**Implements:** Location broadcaster as an app-level singleton (Architecture Pattern 1), decoupled from screen lifecycle.
**Avoids:** Pitfall 9 (marker re-render battery drain), Pitfall 10 (no mock-location guard).

### Phase 3: Realtime Job Offers — WebSocket + Accept
**Rationale:** This is the product's core value proposition and highest-risk component; should be built and hardened before trip lifecycle, since trip lifecycle is meaningless without a reliable path to getting assigned a trip. Requires Phase 2's online-toggle state and Phase 1's auth.
**Delivers:** WS client singleton (connect/reconnect/backoff/replay), pending-offer UI with server-timestamp-derived countdown, accept mutation via `driver-request-handler`, explicit "offer lost the race" UI state.
**Addresses:** Realtime job offer delivery, accept within TTL (FEATURES.md P1 table stakes).
**Avoids:** Pitfall 3 (WS silently dying in background — reconnect-on-foreground is a core acceptance criterion here, not hardening), Pitfall 5 (first-wins race UX gap — test with 2 concurrent driver sessions).
**Blocked by:** JWT audience mismatch (external backend blocker, must be resolved before this phase is testable end-to-end).

### Phase 4: Push Notifications for Job Offers
**Rationale:** Sequenced right after WS because it's the load-bearing fallback for the background/killed-app case that WS alone cannot cover (per Architecture Pattern 3 and Pitfall 3's own recommendation) — shipping WS without this leaves the core value prop half-finished.
**Delivers:** `expo-notifications` + FCM v1 setup, notification-type + full-screen-intent messages (not data-only), deep-link-to-offer-screen on tap, `getLastNotificationResponse()` cold-start handling.
**Addresses:** Push notifications when backgrounded/killed (FEATURES.md P1 table stakes).
**Avoids:** Pitfall 2 (data-only FCM undelivered when killed) — scope explicitly as "notification-type + full-screen-intent," verify with the app force-stopped before calling this phase done.

### Phase 5: Trip Lifecycle + Cash Collection
**Rationale:** Depends on Phase 3's accept flow; is otherwise a comparatively standard CRUD-over-REST feature set with lower realtime risk.
**Delivers:** Start/end/cancel trip, cash-collection confirmation screen, trip state machine wired through Zustand.
**Addresses:** Trip lifecycle actions (FEATURES.md table stakes).
**Implements:** Trip state machine (Architecture Pattern — explicit states, not scattered booleans).

### Phase 6: Trip History + Earnings Summary
**Rationale:** Natural byproduct of Phase 5's completed-trip data; low complexity, high expected-by-users value — recommended addition over PROJECT.md's original Active list.
**Delivers:** Trip history list, basic today/week earnings totals.
**Addresses:** Trip history, earnings summary (FEATURES.md — flagged gaps, recommended for v1).

### Phase 7: Background Location Tracking
**Rationale:** Explicitly deferred to "later phase" per PROJECT.md; sequenced after the core loop is proven foreground-only, since this phase carries the heaviest Android-platform risk (OEM killers, Android 14 foreground-service policy, Play Store review).
**Delivers:** `expo-task-manager`-backed background location, Android foreground-service notification, OEM battery-exemption onboarding flow, Play Console background-location disclosure + declaration.
**Avoids:** Pitfall 1 (OEM battery killers), Pitfall 4 (Android 14 foreground-service crash/rejection), Pitfall 8 (Play policy review delay) — all three should be budgeted as first-class deliverables of this phase, not follow-up bug fixes.

### Phase Ordering Rationale

- Dependency chain from FEATURES.md (`vehicle active → online → WS connected → accept → trip lifecycle → cash → history/earnings`) directly drives Phases 1–6's order.
- WS (Phase 3) is deliberately sequenced before full push hardening (Phase 4) and trip lifecycle (Phase 5) because it's both the highest architectural risk and the literal core value proposition — get the hardest, most important thing working end-to-end first, per Architecture's own emphasis.
- Background location is pushed to the end (Phase 7) both because PROJECT.md explicitly defers it and because it concentrates nearly all of the Critical Pitfalls (#1, #4, #8) — isolating it avoids these OS-platform risks contaminating earlier, lower-risk phases.
- Trip history/earnings (Phase 6) is sequenced after trip lifecycle because it's data-dependent on completed trips existing, but before background location because it's low-risk, high-value, and should ship before tackling the hardest remaining phase.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (WebSocket job offers):** Needs research-phase — reconnect/backoff/replay semantics against the real `websocket-gateway` server timeout config, plus resolving the JWT audience blocker with backend, are non-trivial integration points not fully specified by generic WS patterns.
- **Phase 4 (Push notifications):** Needs research-phase — full-screen-intent notification config on Android 14/15 is an actively-changing area (per Pitfalls sources), and FCM v1 + EAS credential setup has several sequencing gotchas.
- **Phase 7 (Background location):** Needs research-phase — OEM-specific battery exemption UX, Android 14 foreground-service-type declarations, and Play Console policy review are all platform-specific, high-stakes, and not solvable from generic Expo docs alone.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Auth/profile/vehicles):** Well-documented CRUD + secure-storage patterns, no novel risk.
- **Phase 5 (Trip lifecycle):** Standard REST CRUD against an already-mapped backend contract, low realtime risk.
- **Phase 6 (Trip history/earnings):** Standard list/aggregate UI over already-fetched data.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (core), MEDIUM (maps/New Arch interaction) | Versions verified against npm registry + Expo official changelogs; `react-native-maps` Fabric support is genuinely still in progress upstream, not a research gap |
| Features | MEDIUM-HIGH | Feature landscape well-corroborated across Uber/Bolt/Grab/Lyft official and community sources; specific numeric details (heatmap refresh intervals etc.) are LOW confidence but not load-bearing for this project since those features are deferred |
| Architecture | MEDIUM-HIGH | Component patterns are well-established RN/Expo ecosystem practice; specifics correctly adapted to this project's already-decided stack and real backend contract gaps rather than generic |
| Pitfalls | MEDIUM-HIGH | Android background-execution and FCM-priority behavior verified against official Firebase/Android docs and expo/expo GitHub issues; OEM battery-killer specifics are well-documented community knowledge but should be re-verified against dontkillmyapp.com for the exact device models used in testing |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Document/vehicle KYC verification:** Unclear whether `go-ride-backend` enforces this server-side today or it's entirely missing. This changes whether "vehicle registration" is a one-phase or two-phase feature — needs a direct question to backend before Phase 1 is fully scoped in the roadmap.
- **JWT audience mismatch:** Confirmed blocking gap (`aud=go-ride-clients` issued vs. `go-ride-drivers`/`go-ride-driver-app` expected) — external blocker that must be resolved before Phase 3 can be tested end-to-end against real services; track as a cross-repo dependency, not a client-side work item.
- **No refresh-token endpoint:** Confirmed non-blocking but UX-shaping gap (60-min hard expiry) — client-side proactive expiry warning is a required mitigation baked into Phase 1 and Phase 3, not deferred.
- **`location-producers` unauthenticated despite configured JWT secret:** External backend gap; client should still send auth headers correctly so it "just works" once backend closes this, but this app cannot self-resolve it.
- **No REST fallback for pending job offers:** Confirmed architecture constraint (not a gap to fix client-side) — reconnect-replay via WS is the only reconciliation path besides push; do not build a polling workaround (Anti-Pattern 4).

## Sources

### Primary (HIGH confidence)
- [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57), [SDK 55](https://expo.dev/changelog/sdk-55), [SDK 56](https://expo.dev/changelog/sdk-56) — version/architecture facts
- [Expo Router docs](https://docs.expo.dev/router/introduction/), [Expo TaskManager docs](https://docs.expo.dev/versions/latest/sdk/task-manager/), [Expo Notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/), [Expo Location docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [Firebase: Android message priority](https://firebase.google.com/docs/cloud-messaging/android-message-priority), [Firebase Blog: FCM Android delivery (Apr 2025)](https://firebase.blog/posts/2025/04/fcm-on-android/)
- [Android Developers: Foreground service types required (API 34)](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- [Expo Push Notifications FCM v1 migration blog](https://expo.dev/blog/expo-push-notifications-migrating-to-fcm-v1)
- npm registry version queries (2026-08-01) for all listed package versions
- Internal project context: `/Users/shawonkanji/Documents/projects/go-ride-driver-app/.planning/PROJECT.md` — authoritative for backend contract gaps and prior decisions

### Secondary (MEDIUM confidence)
- [react-native-maps GitHub releases + Discussion #5355](https://github.com/react-native-maps/react-native-maps/discussions/5355) — New Architecture support status
- [NativeWind v5 docs/migration guide](https://www.nativewind.dev/v5) — pre-release status
- [expo/expo GitHub #26846, #27336](https://github.com/expo/expo/issues/26846) (Android 14 foreground service), [#14078, #31886](https://github.com/expo/expo/issues/14078) (killed-state notification handling)
- [dontkillmyapp.com](https://dontkillmyapp.com) — OEM battery management reference
- [Uber Driving Insights dashboard blog](https://www.uber.com/us/en/blog/driving-insights-dashboard/), [Bolt driver safety page](https://bolt.eu/en/driver/safety/) — competitor feature landscape
- [Obytes React Native/Expo Starter structure](https://starter.obytes.com/getting-started/project-structure/), [Ably WebSocket challenges](https://ably.com/topic/websockets-react-native) — architecture pattern corroboration

### Tertiary (LOW confidence)
- Uber driver-community forum threads (navigation preference) — directional signal only, not load-bearing
- Ride-hailing dev-agency blogs (icoderzsolutions, vivocabs, zetaton, grepixit) — used only where consistent across all sources
- Trade press on Bolt driver verification (TechMoran, Connecting Africa) — corroborated by Bolt's own official safety page

---
*Research completed: 2026-08-01*
*Ready for roadmap: yes*
