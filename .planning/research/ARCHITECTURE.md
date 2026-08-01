# Architecture Research

**Domain:** React Native (Expo) ride-hailing driver app — client-side architecture
**Researched:** 2026-08-01
**Confidence:** MEDIUM-HIGH (component patterns are well-established across the RN/Expo ecosystem; specifics are adapted to this project's already-decided stack and backend contract, not independently re-litigated)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  Expo Router file-based screens · NativeWind components · react-      │
│  native-maps view · trip/job-offer UI (countdown, accept sheet)        │
├───────────────┬───────────────┬───────────────┬────────────────────────┤
│  Auth screens  │ Profile/      │ Online toggle │ Trip lifecycle screens │
│  (login/signup)│ Vehicle CRUD  │ + map/offer UI│ (start/end/cash/cancel)│
└───────┬────────┴──────┬────────┴──────┬────────┴───────────┬───────────┘
        │                │               │                    │
┌───────┴────────────────┴───────────────┴────────────────────┴──────────┐
│                     STATE / DATA LAYER                                  │
│  ┌─────────────────────────┐   ┌────────────────────────────────────┐  │
│  │ TanStack Query           │   │ Zustand (or equiv.) session store  │  │
│  │ — server-owned data:     │   │ — ephemeral/local state:           │  │
│  │   profile, vehicles,     │   │   auth tokens (mirrors SecureStore)│  │
│  │   trip history, accept   │◄──┤   online/offline flag              │  │
│  │   mutation                │   │   WS connection status             │  │
│  └───────────┬───────────────┘   │   current trip state machine       │  │
│              │                   │   pending job offer + TTL countdown│  │
│              │                   └──────────────┬─────────────────────┘  │
├──────────────┴──────────────────────────────────┴───────────────────────┤
│                  REALTIME + BACKGROUND LAYER (app-level singletons)      │
│  ┌────────────────────┐  ┌─────────────────────┐  ┌────────────────┐   │
│  │ WebSocket client    │  │ Location broadcaster │  │ Push notif.    │   │
│  │ (hand-rolled)        │  │ (foreground watcher, │  │ handler        │   │
│  │ connect/reconnect,   │  │  later: TaskManager   │  │ (expo-         │   │
│  │ replay-on-connect,   │  │  background task)     │  │  notifications)│   │
│  │ heartbeat, AppState-  │  │                       │  │                │   │
│  │ aware lifecycle       │  │                       │  │                │   │
│  └──────────┬───────────┘  └───────────┬───────────┘  └───────┬────────┘   │
├─────────────┴──────────────────────────┴──────────────────────┴───────────┤
│                        NETWORKING LAYER                                    │
│  Typed API client (fetch/axios) — JWT header injection, Idempotency-Key,   │
│  X-Correlation-ID generation, 401 → forced-relogin handling (no refresh)   │
├─────────────────────────────────────────────────────────────────────────┤
│                        PERSISTENCE LAYER                                   │
│  expo-secure-store (tokens, PII) · AsyncStorage/MMKV (Query cache,         │
│  non-sensitive UI prefs)                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                go-ride-backend (auth) + go-ride-kafka-consumers
                services (driver-request-handler, websocket-gateway,
                location-producers) — external, not modified by this app
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Presentation layer | Screens, feature-local components, forms, map rendering | Expo Router (file-based routes) + NativeWind v4; feature folders each own their screens/components |
| Server-state cache | Fetch/cache/invalidate/mutate anything the backend owns (profile, vehicles, trip history, job-offer accept) | TanStack Query — `useQuery`/`useMutation` per feature, query-key factories per resource |
| Session/ephemeral state store | Auth tokens (in-memory mirror), online/offline flag, WS connection status, current trip state machine, pending job offer + TTL countdown | Zustand store(s) — small, composable, no server data duplicated here |
| Realtime connection layer | Own the single WebSocket connection lifecycle: connect (with token as query param per backend contract), reconnect w/ backoff, replay-on-connect reconciliation, heartbeat/ping, AppState-aware suspend/resume | App-level singleton module (not a React hook tied to screen mount) exposing an event emitter or direct Zustand-store writes |
| Background/foreground location layer | Poll device GPS, throttle, POST to `location-producers` while driver is online | `expo-location` `watchPositionAsync` (foreground); `expo-task-manager` + Android foreground service (background, later phase) |
| Push notification layer | Receive job-offer pushes when app is backgrounded/killed, deep-link into the right screen on tap, reconcile with WS/REST rather than trusting the push payload as truth | `expo-notifications`, listener registered at module top-level, `getLastNotificationResponse()` checked on cold start |
| Networking layer | Attach JWT, `Idempotency-Key`, `X-Correlation-ID` headers; centralize 401 handling | Thin typed fetch/axios wrapper, one per backend service base URL (auth vs driver-request-handler vs location-producers) |
| Persistence layer | Token storage (secure), Query cache persistence | `expo-secure-store` for tokens; `@tanstack/query-async-storage-persister` + MMKV/AsyncStorage for cache |

## Recommended Project Structure

```
src/
├── app/                       # Expo Router routes (file-based) — thin, delegate to features
│   ├── (auth)/                 # login, signup — unauthenticated stack
│   ├── (app)/                  # authenticated stack, guarded by auth state
│   │   ├── (tabs)/              # home/online-toggle, trips, profile tabs
│   │   └── trip/[tripId].tsx    # active trip screen
│   └── _layout.tsx              # root layout: providers, auth guard, deep-link handling
├── features/                  # feature-based modules — the bulk of the app
│   ├── auth/                   # login/signup forms, token refresh-less session logic
│   ├── profile/                 # profile view/edit
│   ├── vehicles/                 # vehicle CRUD, active-vehicle gating
│   ├── availability/              # online/offline toggle, ties into location + WS lifecycle
│   ├── job-offers/                 # WS offer UI, countdown, accept mutation
│   └── trips/                       # trip lifecycle: start/end/cash/cancel, map/route UI
│       └── each feature/: screens/, components/, api.ts (Query hooks), store.ts (if needed)
├── realtime/                  # app-level singletons, NOT feature-scoped
│   ├── websocket-client.ts     # connection lifecycle, reconnect/backoff, replay handling
│   └── push-notifications.ts    # expo-notifications setup, listeners, deep-link resolution
├── location/                  # background/foreground location broadcaster (own module, not a feature)
├── api/                       # typed API clients per backend service, shared request/response types
│   ├── auth-client.ts
│   ├── driver-request-client.ts
│   └── location-client.ts
├── stores/                    # cross-feature Zustand stores (session, connection status, trip state machine)
├── components/                # truly generic, reusable UI primitives (buttons, sheets) — design system
├── theme/                     # NativeWind tokens, brand colors/typography
└── lib/                       # generic utilities (id generation, date/time, permissions helpers)
```

### Structure Rationale

- **`app/` stays thin:** Expo Router files should mostly import and render a feature's screen component, keeping routing/deep-linking concerns separate from feature logic — this matters here because push-notification deep links and WS-driven navigation (e.g., auto-navigate to the active trip screen on accept) both need a stable, predictable route surface.
- **`realtime/` and `location/` are deliberately NOT inside `features/`:** both the WebSocket connection and the location broadcaster must have a lifecycle independent of any single screen's mount/unmount (a driver navigating from the map tab to the profile tab must not drop the WS connection or stop broadcasting location). Treating them as app-level singletons wired up once in the root layout avoids the single biggest architectural mistake in this domain (see Anti-Patterns).
- **`stores/` is small and cross-cutting on purpose:** most state should live in TanStack Query (server-owned) or be local component state. Only genuinely cross-feature, non-server state — auth session, online flag, WS status, active trip state machine, pending offer — belongs in a shared Zustand store, per this project's own architecture decision to keep the WS client hand-rolled and simple rather than pull in a heavier framework.

## Architectural Patterns

### Pattern 1: App-level realtime singleton, not a screen-scoped hook

**What:** The WebSocket client (and the location broadcaster) are instantiated once, outside the component tree — a module-scoped class/object — and wired to app lifecycle (root `_layout.tsx` mount, `AppState` changes, the `online` flag in the session store) rather than to any individual screen's `useEffect`.
**When to use:** Always, for connections whose lifetime must outlive the currently-focused screen — which is every connection in this app (a driver must stay connected/broadcasting while browsing other tabs).
**Trade-offs:** Slightly more setup than `useEffect`-per-screen; testing requires mocking the module rather than a hook. In exchange, it eliminates an entire class of "offer missed because I was on the profile tab" bugs.

**Example:**
```typescript
// realtime/websocket-client.ts
class DriverWebSocketClient {
  private ws: WebSocket | null = null;
  connect(token: string) {
    this.ws = new WebSocket(`${WS_URL}/ws/driver?token=${token}`);
    this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
    this.ws.onclose = () => this.scheduleReconnect();
  }
  private handleMessage(msg: DriverWSEvent) {
    if (msg.type === 'driver.job_offer.created.v1') {
      useSessionStore.getState().setPendingOffer(msg.payload);
    }
    // replayed offers on reconnect arrive the same way — no special-casing needed
  }
}
export const wsClient = new DriverWebSocketClient(); // singleton
```

### Pattern 2: Server state vs. session state split (TanStack Query + Zustand)

**What:** Anything the backend is the source of truth for (profile, vehicles, trip history, the accept-offer mutation's result) goes through TanStack Query, which owns caching/invalidation/retry. Anything that is purely client-local or realtime-derived (current online flag, WS connection status, in-flight trip state machine, the currently-pending job offer and its countdown) lives in Zustand and is written to directly by the WS client / location layer.
**When to use:** Consistently, from day one — mixing the two (e.g., caching job offers in Query, or refetching trip status by polling instead of trusting the WS push) creates stale-data bugs specific to this domain, where a 15-second offer TTL means any staleness is a functional bug, not just a UX one.
**Trade-offs:** Two mental models to hold instead of one "global store," but each is used for what it's good at — Query's retry/cache/invalidate machinery is wasted on WS-pushed ephemeral data, and Zustand has no answer for background refetch/cache-dedup that Query gives for free on the CRUD screens (profile, vehicles).

### Pattern 3: WS-first, push-as-wakeup-only for job offers

**What:** Push notifications for job offers are treated purely as an OS-level wakeup/deep-link mechanism, never as the data source. On tap (including cold start via `getLastNotificationResponse()`), the app navigates to the offer screen and re-establishes/relies on the WebSocket connection (which replays any still-pending offer) or a REST reconciliation call, rather than trusting the notification payload's offer details, which may be stale by the time the OS delivers it.
**When to use:** Any time a push channel and a realtime channel both exist for the same event — the realtime channel (with its own delivery/ordering guarantees, here backend-implemented as reconnect replay) should always win.
**Trade-offs:** Slightly more app-open latency (a beat to reconnect and reconcile) versus rendering the push payload immediately, but avoids showing a driver an offer that already expired or was won by someone else — worse than a brief loading state.

## Data Flow

### Job-offer flow (the critical path)

```
websocket-gateway --push--> WS client (singleton)
        │                        │
        │                        ▼
        │              Zustand: setPendingOffer(offer, ttl=15s)
        │                        │
        │                        ▼
        │              job-offers UI: countdown + accept CTA
        │                        │
        │                driver taps Accept
        │                        ▼
        │        POST /job-offers/{id}/accept  (driver-request-handler,
        │        idempotency-safe — first-wins lock server-side)
        │                        │
        │              ┌─────────┴─────────┐
        │           200 OK               409/loss
        │              ▼                     ▼
        │   Zustand: trip state machine   clear pendingOffer,
        │   → "assigned"; TanStack Query   toast "offer taken"
        │   invalidates trip-history        │
        │              ▼                     ▼
        │   navigate to active-trip screen  back to online/idle screen
```

### Location broadcast flow

```
online toggle ON (Zustand) ──> location broadcaster starts
        │
        ▼
expo-location watchPositionAsync (foreground; interval/distance-throttled)
        │
        ▼
POST driver location → location-producers (HTTP ingest)
        │
        ▼
(backend: Kafka → location-consumers → DB; out of this app's scope)

online toggle OFF / app backgrounded beyond foreground window ──> broadcaster stops
(background tracking via TaskManager + Android foreground service is a later phase,
per PROJECT.md's explicit scope note)
```

### Auth / session flow (shaped by a real backend gap)

```
login (email+password) → go-ride-backend
        │
        ▼
JWT stored in SecureStore + mirrored in Zustand session store (in-memory,
avoids reading SecureStore synchronously on every request)
        │
        ▼
API client injects Authorization header on every request; WS client passes
token as query param on connect
        │
        ▼
No refresh-token endpoint exists (PROJECT.md, confirmed backend gap) → 60-min
hard expiry. Architecture must proactively warn ("session ending soon") and
force a clean re-login+reconnect flow rather than silently failing mid-shift —
a driver going offline mid-trip because of a silent 401 is a severe UX bug.
```

### Key Data Flows

1. **Job offer receipt → accept race:** WS push is the primary channel; HTTP accept is a first-wins race the client must handle gracefully on loss (see above) — this is the single highest-risk flow in the app and should be built and tested before anything else realtime-related.
2. **Reconnect reconciliation:** on any WS reconnect (network blip, app foregrounded after backgrounding, cold start), the server replays any still-pending offer for that driver — client logic must treat "replayed offer" identically to "fresh offer," not as a special case, since the backend contract already normalizes this.
3. **Trip state machine as the UI's source of truth:** rather than deriving "what screen am I on" from ad hoc booleans, model driver status as an explicit state machine (`offline → online_idle → offer_pending → trip_assigned → trip_in_progress → trip_completing → online_idle`) held in the session store; screens/navigation read from it, WS events and HTTP mutation results write to it. Keeps a fast-moving realtime domain from turning into scattered boolean flags.

## Scaling Considerations

This is a single-tenant mobile client, so "scale" here means session robustness and feature growth over time, not concurrent-user load (that's the backend's concern). Reframed accordingly:

| Stage | Architecture Adjustments |
|-------|--------------------------|
| MVP (this milestone) | Foreground-only location, single WS connection, no offline queueing beyond TanStack Query's built-in retry — sufficient for the cash-trip, Android-first scope |
| Post-MVP growth (background location, iOS, push hardening) | Background location via TaskManager + foreground service becomes its own tested module; push notification reliability (Android 12+ restrictions, iOS APNs) needs its own validation pass; consider `expo-background-task` for any periodic (non-continuous) background work |
| Mature (multi-region, payment gateway, driver ratings/analytics) | Likely needs a proper offline-mutation queue (e.g., persisted Query mutations) for spotty-connectivity regions, and probably a heavier state-machine library (XState) if the trip lifecycle grows branches (multi-stop trips, scheduled rides) beyond what a hand-rolled Zustand state machine comfortably models |

### Scaling Priorities

1. **First bottleneck: WS reconnect storms / battery drain from location polling.** A driver online for an 8-hour shift is the normal case, not the edge case — reconnect backoff must be capped and jittered, and foreground location interval must be tuned for battery, not just correctness, before this ships.
2. **Second bottleneck: trip-state/UI complexity as more trip states are added** (multi-stop, scheduled, in-app payment). The hand-rolled Zustand state machine is right-sized for MVP's linear lifecycle; if branching grows significantly, migrating just that slice to XState (not the whole app) is the documented escape hatch.

## Anti-Patterns

### Anti-Pattern 1: WebSocket/location lifecycle tied to a screen's `useEffect`

**What people do:** Open the WebSocket connection (or start the location watcher) in a `useEffect` on the "home" or "map" screen, and tear it down on unmount.
**Why it's wrong:** The driver loses their realtime connection and stops broadcasting location the moment they navigate to Profile or Trip History — silently dropping them from dispatch consideration while the app still shows "online."
**Do this instead:** Own both lifecycles at the app root, driven by the `online` flag in session state and `AppState`, completely decoupled from which screen is currently focused (Pattern 1 above).

### Anti-Pattern 2: Trusting push notification payload as offer data

**What people do:** Render the job offer's fare/pickup details straight from the push notification payload for a snappier cold-start experience.
**Why it's wrong:** With a ~15s offer TTL and no delivery-time guarantee on push, the payload can be stale or already-expired/already-won by the time the driver taps it — leading to a driver "accepting" an offer that's already gone.
**Do this instead:** Use the push only to wake the app and deep-link to the offer screen; always reconcile against the live WS connection (replay) or a fresh fetch before showing accept-able details (Pattern 3 above).

### Anti-Pattern 3: Storing JWTs in AsyncStorage or Zustand's persisted storage

**What people do:** Persist the whole session store (including tokens) via `zustand/middleware`'s `persist` backed by AsyncStorage, for simplicity.
**Why it's wrong:** AsyncStorage is unencrypted on-device storage; tokens are sensitive credentials and should not sit there, especially for a driver app that will eventually also hold PII (vehicle docs, payout info).
**Do this instead:** Tokens go in `expo-secure-store` only; if they need to be in the Zustand store for synchronous access in interceptors, treat that as an in-memory mirror hydrated from SecureStore at startup, not the persisted source of truth.

### Anti-Pattern 4: Polling for trip/offer status instead of trusting the WS push

**What people do:** Add a `setInterval` REST poll for "any new job offers?" or "trip status changed?" as a safety net alongside the WebSocket.
**Why it's wrong:** The backend currently has no REST fallback endpoint for pending offers (PROJECT.md confirms this gap) — a polling loop here is either dead code hitting a 404, or (if built against some other endpoint) a source of double-processing/race conditions with the WS-driven flow, and burns battery for no benefit.
**Do this instead:** Lean entirely on the documented reconnect-replay contract; if the missing REST fallback becomes a real reliability problem in practice, that's a backend follow-up (per PROJECT.md's constraint that backend gaps are external, not client work-arounds).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `go-ride-backend` (auth) | REST, email+password login/signup | No refresh-token endpoint — architecture must handle hard 60-min expiry gracefully (see Auth flow above) |
| `driver-request-handler` | REST, JWT-authenticated | Profile, vehicles, job-offer accept, trip lifecycle (start/end/cash/cancel) — `Idempotency-Key` and `X-Correlation-ID` headers expected per repo conventions |
| `websocket-gateway` (`/ws/driver`) | WebSocket, token passed as query param | Pushes job offers, replays pending offers on reconnect; JWT audience mismatch is a known blocking backend gap (`aud=go-ride-driver-app` expected vs `go-ride-clients` issued) — must be resolved backend-side before this layer works end-to-end, not a client fix |
| `location-producers` | REST/HTTP ingest (not WS) | No auth enforcement currently despite configured JWT secret (known backend gap) — client should still send the auth header correctly so it "just works" once the backend closes that gap |
| Google Maps (Maps SDK for Android, Places API, Routes API) | Native SDK via `react-native-maps` + Places/Routes REST | API key already created/restricted per PROJECT.md; Routes/Places calls should go through the typed API client layer like any other external call, not be scattered in map components |
| Push notification delivery (FCM via Expo push service) | `expo-notifications` + EAS push credentials | Requires config-plugin setup in `app.json`/EAS build profile; Android 12+ has stricter background/notification-channel requirements to account for |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Presentation (screens) ↔ TanStack Query | Hooks (`useQuery`/`useMutation`) | Screens never call the API client directly — always through a feature's `api.ts` query hooks |
| Presentation (screens) ↔ Zustand session store | Selector hooks | Screens subscribe to slices (e.g., `useSessionStore(s => s.tripState)`), never read/write the whole store, to avoid unnecessary re-renders during high-frequency updates (e.g., countdown ticking) |
| WS client ↔ Zustand store | Direct writes from the singleton module | The WS client is the only writer for WS-derived state (pending offer, connection status) — screens read-only |
| WS client / push handler ↔ Navigation | Imperative navigation calls (Expo Router's `router.push`) triggered from the realtime layer, not from screens polling state | Keeps "an offer arrived, go show it" and "app opened via notification, go to X" logic centralized rather than duplicated per screen |
| Location broadcaster ↔ Availability feature | Started/stopped by the `online` flag transition, not by the location module independently deciding | Availability/online-toggle feature owns the decision; location module is a dumb start/stop service |

## Sources

- [React Native / Expo feature-based folder structure (Zustand + React Query)](https://gist.github.com/mksglu/aca22b90d33df58ca9c394a3ee15e83e) — MEDIUM confidence, community pattern reference
- [Obytes React Native/Expo Starter — Project Structure](https://starter.obytes.com/getting-started/project-structure/) — MEDIUM confidence, widely-used opinionated Expo starter
- [Expo Router documentation — Introduction](https://docs.expo.dev/router/introduction/) — HIGH confidence, official docs
- [Expo Router vs React Navigation — 2026 decision guides](https://www.shipnative.dev/blog/expo-router-vs-react-navigation-2026) — MEDIUM confidence, multiple 2026 sources agree Expo Router is the default choice for new Expo projects
- [Expo TaskManager documentation](https://docs.expo.dev/versions/latest/sdk/task-manager/) — HIGH confidence, official docs
- [Expo Notifications documentation](https://docs.expo.dev/versions/latest/sdk/notifications/) and ["What you need to know about notifications"](https://docs.expo.dev/push-notifications/what-you-need-to-know/) — HIGH confidence, official docs
- [Expo notification background/killed-state handling issue discussion](https://github.com/expo/expo/issues/22969) — MEDIUM confidence, corroborates the "listener at module top-level + `getLastNotificationResponse`" pattern from official docs
- [Ably — Realtime apps with React Native and WebSockets: client-side challenges](https://ably.com/topic/websockets-react-native) — MEDIUM confidence, vendor content but technically sound on reconnection/heartbeat/AppState concerns
- [React Native WebSocket architecture best practices](https://www.xjavascript.com/blog/architecture-in-a-react-native-app-using-websockets/) — LOW-MEDIUM confidence, single blog source, used only for corroboration of widely-known patterns
- Ride-hailing client architecture corroboration: [Pusher — Build a ride-hailing app with React Native](https://pusher.com/tutorials/ride-hailing-react-native/) — LOW confidence (uses a different realtime vendor than this project), used only to confirm the general shape (maps + realtime channel + driver/passenger state) matches this project's own already-decided architecture
- This project's own `PROJECT.md` — HIGH confidence, authoritative for backend contract gaps (no refresh token, JWT audience mismatch, no REST offer fallback, unauthenticated `location-producers`) that directly shape the architecture above

---
*Architecture research for: React Native/Expo ride-hailing driver app (client-side)*
*Researched: 2026-08-01*
