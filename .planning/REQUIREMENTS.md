# Requirements: go-ride-driver-app

**Defined:** 2026-08-01
**Core Value:** A driver can reliably go online, get matched to a nearby rider, and complete a cash trip end-to-end without missing or losing a job offer.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Driver can sign up with email + password
- [ ] **AUTH-02**: Driver can log in and stay logged in across app restarts (session persisted via secure storage)
- [ ] **AUTH-03**: Driver can view and edit their profile
- [ ] **AUTH-04**: Driver can log out

### Vehicles

- [ ] **VEH-01**: Driver can register a vehicle
- [ ] **VEH-02**: Driver can list, view, and update their registered vehicles
- [ ] **VEH-03**: Driver can activate/deactivate a vehicle — no separate document-verification/approval gate for v1, an active vehicle record alone is sufficient to go online

### Presence & Location

- [ ] **PRES-01**: Driver can toggle online/offline status, gated on having at least one active vehicle
- [ ] **PRES-02**: While online, the app broadcasts the driver's foreground location to the backend on a tiered interval
- [ ] **PRES-03**: Driver sees their current location on a map while online

### Job Offers

- [ ] **OFFER-01**: Driver receives job offers in realtime over a WebSocket connection while online
- [ ] **OFFER-02**: Driver sees pending job offers automatically replayed on WebSocket reconnect (matches the backend's replay-on-connect contract)
- [ ] **OFFER-03**: Driver can accept a job offer via HTTP before its TTL expires (first-wins)
- [ ] **OFFER-04**: Driver sees a clear "offer expired / already taken" state when they lose the accept race or the TTL lapses

### Trip Lifecycle

- [ ] **TRIP-01**: Driver can start a trip once assigned
- [ ] **TRIP-02**: Driver can end a trip and see the final fare
- [ ] **TRIP-03**: Driver can collect cash payment and mark the trip complete
- [ ] **TRIP-04**: Driver can cancel an ongoing trip with a reason

### Trip History & Earnings

- [ ] **HIST-01**: Driver can view a list of past completed trips
- [ ] **HIST-02**: Driver can view a basic earnings summary (e.g. total / today)

### Notifications

- [ ] **NOTIF-01**: Driver receives a push notification for a new job offer when the app is backgrounded or killed, using notification-type FCM messages (not data-only) so delivery survives Android killing the app
- [ ] **NOTIF-02**: Tapping a job-offer push notification opens the app to the relevant offer/trip screen

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Platform

- **PLAT-01**: iOS build, permissions, and store distribution (deferred — no iOS device available yet; not descoped)

### Payments

- **PAY-01**: In-app payment gateway integration (deferred — MVP is cash-only, driver-confirmed)

### Location

- **LOC-01**: Background location tracking while app is backgrounded (foreground-only broadcasting is in v1; background tracking carries its own Android foreground-service/OEM-battery-killer risk and is scoped as its own later phase)

### Job Offers

- **OFFER-05**: Explicit driver decline/reject-offer action (blocked — backend has no reject endpoint yet; v1 only supports losing an offer via TTL expiry)

### Verification

- **VEH-04**: Document upload / admin approval step before a vehicle can go online (blocked — backend has no verification fields/flow today; revisit if backend adds this)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Phone number + OTP auth | Email+password matches existing go-ride-backend exactly; switching would require backend changes not currently planned |
| Proprietary turn-by-turn navigation | Driver-community consensus (and cost) favors map display + deep-link to Google Maps/Waze for guidance rather than building nav in-app |
| In-app chat / masked calling with rider | Blocked on backend capabilities that don't exist yet |
| Demand heatmap | Blocked on backend capabilities that don't exist yet; not core to this app's value proposition |
| Gamification / driver incentives | Not core to MVP ride loop |
| Multi-stop trips | Backend trip model doesn't support this yet |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| VEH-01 | Phase 1 | Pending |
| VEH-02 | Phase 1 | Pending |
| VEH-03 | Phase 1 | Pending |
| PRES-01 | Phase 2 | Pending |
| PRES-02 | Phase 2 | Pending |
| PRES-03 | Phase 2 | Pending |
| OFFER-01 | Phase 3 | Pending |
| OFFER-02 | Phase 3 | Pending |
| OFFER-03 | Phase 3 | Pending |
| OFFER-04 | Phase 3 | Pending |
| NOTIF-01 | Phase 4 | Pending |
| NOTIF-02 | Phase 4 | Pending |
| TRIP-01 | Phase 5 | Pending |
| TRIP-02 | Phase 5 | Pending |
| TRIP-03 | Phase 5 | Pending |
| TRIP-04 | Phase 5 | Pending |
| HIST-01 | Phase 6 | Pending |
| HIST-02 | Phase 6 | Pending |

**Coverage:** 22/22 v1 requirements mapped ✓

**v2 requirements (not mapped — deferred):** PLAT-01, PAY-01, LOC-01, OFFER-05, VEH-04

---
*Requirements defined: 2026-08-01*
*Last updated: 2026-08-01 after roadmap creation (traceability populated)*
