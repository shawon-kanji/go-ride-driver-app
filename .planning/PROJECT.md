# go-ride-driver-app

## What This Is

An Android-first (for now) Expo/React Native app for drivers on the go-ride ride-hailing platform. A driver signs up, registers a vehicle, goes online, receives realtime job offers over a WebSocket connection, accepts via HTTP, drives the trip through its lifecycle (start → end → collect cash payment), and can go offline again. It integrates with an already-substantial Go microservices backend (`go-ride-backend` for auth, `go-ride-kafka-consumers/services/*` for dispatch/realtime) — this app is greenfield, the backend it talks to is not.

## Core Value

A driver can reliably go online, get matched to a nearby rider, and complete a cash trip end-to-end without missing or losing a job offer.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Driver can sign up and log in with email + password
- [ ] Driver can view and edit their profile
- [ ] Driver can register, list, update, and activate/deactivate vehicles (a driver needs an active vehicle before going online)
- [ ] Driver can toggle online/offline status
- [ ] While online, the app broadcasts the driver's location (foreground first; background tracking is a later phase)
- [ ] Driver receives job offers in realtime over a WebSocket connection, including replayed offers on reconnect
- [ ] Driver can accept a job offer (via HTTP, first-wins) before its ~15s TTL expires
- [ ] Driver can start a trip, end a trip, collect cash payment, and cancel a trip
- [ ] Driver receives push notifications for job offers when the app is backgrounded/killed
- [ ] The app has a deliberately bold/vibrant, non-generic visual identity consistent with the go-ride brand (shared later with the rider app)

### Out of Scope

- iOS support — deferred, not descoped. The user has no iOS device right now; the codebase stays cross-platform (Expo default), but no iOS-specific setup (Apple Developer account, TestFlight, background-mode entitlements, push cert testing) happens until a device/tester is available.
- In-app payment gateway — MVP is cash, driver-confirmed, matching how the backend already works. A real gateway is an explicit later phase, scoped jointly with backend changes.
- Phone number + OTP auth — email+password matches the existing backend; switching auth models would require backend changes not currently planned.
- Driver decline/reject-offer UX — the backend has no reject endpoint yet; losing an offer is only knowable via its TTL expiring. Revisit once backend adds one.

## Context

- Sibling repos (checked out alongside this one): `go-ride-backend` (Gin, user + driver auth, JWT), `go-ride-kafka-consumers` (Kafka-driven microservices: `cab-request-handler`, `driver-request-handler`, `trip-dispatch-worker`, `websocket-gateway`, `location-producers`), `go-ride-utils` (shared Go event struct definitions), and a sibling rider app `go-ride-user-app` being built in parallel with largely the same tech stack and design system.
- Full backend API contracts (auth, driver-request-handler, `/ws/driver`, location-producers) were mapped directly from the backend source code and cross-checked against `go-ride-kafka-consumers/docs/driver-rider-realtime-communication.md` and `docs/cab-request-flow.md` — no OpenAPI/Postman spec exists anywhere, so TypeScript API types in this app are hand-maintained mirrors of the Go DTOs, not codegenned.
- Known backend gap (blocking): `go-ride-backend` issues JWT tokens with `aud=go-ride-clients`, but `driver-request-handler` validates `aud=go-ride-drivers` and `websocket-gateway` validates `aud=go-ride-driver-app`. As configured today, this app's tokens will fail verification against both until the backend config is reconciled — needed before the online/job-offer phase can work end-to-end against real services.
- Known backend gaps (non-blocking but shape UX): no refresh-token endpoint (60-min hard expiry forces re-login), no REST fallback to list pending job offers (WS-connect replay is the only reconciliation path besides push), `location-producers` has no auth enforcement despite a configured JWT secret.
- A Google Cloud Maps API key has already been created and restricted (Android package + SHA-1, once the EAS project exists) to just Maps SDK for Android, Places API (New), and Routes API.
- A prior full architecture/prep plan (tech stack rationale, phased roadmap D0–D6, cross-app sequencing with the rider app) was researched and approved before this GSD project was initialized — that plan's content has been folded into this PROJECT.md and the requirements above; treat it as settled context, not open questions.

## Constraints

- **Tech stack**: Expo with a custom dev client (not Expo Go, not bare React Native CLI) — chosen for EAS Build/Update and config-plugin-based native module support (maps, background location, push).
- **Platform**: Android-first. No iOS device available; iOS work explicitly deferred.
- **Auth**: Email + password only, against the existing `go-ride-backend` — no OTP/phone auth work planned.
- **Payments**: Cash-only for MVP — no payment gateway integration in this milestone.
- **Design**: Must read as bold/vibrant and intentionally designed (Bolt/Grab-esque), not the default React Native template look or Uber's monochrome minimalism — this is a stated, non-negotiable product requirement, not a nice-to-have.
- **Backend is a dependency, not something this project modifies**: backend gaps/bugs found during planning (JWT audience mismatch, missing endpoints) are flagged as external blockers/follow-ups, not work items for this repo.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo + custom dev client over bare RN CLI | Fastest iteration with EAS Build/Update while still supporting the native modules (maps, background location, push) this app needs | — Pending |
| Android-first, iOS deferred | No iOS device available; Expo keeps the code cross-platform so this is a scheduling choice, not an architecture one | — Pending |
| Email+password auth (not phone/OTP) | Matches existing `go-ride-backend` auth exactly — zero backend changes needed to start | — Pending |
| Cash-only MVP, payment gateway deferred | Matches how the backend already works; avoids scoping a payment integration before the core ride loop is proven | — Pending |
| `react-native-maps` over `expo-maps` | `expo-maps` still immature on iOS and lacks animated-marker/rotated-heading/custom-polyline APIs this product needs | — Pending |
| Hand-rolled WebSocket client over a generic library | Protocol (query-param token auth, small message set, server-side replay-on-connect) is simple enough that a generic lib adds more friction than it saves | — Pending |
| NativeWind v4 + design tokens over Tamagui | Faster iteration on nailing the bold/vibrant visual language; Tamagui's compile-time perf edge isn't needed at this scale yet | — Pending |

---
*Last updated: 2026-08-01 after initialization*
