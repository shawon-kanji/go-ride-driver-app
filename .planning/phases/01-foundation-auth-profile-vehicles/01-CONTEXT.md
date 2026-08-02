# Phase 1: Foundation — Auth, Profile, Vehicles - Context

**Gathered:** 2026-08-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Driver can sign up (email + password), log in, stay logged in across app restarts, view/edit their profile, and register/list/update/activate vehicles — everything required before a driver is eligible to go online. Going online, location broadcasting, and the map itself are Phase 2, explicitly out of this phase's scope. This is also the app's bootstrap phase: the repo is currently empty (no `package.json`, no `src/`), so scaffolding the Expo project itself is part of this phase's delivery, not a separate step.

</domain>

<decisions>
## Implementation Decisions

### Auth & session UX
- Login is the default landing screen for a logged-out driver; Signup is reached via a link from Login (not a separate default landing choice).
- Form validation errors (both client-side zod failures and API error responses) are shown as a single banner/toast on submit — not inline per-field messages.
- Session-expiry warning: a dismissible countdown banner appears roughly 5 minutes before the 60-minute hard JWT expiry ("session ending soon, please re-login"). The backend has no refresh-token endpoint, so this is purely a proactive heads-up, not a recoverable-refresh flow.
- On an actual 401 (token truly expired/invalid): immediately clear the session and redirect to the login screen with a "your session expired" message. No retry-then-redirect — a 401 is treated as a hard stop, not a transient failure, since there's nothing to retry against.

### Profile scope
- Backend only allows editing `first_name`/`last_name` via `PATCH /driver/profile` — email, password, and account_status are not editable through any endpoint (no change-password endpoint exists at all). The Profile screen reflects exactly this: read-only email, editable name, plus a factual `account_status` badge (pending/active/blocked — all three values must be handled, not just "pending").
- Editing the name happens on a **separate "Edit profile" screen** (view screen has an Edit button that navigates away), not inline editing on the view screen itself.
- No "pending approval / awaiting review" messaging anywhere in the app — the backend does not gate login or the online-toggle on `account_status` in any way (a brand-new driver can go online immediately), so the UI must not imply a blocking review step that doesn't exist. The status badge is a neutral, factual label only.
- Logout clears the token, and if the driver happens to be online, makes a best-effort `PATCH /driver/online {is_online:false}` call before clearing the session and redirecting to login (best-effort: logout proceeds regardless of whether that call succeeds — never block logout on it).

### Vehicle activation UX
- The backend silently auto-deactivates whatever vehicle was previously active for a driver when a different vehicle is activated (one DB transaction, enforced by a unique partial index limiting a driver to exactly one active vehicle; no confirmation and no 409 from the backend). The app must not treat this as fire-and-forget: activating a vehicle requires a confirm dialog first ("Activating [X] will deactivate [Y] — continue?"), since the swap is otherwise silent and surprising from the driver's perspective.
- Active/inactive state is shown as a badge + action button per row in the vehicle list (not a radio-select list).
- There is no deactivate-only action anywhere in the UI — the backend has no deactivate endpoint (deactivation only ever happens as a side effect of activating a different vehicle). Do not build a disabled/hinted deactivate control; simply don't offer one.
- Zero-vehicles first-launch state: an empty-state view (illustration/message + a prominent "Register vehicle" CTA), not an auto-opened registration form.

### Vehicle list & registration form
- Registration/edit form includes all 5 backend fields: `plate_number`, `color`, `model_name`, `seat_count`, `category`.
- `category` (`normal`/`luxury`) is presented as a dropdown/picker control.
- `seat_count` (backend validates integer 1–20) is entered via a numeric stepper (+/- control), clamped to 1–20 client-side before submit.
- Vehicle list is a card list showing key fields (plate + model + active/inactive badge); tapping a card opens a detail/edit screen with all fields — mirrors the "separate edit screen" pattern chosen for profile.
- Exact visual polish (colors, spacing, the "bold/vibrant" brand identity PROJECT.md calls out as non-negotiable) is explicitly deferred to a dedicated UI-spec pass — this phase uses standard, clean form/list conventions and a minimal theme-tokens foundation only.

### Claude's Discretion
- Exact component internals (Button/TextInput/Banner/Card/Badge/ConfirmDialog/Stepper/Select primitives) — visual styling within the "standard conventions, minimal tokens" boundary above.
- Whether to add a low-emphasis "Remove vehicle" (delete) action on the vehicle detail screen — VEH-02 covers list/view/update, and the backend has a working delete endpoint, but no locked decision from discussion calls for or against a delete affordance in Phase 1 UI.
- Internal file/module organization beyond what's specified in the canonical refs (folder structure is already decided in ARCHITECTURE.md, not re-litigated here).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product/requirements
- `.planning/PROJECT.md` — core value, constraints (Android-first, email+password auth, cash-only MVP, bold/vibrant design non-negotiable), known backend gaps
- `.planning/REQUIREMENTS.md` — AUTH-01..04, VEH-01..03 acceptance criteria for this phase, traceability
- `.planning/ROADMAP.md` — Phase 1 boundary, success criteria, dependency chain rationale

### Architecture & stack (already researched and locked — do not re-derive)
- `.planning/research/ARCHITECTURE.md` — recommended project structure (`src/app`, `src/features`, `src/stores`, `src/api`, `src/components`, `src/theme`, `src/lib`), server-state-vs-session-state split (TanStack Query vs Zustand), Anti-Pattern 3 (tokens never in AsyncStorage/MMKV/persisted Zustand — SecureStore only)
- `.planning/research/STACK.md` — exact package/version choices (Expo SDK 57, RN 0.86.x, React 19.2.x, expo-router, @tanstack/react-query v5, zustand v5, NativeWind v4 pinned to Tailwind v3 — NOT v4/v4, react-hook-form + zod + resolvers, expo-secure-store, react-native-mmkv for non-sensitive state only), install commands, "What NOT to Use" table
- `.planning/research/PITFALLS.md` — Pitfall 6 (60-min hard JWT expiry, no refresh token — client-side proactive expiry handling required regardless of backend fix) and Pitfall 7 (stale dev client masking native config-plugin drift — rebuild dev client after any `app.json` native config change) are directly relevant to this phase; others are later-phase concerns

### Backend contract (verified directly against `go-ride-backend` source during discussion — not from any spec doc, since none exists)
- `go-ride-backend/interfaces/http/routes/routes.go` — driver auth/profile/vehicle route definitions
- `go-ride-backend/application/driver/dto.go` — `SignupRequest`/`LoginRequest`/`DriverResponse`/`UpdateProfileRequest`/`SignupResponse`/`LoginResponse` shapes. **Critical: `SignupResponse` has no token field — signup must be chained with an immediate login call to authenticate the driver.**
- `go-ride-backend/application/vehicle/dto.go` — vehicle request/response DTOs and field validation (`plate_number` 2-20 chars, `color` 2-50, `model_name` 1-100, `seat_count` 1-20, `category` enum `normal|luxury`)
- `go-ride-backend/infrastructure/repository/vehicle_repository_gorm.go` — `Activate()` method showing the transactional auto-deactivate-previous-vehicle behavior
- `go-ride-backend/domain/driver/entity.go` — `account_status` enum values (`pending`/`active`/`blocked`), confirmed never enforced in driver login/online-toggle logic
- `go-ride-backend/pkg/apperror/errors.go` — flat `{code, message}` error response shape (no nested `{error: {...}}` wrapper), error code list (`EMAIL_ALREADY_TAKEN`, `INVALID_CREDENTIALS`, `PLATE_ALREADY_REGISTERED`, `VEHICLE_FORBIDDEN`, `VEHICLE_NOT_FOUND`, `VALIDATION_ERROR`, etc.)
- `go-ride-db-schema/migrations/000017_create_vehicles.up.sql` — `idx_vehicles_driver_active` unique partial index (`WHERE is_active`), the DB-level backstop for the single-active-vehicle rule

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — `go-ride-driver-app` is currently empty (only `.git`, `.env`, `.planning/`, `AGENTS.md`). The sibling rider app `go-ride-user-app`, described in PROJECT.md as sharing "largely the same tech stack and design system," was checked directly and is also completely empty (not even git-initialized) — there is nothing to reuse or mirror from it. This phase establishes the stack/structure from zero.

### Established Patterns
- None in-repo yet. Patterns to follow come entirely from `ARCHITECTURE.md`/`STACK.md` (see canonical refs above), not from existing code.

### Integration Points
- `go-ride-backend` driver auth/profile/vehicle REST endpoints (base path `/api/v1/driver/...`, port 8080; Android emulator reaches a locally-run backend at `10.0.2.2:8080`).
- None of this phase touches `websocket-gateway` or `location-producers`, so the known JWT-audience-mismatch blocker (flagged in STATE.md as blocking Phase 3) does not affect this phase's ability to be tested end-to-end against the real backend.

</code_context>

<specifics>
## Specific Ideas

No specific visual/product references beyond what's in the decisions above — visual polish is explicitly deferred to a later UI-spec pass; this phase follows standard, clean mobile form/list conventions.

</specifics>

<deferred>
## Deferred Ideas

- Vehicle delete/remove affordance in the UI — left as Claude's discretion for this phase rather than a hard requirement or an explicit exclusion (see Claude's Discretion above); not a new capability, just an open UI-completeness question.
- Account-status-driven gating/verification UX — out of scope until the backend actually adds a verification flow (tracked as v2 requirement VEH-04 in REQUIREMENTS.md).

</deferred>

---

*Phase: 01-foundation-auth-profile-vehicles*
*Context gathered: 2026-08-02*
