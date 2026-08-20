# Roadmap: go-ride-driver-app

## Overview

The build follows the platform's own dependency chain: a driver must exist and have an active vehicle before they can go online; going online (with a broadcast location) is a prerequisite for receiving job offers; a reliable WebSocket offer pipeline must exist before push notifications can serve as its backgrounded/killed-app fallback; an accepted offer is what makes the trip lifecycle meaningful; and trip history/earnings are a byproduct of completed trips. Six phases take the driver from zero to a fully working, foreground cash-trip loop with realtime dispatch and push-notification resilience. Background location tracking (v2 requirement LOC-01) is explicitly out of this roadmap's v1 scope — it will become its own phase when pulled into a future milestone, kept isolated because it concentrates the heaviest Android OEM/foreground-service/Play-policy risk (see research/SUMMARY.md).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation — Auth, Profile, Vehicles** - Driver can sign up, log in, manage their profile, and register/manage vehicles
- [ ] **Phase 01.1: KYC — Identity & Vehicle Document Verification (INSERTED)** - Driver can upload identity and vehicle documents, track approval status, and understand why they're blocked until approved
- [ ] **Phase 2: Online/Offline + Foreground Location + Maps** - Driver with an active vehicle can go online, see themselves on a map, and broadcast location
- [ ] **Phase 3: Realtime Job Offers — WebSocket + Accept** - Online driver receives job offers over WebSocket (with reconnect replay) and can accept before TTL expiry
- [ ] **Phase 4: Push Notifications for Job Offers** - Backgrounded/killed-app driver still receives and can act on job offer notifications
- [ ] **Phase 5: Trip Lifecycle + Cash Collection** - Assigned driver can start, end, cancel, and collect cash for a trip
- [ ] **Phase 6: Trip History + Earnings Summary** - Driver can review past trips and a basic earnings summary

## Phase Details

### Phase 1: Foundation — Auth, Profile, Vehicles
**Goal**: A driver can create an account, manage their profile, and register vehicles so they're eligible to go online.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, VEH-01, VEH-02, VEH-03
**Success Criteria** (what must be TRUE):
  1. Driver can sign up with email + password and is authenticated immediately after
  2. Driver can close and reopen the app and remain logged in (session persisted via secure storage, surviving app restart)
  3. Driver can view and edit their profile
  4. Driver can log out and is returned to the login screen
  5. Driver can register a vehicle, view/update their list of vehicles, and activate/deactivate any of them
**Plans**: TBD
**Note (added 2026-08-09):** verifying success criterion 5 end-to-end against a real backend now requires a manually KYC-approved test driver + vehicle (`go-ride-backend` blocks `POST /vehicles/{id}/activate` otherwise) — see REQUIREMENTS.md VEH-03/VEH-04 and `go-ride-backend/doc/DRIVER_KYC_PLAN.md`. Not a change to this phase's own requirements, just a new precondition for testing it.

### Phase 01.1: KYC — Identity & Vehicle Document Verification (INSERTED)
**Goal**: A driver can upload their identity and vehicle documents, track approval status, and understand why they're blocked from activating a vehicle or going online until approved.
**Depends on**: Phase 1
**Requirements**: KYC-01, KYC-02, KYC-03, KYC-04
**Success Criteria** (what must be TRUE):
  1. Driver can capture or pick and upload all 5 identity documents (selfie, govt ID front/back, driving license front/back) via the presigned-URL flow
  2. Driver can capture or pick and upload all 5 required documents for a specific vehicle (registration, photo front/back/side, number plate)
  3. Driver can view their current KYC status and, per document, its uploaded/approved/rejected state with rejection reason when applicable
  4. Driver can re-upload a rejected document and see it return to a pending state
  5. Driver attempting to activate a vehicle or go online while KYC is incomplete/rejected sees a clear explanation (not a raw `403`) with a path into the upload flow
**Plans**: TBD
**Note (added 2026-08-10):** Backend (`go-ride-backend`) is fully built for this phase already — `POST /driver/kyc/documents/upload-url`, `POST /driver/kyc/documents/confirm`, `GET /driver/kyc/status` (see `go-ride-backend/doc/DRIVER_KYC_PLAN.md`). This phase is driver-app UI only. Approving/rejecting uploaded documents remains a manual SQL update against Postgres during development — no backoffice/reviewer UI is in scope for this phase (by explicit choice).

### Phase 2: Online/Offline + Foreground Location + Maps
**Goal**: A driver with an active vehicle can go online and their live location is visible on-device and broadcast to the backend.
**Depends on**: Phase 1
**Requirements**: PRES-01, PRES-02, PRES-03
**Success Criteria** (what must be TRUE):
  1. Driver without any active vehicle cannot toggle online and understands why
  2. Driver with at least one active vehicle can toggle online/offline
  3. While online, the driver sees their current position rendered on a map
  4. While online, the app broadcasts the driver's foreground location to the backend on a tiered interval
**Plans**: 13 plans across 7 waves

Plans:
- [ ] 02-01-PLAN.md — Wave 1: deps, service base URLs, app.config.js for MAP_API_KEY, Jest mocks, haversineMeters
- [ ] 02-02-PLAN.md — Wave 1: remove (tabs), flatten routes under (app), rewrite all route literals
- [x] 02-03-PLAN.md — Wave 2: tailwind radii/font wiring, Plus Jakarta Sans loading, retokenise the 9 shared components
- [ ] 02-04-PLAN.md — Wave 2: base-URL-aware request helper, location/driver-trips clients, presence hooks, deriveOnlineGate
- [ ] 02-05-PLAN.md — Wave 3: location permissions, presence store, tiered broadcaster, layout-level lifecycle
- [ ] 02-06-PLAN.md — Wave 3: Button design variants, ScreenHeader, SectionCard, lucide Jest mock
- [x] 02-07-PLAN.md — Wave 4: TextInput focus/reveal, D01 Sign in and D02 Create account retrofit
- [ ] 02-08-PLAN.md — Wave 4: verification summariser, StatusDisc, DocumentTile row, D04 Verification hub retrofit
- [ ] 02-09-PLAN.md — Wave 5: SegmentedControl, VehicleCard rebuild, D05 Vehicles retrofit
- [ ] 02-10-PLAN.md — Wave 4: HomeMap and the D07 ConfirmOnlineSheet
- [ ] 02-11-PLAN.md — Wave 5: MenuRow and the D03 Menu screen at /menu
- [ ] 02-12-PLAN.md — Wave 6: ProfileChip, StatCards, useHomeCoords, D06 Home rebuild
- [ ] 02-13-PLAN.md — Wave 7: device checkpoints (Maps API key, online/offline + broadcast) and validation sign-off

**Note (added 2026-08-09):** same KYC precondition as Phase 1's note applies here — `PATCH /driver/online` now also requires driver identity + active-vehicle KYC approval on the backend, on top of the "has an active vehicle" check this phase's criteria already describe.

### Phase 3: Realtime Job Offers — WebSocket + Accept
**Goal**: An online driver reliably receives job offers in realtime and can act on them before they expire.
**Depends on**: Phase 2
**Requirements**: OFFER-01, OFFER-02, OFFER-03, OFFER-04
**Success Criteria** (what must be TRUE):
  1. Online driver receives a new job offer in realtime over the WebSocket connection
  2. If the WebSocket reconnects (e.g. after a background/foreground cycle), any pending offer is automatically replayed to the driver
  3. Driver can accept an offer via HTTP before its ~15s TTL expires and becomes the assigned driver (first-wins)
  4. If the driver loses the accept race or the TTL lapses, they see a clear "offer no longer available" state and cleanly return to waiting for the next offer
**Plans**: TBD

### Phase 4: Push Notifications for Job Offers
**Goal**: A driver with the app backgrounded or fully killed still learns about a new job offer and can get back into the app to act on it.
**Depends on**: Phase 3
**Requirements**: NOTIF-01, NOTIF-02
**Success Criteria** (what must be TRUE):
  1. Driver receives a push notification for a new job offer when the app is backgrounded
  2. Driver receives a push notification for a new job offer when the app has been fully killed (force-stopped), using notification-type FCM messages
  3. Tapping a job-offer push notification opens the app directly to the relevant offer/trip screen
**Plans**: TBD

### Phase 5: Trip Lifecycle + Cash Collection
**Goal**: A driver assigned to a trip can drive it through to completion and collect cash payment, or cancel it if needed.
**Depends on**: Phase 3
**Requirements**: TRIP-01, TRIP-02, TRIP-03, TRIP-04
**Success Criteria** (what must be TRUE):
  1. Driver can start a trip once assigned
  2. Driver can end a trip and see the final fare
  3. Driver can confirm cash collection and mark the trip complete
  4. Driver can cancel an ongoing trip with a reason, at any stage of the trip
**Plans**: TBD

### Phase 6: Trip History + Earnings Summary
**Goal**: A driver can review their past completed trips and understand what they've earned.
**Depends on**: Phase 5
**Requirements**: HIST-01, HIST-02
**Success Criteria** (what must be TRUE):
  1. Driver can view a list of their past completed trips
  2. Driver can view a basic earnings summary (e.g. total and today)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 01.1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation — Auth, Profile, Vehicles | 0/TBD | Not started | - |
| 01.1. KYC — Identity & Vehicle Document Verification (INSERTED) | 6/7 | In Progress|  |
| 2. Online/Offline + Foreground Location + Maps | 7/13 | In Progress|  |
| 3. Realtime Job Offers — WebSocket + Accept | 0/TBD | Not started | - |
| 4. Push Notifications for Job Offers | 0/TBD | Not started | - |
| 5. Trip Lifecycle + Cash Collection | 0/TBD | Not started | - |
| 6. Trip History + Earnings Summary | 0/TBD | Not started | - |

## Notes on Scope Deviation from Research

Research's suggested structure included a 7th phase ("Background Location Tracking"). That phase's only requirement, LOC-01, is explicitly deferred to v2 in REQUIREMENTS.md (foreground-only broadcasting is v1 scope; background tracking is its own later milestone due to OEM battery-killer and Android 14 foreground-service risk). Since every v1 requirement is fully covered by Phases 1–6, no v1 phase for background location exists in this roadmap — it will be added when that v2 requirement is pulled into a future milestone.

---
*Roadmap created: 2026-08-01*
*Updated 2026-08-09: added Phase 1/2 notes on go-ride-backend's new KYC verification gate — see PROJECT.md Context and REQUIREMENTS.md VEH-03/PRES-01/VEH-04.*
