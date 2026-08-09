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
- [ ] **VEH-03**: Driver can activate/deactivate a vehicle — **as of 2026-08-09, `go-ride-backend` itself now enforces a KYC gate on `POST /vehicles/{id}/activate` regardless of this app's own scope** (see VEH-04): the driver's identity `kyc_status` must be `approved` and the target vehicle must have all 5 required document types (registration, photo front/back/side, number plate) approved, or the backend returns `403 KYC_NOT_APPROVED`/`VEHICLE_NOT_VERIFIED`. Since this app has no upload UI in v1, testing/demo requires an operator to manually flip these to `approved` directly in Postgres (no backoffice endpoint exists on the backend either). The original "no gate for v1" framing describes this app's UI scope, not backend behavior.

### Presence & Location

- [ ] **PRES-01**: Driver can toggle online/offline status, gated on having at least one active vehicle — **and, as of 2026-08-09, also gated by the backend on the same KYC approval described under VEH-03** (`PATCH /driver/online` returns `403 KYC_NOT_APPROVED` if driver identity isn't approved, or `403 VEHICLE_NOT_VERIFIED` if the currently active vehicle's documents aren't). See VEH-03/VEH-04.
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

- **VEH-04**: Document upload / admin approval step before a vehicle can go online — **no longer backend-blocked as of 2026-08-09.** `go-ride-backend` now implements the full driver-facing flow: `POST /api/v1/driver/kyc/documents/upload-url` (presigned S3/AIStor PUT URL) → driver uploads directly to object storage → `POST /api/v1/driver/kyc/documents/confirm`. Two independent tracks: 5 driver-identity documents (selfie, govt ID front/back, driving license front/back) aggregate into `drivers.kyc_status`; 5 vehicle-scoped documents (registration, photo front/back/side, number plate) are tracked per `vehicle_id` and required in full before that specific vehicle is considered verified — a driver with two vehicles needs both fully documented independently. `GET /api/v1/driver/kyc/status` returns current status + documents. **Still missing on the backend**: any reviewer/backoffice surface — approving or rejecting a document is a direct database update today, no admin login or review endpoints exist. This requirement remains deferred to v2 by this app's own choice (not a backend constraint anymore) — promotable to v1 whenever desired, though VEH-03/PRES-01 above mean the backend enforces this regardless of whether the app builds the UI. Full detail: `go-ride-backend/doc/DRIVER_KYC_PLAN.md`.

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

**v2 requirements (not mapped — deferred):** PLAT-01, PAY-01, LOC-01, OFFER-05, VEH-04 (VEH-04 is deferred by choice, not by backend blocker, as of 2026-08-09 — see its entry above)

---
*Requirements defined: 2026-08-01*
*Last updated: 2026-08-09 — VEH-03/PRES-01 updated and VEH-04 unblocked to reflect go-ride-backend's new KYC document verification feature (per-driver identity + per-vehicle document approval, gating online/activate); backend has no reviewer UI yet, approval is a manual DB update*
