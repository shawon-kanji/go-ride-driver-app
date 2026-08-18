# Phase 2: Online/Offline + Foreground Location + Maps - Research

**Researched:** 2026-08-18
**Domain:** Expo/React Native foreground location broadcasting + maps (expo-location, react-native-maps) on Expo SDK 57/RN 0.86, plus an Expo Router navigation restructure and an app-wide font/radii/visual-retrofit pass (expo-font, @expo-google-fonts, NativeWind v4 tokens)
**Confidence:** HIGH (package APIs, config-plugin behavior, and existing-repo facts verified directly against installed `node_modules` source and repo files) / MEDIUM (exact ping-interval numbers, font-weight export names — reasoned from backend constants and package-family convention, not independently benchmarked)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Navigation architecture**
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

**Visual rollout scope**
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

**Home screen (D06) scope**
- Stat cards (today's earnings, online time) are built against real data in this
  phase, not stubbed: `GET /api/v1/driver-trips/earnings?period=today` and
  `GET /api/v1/driver-trips/online-time?period=today` on `driver-request-handler`
  (both already implemented server-side). This pulls a thin slice of Phase 6 forward.
- D06's disabled `Go online` + primary blocker-routing action reuses Phase 01.1's
  `kycBlockReason`/`KycBlockedBanner` pattern exactly. No active vehicle → route to
  Vehicles (now under the Menu). KYC incomplete → route to Verify (now under the Menu).

**Confirm-online modal (D07)**
- "Switch vehicle" closes the modal and navigates to the existing Vehicles screen
  rather than building a new inline picker. Going online always passes through this
  confirmation (D06 → D07 → online), never a direct toggle.

### Claude's Discretion
- Exact foreground location ping interval/tiering (PRES-02 says "tiered interval" —
  balance battery vs. dispatch freshness; research should confirm a concrete number,
  e.g. faster while online-and-idle, matching what `trip-dispatch-worker`'s
  `DRIVER_LOCATION_FRESH_WINDOW_SECONDS=300` and dispatch sweep expect).
- Map re-centre control behaviour and exact marker/heading rendering (D06 has no
  drawn route yet — Phase 2's map just shows the driver's own position).
- "Coming soon" row treatment for Earnings/Trip history/Settings — greyed static row
  vs. tappable-to-a-placeholder-screen; either satisfies the design as long as it
  doesn't silently no-op or crash.
- Internal file/module organization for the new `src/features/presence/` (or similar)
  feature, mirroring the existing `vehicles`/`kyc` shape.

### Deferred Ideas (OUT OF SCOPE)
- Background location tracking (v2 requirement `LOC-01`) — explicitly out of this
  phase and this milestone's roadmap; foreground-only per PROJECT.md.
- An inline vehicle-switch picker inside the D07 modal — deferred in favor of linking
  out to the existing Vehicles screen.
- Real Earnings/Trip history/Settings screens — Phases 5/6; D03 only shows their rows
  as "coming soon" this phase.
- iOS-specific location/permission handling — Android-first constraint unchanged.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| PRES-01 | Driver can toggle online/offline, gated on active vehicle + backend KYC approval | `driverClient.setOnlineStatus` already wired to `PATCH /driver/online`; reuse `kycBlockReason`/`KycBlockedBanner` (see Architecture Patterns, Code Examples); D07 confirm-flow and permission-refusal handling documented from `Screen Flow Spec.dc.html` |
| PRES-02 | While online, app broadcasts foreground location to backend on a tiered interval | `expo-location` `watchPositionAsync` API surface verified from installed types; concrete tiering recommendation derived from `trip-dispatch-worker`'s `DRIVER_LOCATION_FRESH_WINDOW_SECONDS=300`/`DISPATCH_SWEEP_INTERVAL_SECONDS=3` (see Standard Stack, Code Examples) |
| PRES-03 | Driver sees current location on a map while online | `react-native-maps` 1.27.2 config-plugin/API-key wiring verified from installed plugin source; marker/camera-follow pattern and `tracksViewChanges` battery pitfall documented (see Architecture Patterns, Common Pitfalls) |
</phase_requirements>

## Summary

This phase is really three linked workstreams: (1) the actual PRES-01/02/03 slice — an
online/offline toggle gated on active-vehicle + backend KYC, a foreground GPS watcher that
POSTs to `location-producers` on a tiered cadence, and a `react-native-maps` view showing the
driver's own position; (2) a navigation restructure that deletes the `(tabs)` group in favor
of a menu-based model (D03 Menu, reached from a profile chip on the new Home/D06); and (3) an
app-wide visual pass (Plus Jakarta Sans font loading, a new `control/card/pill` radii scale)
plus a visual retrofit of the four already-built screens (D01/D02/D04/D05) to match their
actual mockups. All three are additive to what's already in the repo — no library in the
locked `STACK.md` needs to change, and the packages this phase needs (`expo-location`,
`react-native-maps`, `expo-font`) are already installed, just unused (`expo-font` is present
transitively but not yet a direct `package.json` dependency; `@expo-google-fonts/plus-jakarta-sans`
is not installed at all — only the `material-symbols` sibling package exists).

The most consequential finding: `src/theme/radii.ts` is currently **dead code** — it's never
imported by `tailwind.config.js`, so every existing `rounded-md`/`rounded-lg`/`rounded-full`
class in `Button`/`Card`/`Badge`/`Banner`/`Stepper`/`TextInput`/`Select`/`ConfirmDialog` is
using Tailwind's stock v3 default scale, not this project's own token file. Landing the
`control:12/card:16/pill:999` radii app-wide therefore requires wiring semantic radius names
into `tailwind.config.js`'s `theme.extend.borderRadius` and then updating every one of those
`rounded-*` call sites — it is not a one-line token-file edit. Second: the `(tabs)` → menu
navigation restructure is mechanically low-risk (the three route folders being moved have no
internal references to `(tabs)`), but this repo has a proven, already-logged pitfall that
directly threatens it — Expo Router's typed-routes declaration file (`.expo/types/router.d.ts`)
is only regenerated by the `expo start` dev-server file watcher, not by `tsc`/`expo export`
alone, so after moving/deleting route files `tsc --noEmit` will fail on stale route strings
until `expo start` is run once. Third: `MAP_API_KEY` in `.env` is **not** prefixed
`EXPO_PUBLIC_`, so it is invisible to app code — it can only reach the `react-native-maps`
Android config plugin's `androidGoogleMapsApiKey` prop by converting `app.json` to
`app.config.js`/`.ts` (or reading it at config-plugin time some other way), since static
`app.json` cannot interpolate `process.env` values.

**Primary recommendation:** Treat this phase as three independent plans/waves exactly as
CONTEXT.md already scopes it (visual retrofit of D01/D02/D04/D05; new-screen D03/D06/D07 +
nav restructure; location/map broadcaster) — the token/radii wiring and the typed-routes
regeneration step are the two things most likely to silently break other waves if sequenced
carelessly, so land the token/tailwind config change and the route-move-then-`expo-start`
step early and in isolation before building on top of them.

## Standard Stack

### Core (already installed — confirm, do not replace)

| Library | Installed Version | Purpose | Notes |
|---------|--------------------|---------|-------|
| `expo-location` | `~57.0.7` | Foreground GPS watch (`watchPositionAsync`) + permission API | Matches `STACK.md`'s locked recommendation. No new install needed. |
| `react-native-maps` | `1.27.2` | Map rendering, driver marker | `STACK.md` recommended `1.29.0`; `1.27.2` is what's actually installed — do not bump mid-phase unless a specific 1.27.2 bug is hit, since New Architecture Fabric support across this minor range is still described as "functional but verify" (PITFALLS.md). Confidence: HIGH that 1.27.2 is adequate for a static, non-animated own-position marker (this phase's actual scope — no route polyline yet). |
| `expo-font` | `~57.0.1` (present in `node_modules` transitively, **not yet a direct `package.json` dependency**) | Loads custom TTF fonts, exposes `useFonts` | Add explicitly: `npx expo install expo-font`. JS-only module — no config plugin, no native rebuild needed for `expo-font` itself. |
| `@expo-google-fonts/material-symbols` | `0.4.42` (already installed, for reference) | Confirms the `@expo-google-fonts/*` package shape used in this repo | Exports `useFonts` (re-exported from `expo-font`) plus one `require()`'d `.ttf` constant per weight, e.g. `MaterialSymbols_400Regular`. `@expo-google-fonts/plus-jakarta-sans` follows the identical generated shape. |

### New installs needed this phase

| Package | Version to install | Purpose | Install command |
|---------|---------------------|---------|------------------|
| `@expo-google-fonts/plus-jakarta-sans` | `0.4.2` on npm as of this research date (verified via `npm view`) | Plus Jakarta Sans weights 400–800 as loadable font assets | `npx expo install @expo-google-fonts/plus-jakarta-sans expo-font` |

**Version verification performed:**
```bash
npm view @expo-google-fonts/plus-jakarta-sans version   # → 0.4.2
npm view react-native-maps versions --json | tail       # confirms 1.27.2 exists, 2.0.0-beta.x is prerelease — do not adopt
cat node_modules/react-native-maps/package.json | grep version   # → 1.27.2 (already installed)
cat node_modules/expo-location/package.json | grep version       # → 57.0.7 (already installed)
```

**Font export names (MEDIUM confidence — inferred from `@expo-google-fonts` package-family
convention, cross-checked against the sibling `material-symbols` package's generated
`index.js` shape, not independently opened for `plus-jakarta-sans` specifically):**
```
PlusJakartaSans_400Regular
PlusJakartaSans_500Medium
PlusJakartaSans_600SemiBold
PlusJakartaSans_700Bold
PlusJakartaSans_800ExtraBold
```
Confirm the exact export names against `node_modules/@expo-google-fonts/plus-jakarta-sans/index.js`
immediately after installing, before wiring `useFonts()` — the generator is consistent across
this package family but the executor should verify, not assume.

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| `@expo-google-fonts/plus-jakarta-sans` | Manually downloading `.ttf` files from Google Fonts into `assets/fonts/` and loading via `Font.loadAsync` | The `@expo-google-fonts` package is already the pattern this repo uses (`material-symbols`) — no reason to diverge; manual assets would be extra maintenance for no benefit. |
| `react-native-maps` current-position marker | `expo-location`'s built-in nothing (there's no first-party map primitive) | N/A — `react-native-maps` is already locked in STACK.md/PROJECT.md over `expo-maps`; not revisited here. |
| App-level location-broadcast throttle (JS timer gating POST frequency) | Relying solely on `watchPositionAsync`'s `timeInterval`/`distanceInterval` options to pace the network call directly | `timeInterval` is **Android-only** and is a minimum-wait hint to the OS location provider, not a guaranteed POST cadence; decoupling "how often the OS hands us a fix" from "how often we POST it" gives predictable, testable tiering (see Code Examples) rather than relying on undocumented default behavior when `accuracy` changes. |

## Architecture Patterns

### Recommended Project Structure (this phase's additions)

```
src/
├── app/
│   ├── (app)/
│   │   ├── _layout.tsx           # Stack now lists index, menu, vehicles, verify, profile directly (no (tabs))
│   │   ├── index.tsx             # NEW Home (D06) — was (tabs)/index.tsx
│   │   ├── menu/
│   │   │   └── index.tsx         # D03 Menu (new)
│   │   ├── vehicles/              # moved verbatim from (tabs)/vehicles/ (internal files untouched)
│   │   ├── verify/                # moved verbatim from (tabs)/verify/
│   │   └── profile/               # moved verbatim from (tabs)/profile/
│   └── ...
├── features/
│   ├── presence/                  # NEW — online/offline toggle, D07 confirm modal, location broadcaster wiring
│   │   ├── api.ts                 # useOnlineStatusMutation (wraps driverClient.setOnlineStatus)
│   │   ├── location-broadcaster.ts # app-level singleton: watchPositionAsync + throttled POST, start/stop by online flag
│   │   ├── permissions.ts         # requestForegroundPermissionsAsync wrapper + refusal state
│   │   └── components/
│   │       ├── ConfirmOnlineSheet.tsx   # D07
│   │       ├── HomeMap.tsx              # D06 map + own-position marker + re-centre
│   │       └── StatCards.tsx            # D06 earnings/online-time cards
│   └── menu/                      # NEW — D03 row list, "coming soon" placeholders
├── api/
│   ├── driver-request-client.ts   # NEW — second base-URL client for driver-request-handler (:8084) — earnings/online-time
│   └── location-client.ts         # NEW — third base-URL client for location-producers (:8081) — location POST
├── theme/
│   └── radii.ts                   # UPDATED values (control:12/card:16/pill:999) + actually wired into tailwind.config.js
```

### Pattern 1: Location broadcaster as an app-level singleton, started/stopped by the online flag

**What:** Exactly the pattern already documented in `ARCHITECTURE.md` — the location watcher
is not started in a screen's `useEffect`. It is started/stopped from one place (the online
toggle's success/failure handlers or an `AppState`+online-flag effect at the `(app)` layout
level), so navigating from Home to Menu to Vehicles does not pause broadcasting.
**When to use:** Always for this feature — this is the single architectural rule
`ARCHITECTURE.md`'s Anti-Pattern 1 exists to prevent, and it applies just as much to location
as to the (later-phase) WebSocket.
**Example:**
```typescript
// src/features/presence/location-broadcaster.ts
import * as Location from 'expo-location';
import { useSessionStore } from '../../stores/session-store';
import { locationClient } from '../../api/location-client';

let subscription: Location.LocationSubscription | null = null;
let lastSentAt = 0;
let lastSentCoords: { lat: number; lng: number } | null = null;

const MOVEMENT_MIN_INTERVAL_MS = 10_000;  // don't POST more than once per 10s even if moving
const HEARTBEAT_MAX_INTERVAL_MS = 60_000; // POST at least once per 60s even if stationary
const MIN_DISTANCE_METERS = 25;           // ignore GPS jitter below this

export async function startLocationBroadcast() {
  if (subscription) return; // idempotent
  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 4000,     // Android-only hint to the provider; not our send cadence
      distanceInterval: MIN_DISTANCE_METERS,
    },
    (loc) => {
      const now = Date.now();
      const moved =
        !lastSentCoords ||
        haversineMeters(lastSentCoords, loc.coords) >= MIN_DISTANCE_METERS;
      const dueForHeartbeat = now - lastSentAt >= HEARTBEAT_MAX_INTERVAL_MS;
      const throttleOk = now - lastSentAt >= MOVEMENT_MIN_INTERVAL_MS;

      if ((moved && throttleOk) || dueForHeartbeat) {
        const driverId = useSessionStore.getState().driver?.id;
        if (!driverId) return; // don't crash if store hasn't hydrated
        lastSentAt = now;
        lastSentCoords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        locationClient.updateLocation({
          driver_id: driverId,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy_m: loc.coords.accuracy ?? undefined,
          event_time: new Date(loc.timestamp).toISOString(),
          source: 'foreground',
        }).catch(() => {}); // best-effort; do not surface to UI per-ping
      }
    }
  );
}

export function stopLocationBroadcast() {
  subscription?.remove();
  subscription = null;
  lastSentAt = 0;
  lastSentCoords = null;
}
```
*(`haversineMeters` is a small pure helper — put it in `src/lib/` so it's independently unit-testable.)*

### Pattern 2: Permission request happens at the D07 confirm step, not eagerly on app launch

**What:** Per `Screen Flow Spec.dc.html`'s own transition table: *"Location permission is not
granted → Ask for permission; on refusal stay on D07 and explain that offers need location."*
The OS permission dialog fires when the driver taps **Go online** on D07, not on cold start or
on D06 mount.
**When to use:** This is a locked design behavior, not a discretionary choice — implement
exactly this sequencing.
**Example flow:**
```typescript
// on D07's "Go online" press handler
const { status } = await Location.getForegroundPermissionsAsync();
if (status !== Location.PermissionStatus.GRANTED) {
  const { status: requested } = await Location.requestForegroundPermissionsAsync();
  if (requested !== Location.PermissionStatus.GRANTED) {
    setPermissionDenied(true); // renders the "offers need location" explainer, stays on D07
    return;
  }
}
// permission OK — proceed to PATCH /driver/online, then startLocationBroadcast()
```
Also worth a `Location.hasServicesEnabledAsync()` check (device-wide location services off,
distinct from app permission) — not called out explicitly in the spec but a real Android edge
case; degrade to the same "explain that offers need location" messaging rather than crashing.

### Pattern 3: Map — static own-position marker, no polyline this phase

**What:** D06's map has no drawn route (that's Phase 3+/rider-side per CONTEXT.md). This
phase only needs: a `MapView` region centered/following the driver's own coordinate, one
`Marker` at that coordinate, and a re-centre button that re-enables camera-follow after the
driver pans away.
**Example:**
```tsx
// src/features/presence/components/HomeMap.tsx
import MapView, { Marker, Region } from 'react-native-maps';
import { useState, useCallback, useMemo } from 'react';

export function HomeMap({ coords }: { coords: { latitude: number; longitude: number } | null }) {
  const [following, setFollowing] = useState(true);
  const region: Region | undefined = useMemo(
    () =>
      coords
        ? { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        : undefined,
    [coords]
  );

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        region={following ? region : undefined}
        onPanDrag={() => setFollowing(false)}
      >
        {coords && (
          <Marker
            coordinate={coords}
            tracksViewChanges={false} // PITFALLS.md #9 — static icon, avoid re-render-per-tick cost
          />
        )}
      </MapView>
      {!following && (
        <RecentreButton onPress={() => setFollowing(true)} />
      )}
    </View>
  );
}
```
`tracksViewChanges={false}` is set from the start since the marker icon is static (no custom
animated bearing this phase) — this sidesteps PITFALLS.md Pitfall 9 entirely rather than
retrofitting it later.

### Pattern 4: Second/third API base URL, not a variant of the existing `apiRequest`

**What:** `src/api/http-client.ts`'s `apiRequest<T>()` hardcodes `EXPO_PUBLIC_API_BASE_URL`
(→ `go-ride-backend`, `:8080`). This phase needs two more backend services on their own
ports: `driver-request-handler` (`:8084`, JWT-authenticated, same token) for the earnings/
online-time stat cards, and `location-producers` (`:8081`, currently unauthenticated) for the
location POST. Add two new `EXPO_PUBLIC_*` env vars and either two thin sibling clients or a
`baseUrl` parameter threaded through a shared request helper — do not silently point
`EXPO_PUBLIC_API_BASE_URL` at a different service per call.
**Example `.env` additions:**
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL=http://localhost:8084/api/v1/driver-trips
EXPO_PUBLIC_LOCATION_BASE_URL=http://localhost:8081
```
(Android emulator equivalents use `10.0.2.2` per the existing `.env.example` pattern.)

### Anti-Patterns to Avoid

- **Starting the location watcher in `HomeScreen`'s `useEffect`:** loses broadcasting the
  moment the driver navigates to Menu/Vehicles/Profile — see Pattern 1 and `ARCHITECTURE.md`
  Anti-Pattern 1.
- **Requesting location permission eagerly on app launch or D06 mount:** contradicts the
  locked design behavior (permission is requested at the D07 confirm step) and increases
  reflexive-denial risk per `PITFALLS.md`'s UX Pitfalls table ("OS default... dialogs shown
  with no preceding context").
- **Using `watchPositionAsync`'s `timeInterval` alone as the network-send cadence:** it's
  Android-only, provider-dependent, and not a POST-rate guarantee — always gate the actual
  HTTP call with an explicit JS-side throttle (Pattern 1) so the cadence is deterministic and
  unit-testable.
- **Editing `src/theme/radii.ts` values without also wiring them into `tailwind.config.js`:**
  the file is currently unused — a values-only edit changes nothing visually. Confirmed by
  grep: no file in this repo imports `theme/radii.ts` today.
- **Assuming `router.push('/(app)/(tabs)/vehicles/new')`-style literals still resolve after
  the `(tabs)` group is deleted:** they do not — `(tabs)` no longer exists as a route segment.
  The flattened forms (`/vehicles/new`, `/profile/edit`) already resolve today (route groups
  never appear in the URL) and continue to resolve unchanged after the restructure — update
  the two known literal call sites (`ProfileView.tsx`, `VehicleListEmptyState.tsx`) to the
  flattened form rather than a new group-qualified one.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Foreground GPS watching | A custom `setInterval` + `getCurrentPositionAsync` poll loop | `expo-location`'s `watchPositionAsync` | It's the OS-level, battery-aware provider API — a manual poll loop re-implements what the native location manager already does more efficiently, and loses the `distanceInterval`/accuracy tuning knobs. |
| Distance-between-two-points math | Nothing exotic needed — a small Haversine function is fine to hand-write here (it's ~10 lines, no edge cases beyond float precision) | Hand-rolled `haversineMeters` helper, unit-tested in isolation | Listed here explicitly so it's *not* over-engineered into a geo library dependency — this is one of the rare cases where hand-rolling is correct, not a pitfall. |
| Map camera-follow / re-centre | A custom gesture-tracking layer to detect "user panned away" | `react-native-maps`'s `onPanDrag`/`onRegionChangeComplete` callbacks (Pattern 3) | The library already exposes the signal needed; building a separate gesture detector duplicates it. |
| Font loading + splash-screen gating | A parallel splash-screen system separate from the existing session-status gate in `src/app/_layout.tsx` | Extend the existing `useEffect`/`SplashScreen.hideAsync()` gate with `useFonts()`'s `[fontsLoaded]` boolean (Code Examples) | The repo already has one splash-hide decision point; a second independent one risks a race where the splash hides before fonts are ready, causing a visible fallback-font flash. |

**Key insight:** Nothing in this phase's actual location/map slice needs a new dependency
beyond the font package — every "don't hand-roll" risk here is about composing already-locked
libraries correctly (permission timing, broadcaster lifecycle, splash-gate composition), not
about missing tooling.

## Common Pitfalls

### Pitfall 1: `theme/radii.ts` edits alone do nothing (already confirmed, not hypothetical)

**What goes wrong:** Someone changes `sm: 6` → `control: 12` etc. in `theme/radii.ts`,
verifies the file compiles, and considers the radii task done. No screen changes visually.
**Why it happens:** `tailwind.config.js` only does `theme.extend.colors = colors` — it never
imports or spreads `radii.ts`, and NativeWind classes (`rounded-md`, `rounded-lg`,
`rounded-full`) resolve against Tailwind's own default `borderRadius` scale, not this file.
**How to avoid:** Add semantic radius keys to `tailwind.config.js`'s
`theme.extend.borderRadius` (e.g. `control: 12, card: 16, pill: 999` in px, expressed the way
Tailwind expects — string with unit or a plain number depending on the Tailwind version's
convention; verify against `tailwindcss@3.4.19`'s docs since this repo pins Tailwind v3, not
v4), then find-and-replace every `rounded-md`/`rounded-lg`/`rounded-full` call site
(`Button.tsx`, `Card.tsx`, `Badge.tsx`, `Banner.tsx`, `Stepper.tsx`, `TextInput.tsx`,
`Select.tsx`, `ConfirmDialog.tsx` — 8 files, confirmed by grep) with the new semantic class
names (`rounded-control`, `rounded-card`, `rounded-pill`).
**Warning signs:** `grep -rn "radii" src` still shows zero consumers after the "radii" task is
marked done.

### Pitfall 2: Typed-routes staleness after the `(tabs)` restructure (already logged in STATE.md from Phase 01.1 — recurs here at larger scale)

**What goes wrong:** After moving `vehicles/`, `verify/`, `profile/` out of `(tabs)` and
deleting the `(tabs)` folder, `npx tsc --noEmit` fails on stale `/(app)/(tabs)/...` route
string literals and/or fails to recognize the new flattened routes, even though the actual
Expo Router file-based routing works fine at runtime.
**Why it happens:** `.expo/types/router.d.ts` (confirmed present in this repo, currently
listing `/(app)/(tabs)/...` paths) is only regenerated by the `expo start` dev-server file
watcher — not by `tsc`, `expo export`, or `expo lint` alone. This is an explicit prior
decision logged in `STATE.md` from Phase 01.1: *"run expo start briefly after adding new
route files before tsc will accept router.push to them."*
**How to avoid:** After moving/deleting the route files (and updating the two known
`router.push('/(app)/(tabs)/...')` literals in `ProfileView.tsx` and
`VehicleListEmptyState.tsx`), run `expo start` briefly (enough for the file watcher to
regenerate `.expo/types/router.d.ts`), stop it, then run `tsc --noEmit`. Do this as its own
verification step before layering the D03/D06/D07 screens on top, so a `tsc` failure is
attributable to the restructure, not to new screen code written on top of it.
**Warning signs:** `tsc --noEmit` errors referencing `(tabs)` after the folder has been
deleted; `router.push` calls to new routes (e.g. `/menu`) rejected as not assignable to `Href`.

### Pitfall 3: `MAP_API_KEY` never reaches the native Android manifest

**What goes wrong:** `react-native-maps`'s Android config plugin takes `androidGoogleMapsApiKey`
as a static plugin-config prop (confirmed by reading
`node_modules/react-native-maps/plugin/build/android.js` — it writes
`com.google.android.geo.API_KEY` into `AndroidManifest.xml`'s `<meta-data>` at prebuild time).
`app.json` is static JSON — it cannot read `process.env.MAP_API_KEY` (which also isn't
`EXPO_PUBLIC_`-prefixed, so it's invisible to *app* code too, only to Node-context config
code). If the plugin block is added to `app.json` with a placeholder or omitted, maps render
blank/grey on a real device (works fine on `expo start` dev-client if a *previous* prebuild
happened to bake in a key, masking the bug until a clean prebuild).
**How to avoid:** Convert `app.json` → `app.config.js` (or `.ts`) so the plugins array can be
built in JS and read `process.env.MAP_API_KEY` (available in Node/config context regardless
of the `EXPO_PUBLIC_` prefix rule, which only governs what's inlined into the JS bundle) at
config-evaluation time:
```js
// app.config.js
export default ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.MAP_API_KEY }],
  ],
});
```
This is a native config change → per `PITFALLS.md`'s already-logged precedent, a dev-client
rebuild (`expo prebuild` / new EAS dev-client build) is required before the key takes effect,
not just a JS reload.
**Warning signs:** Map tiles render as a blank grey grid with a "For development purposes
only" watermark or don't render at all; no compile-time error, since a missing/invalid Google
Maps key fails silently at the native layer.

### Pitfall 4: Font loading race with the existing splash-screen gate

**What goes wrong:** `src/app/_layout.tsx` already has its own `SplashScreen.preventAutoHideAsync()`
/ `hideAsync()` dance keyed on `session status`. If `useFonts()` is added without also gating
the hide-splash effect and the `return null` guard on `fontsLoaded`, the splash screen can
hide before Plus Jakarta Sans finishes loading, showing a brief system-font flash on cold
start.
**How to avoid:** Extend both existing gates, don't add a parallel one:
```tsx
const status = useSessionStore((s) => s.status);
const [fontsLoaded, fontError] = useFonts({
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
});

useEffect(() => {
  useSessionStore.getState().hydrate();
}, []);

useEffect(() => {
  if (status !== 'unknown' && (fontsLoaded || fontError)) {
    SplashScreen.hideAsync().catch(() => {});
  }
}, [status, fontsLoaded, fontError]);

if (status === 'unknown' || (!fontsLoaded && !fontError)) return null;
```
Treat `fontError` as "proceed anyway with system font" rather than an infinite splash — a
font-load failure should never permanently block app entry.
**Warning signs:** Visible font flash on cold start only (not on warm reloads, since fonts are
cached after first load) — easy to miss in a fast dev loop, worth an explicit cold-start check.

### Pitfall 5 (carried forward from PITFALLS.md, directly applicable this phase): Naive marker re-render under continuous location updates

Already covered in Pattern 3 above (`tracksViewChanges={false}` from the start) — flagged
again here because `PITFALLS.md`'s Pitfall 9 explicitly scopes it to "Online/offline +
foreground location broadcast phase," i.e. this phase, not a later one.

### Pitfall 6 (carried forward): No mock-location guard on the broadcast path

`PITFALLS.md`'s Pitfall 10 also scopes to this phase. `expo-location`'s `LocationObject.mocked`
field (Android) is the client-side signal — check
`node_modules/expo-location/build/Location.types.d.ts` for the exact field name at
implementation time (not verified in this research pass) and, at minimum, log/flag it rather
than silently trusting mocked coordinates. Full server-side validation is out of scope
(backend follow-up per PITFALLS.md) — a client-side check alone is acceptable for this MVP
phase, not "handled."

## Code Examples

### Requesting foreground permission + starting the watch (composed, D07 → online)
```typescript
// Source: node_modules/expo-location/build/Location.d.ts (installed 57.0.7), verified directly
import * as Location from 'expo-location';

export async function ensureForegroundLocation(): Promise<'granted' | 'denied' | 'services_off'> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) return 'services_off';

  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === Location.PermissionStatus.GRANTED) return 'granted';

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === Location.PermissionStatus.GRANTED ? 'granted' : 'denied';
}
```

### Reusing the KYC block pattern for the online toggle (per Phase 01.1's own forward note)
```typescript
// Source: existing src/features/kyc/kyc-errors.ts + KycBlockedBanner.tsx (unchanged, reused)
import { kycBlockReason } from '../kyc/kyc-errors';
import { KycBlockedBanner } from '../kyc/components/KycBlockedBanner';

try {
  await driverClient.setOnlineStatus(true);
} catch (error) {
  const reason = kycBlockReason(error); // 'identity' | 'vehicle' | null
  if (reason) {
    setBlockReason(reason); // renders <KycBlockedBanner reason={reason} onPressAction={() => router.push('/verify')} />
    return;
  }
  throw error; // genuinely unexpected error — let it surface normally
}
```

### react-native-maps Android API key wiring (config-plugin level)
```js
// Source: node_modules/react-native-maps/plugin/build/android.js (installed 1.27.2), verified directly —
// the plugin writes com.google.android.geo.API_KEY into AndroidManifest.xml's meta-data.
// app.config.js
export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.MAP_API_KEY }],
  ],
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `expo-permissions` package for location permission | `expo-location`'s own `getForegroundPermissionsAsync`/`requestForegroundPermissionsAsync` | `expo-permissions` deprecated years ago, fully removed by SDK 57 | N/A for this repo — was never installed; noted only so the executor doesn't follow a stale tutorial referencing it. |
| Static `app.json` for config requiring env interpolation | `app.config.js`/`.ts` (dynamic config) | Standard Expo practice for any project needing build-time env values in plugin config | This repo is currently on static `app.json` — converting to `app.config.js` is itself a small migration (see Pitfall 3), not just a one-line addition. |
| Bare `sm/md/lg/full` Tailwind radius names | Semantic design-token radius names (`control/card/pill`) mapped in `tailwind.config.js` | This phase, per CONTEXT.md's locked decision | Requires the `tailwind.config.js` wiring documented in Pitfall 1 — not yet done anywhere in this repo. |

**Deprecated/outdated:** Nothing else flagged — the rest of the phase composes already-current
(per `STACK.md`, researched 2026-08-01, still current) libraries.

## Open Questions

1. **Exact `@expo-google-fonts/plus-jakarta-sans` export names**
   - What we know: package-family convention (confirmed against the installed
     `material-symbols` sibling) strongly implies `PlusJakartaSans_400Regular` /
     `_500Medium` / `_600SemiBold` / `_700Bold` / `_800ExtraBold`.
   - What's unclear: not independently opened for this specific package (not installed in
     this research pass, since installing changes `package.json`/`package-lock.json`, which
     is an implementation action, not research).
   - Recommendation: first task in the font-loading plan should install the package and
     `cat node_modules/@expo-google-fonts/plus-jakarta-sans/index.js` to confirm exact names
     before writing the `useFonts()` call.

2. **`tailwindcss@3.4.19`'s exact `borderRadius` extension syntax for numeric-px semantic keys**
   - What we know: Tailwind v3's `theme.extend.borderRadius` accepts arbitrary key→value pairs
     (e.g. `{ control: '12px', card: '16px', pill: '9999px' }`), generating `rounded-control`
     etc. classes — this is standard Tailwind v3 behavior, not project-specific.
   - What's unclear: whether NativeWind v4's Tailwind v3-based preset has any restriction on
     custom `borderRadius` keys (unlikely, but not verified against NativeWind v4's own docs
     in this pass).
   - Recommendation: verify with a one-file spike (`rounded-control` on a single test view,
     confirm it renders 12px) before doing the repo-wide 8-file find-and-replace.

3. **Whether `app.json` → `app.config.js` conversion has any ripple effect on `eas.json`/EAS
   build profiles**
   - What we know: EAS Build supports both static and dynamic config transparently; no
     `eas.json` change should be required.
   - What's unclear: not verified against this specific project's `eas.json` (read directly —
     it has no config-path assumptions, so risk appears low) or against a real EAS build.
   - Recommendation: treat the `app.json`→`app.config.js` conversion as its own small task
     with its own `expo prebuild --clean` + Android build sanity check, not folded silently
     into the maps task.

4. **Precise `LocationObject` field name for the Android mock-provider flag**
   - What we know: `expo-location`'s `LocationObject.coords`/top-level fields were read from
     `Location.types.d.ts` for `timeInterval`/`distanceInterval`; the mock-provider field
     specifically was not located in this pass.
   - What's unclear: exact field name/location on the returned object.
   - Recommendation: `grep -n "mock" node_modules/expo-location/build/Location.types.d.ts` at
     implementation time; if absent from the JS-level type surface, treat Pitfall 6 as a
     documented gap to flag rather than block on, consistent with PITFALLS.md's own guidance
     that this is acceptable-for-MVP.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `jest-expo/android` preset (`jest@~29.7.0`, `@testing-library/react-native@^14.0.1`) |
| Config file | `jest.config.js` (repo root) |
| Quick run command | `npx jest --watchAll=false <path-to-changed-test-file>` |
| Full suite command | `npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android` (matches the acceptance-criteria pattern already used in Phase 01.1's plans) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| PRES-01 | Online-toggle mutation calls `PATCH /driver/online`, maps `KYC_NOT_APPROVED`/`VEHICLE_NOT_VERIFIED` to `kycBlockReason` | unit | `npx jest --watchAll=false src/features/presence/api.test.ts` | ❌ Wave 0 |
| PRES-01 | D07 confirm sheet: permission-denied branch stays on D07 and shows explainer, does not call `setOnlineStatus` | unit (component, mocked `expo-location`) | `npx jest --watchAll=false src/features/presence/components/ConfirmOnlineSheet.test.tsx` | ❌ Wave 0 |
| PRES-01 | No active vehicle → D06's Go online routes to Vehicles, not D07 | unit (component) | `npx jest --watchAll=false src/app/(app)/index.test.tsx` | ❌ Wave 0 (no test exists for Home today either) |
| PRES-02 | Broadcaster throttle logic: movement-tier vs heartbeat-tier POST gating (Pattern 1) | unit (pure function/hook, fake timers, mocked `watchPositionAsync` callback + mocked `locationClient.updateLocation`) | `npx jest --watchAll=false src/features/presence/location-broadcaster.test.ts` | ❌ Wave 0 |
| PRES-02 | Broadcaster starts on going online, stops on going offline (lifecycle, not tied to screen mount) | unit | same file as above | ❌ Wave 0 |
| PRES-02 | Real GPS movement → real device battery/cadence behavior over a multi-hour session | manual-only | N/A — not automatable | N/A |
| PRES-03 | `HomeMap` renders a `Marker` at the current coordinate, `tracksViewChanges={false}` set | unit (component, `jest.mock('react-native-maps', ...)`) | `npx jest --watchAll=false src/features/presence/components/HomeMap.test.tsx` | ❌ Wave 0 |
| PRES-03 | Map actually renders tiles/marker correctly on a real Android device/emulator with a valid API key | manual-only (native Fabric map view cannot render under Jest) | N/A | N/A |
| PRES-03 | Re-centre button reappears after pan, disappears after tap (camera-follow state machine) | unit (component) | same file as above | ❌ Wave 0 |
| (nav restructure) | `tsc --noEmit` passes after `(tabs)` removal and `expo start` regenerates typed routes | smoke | `npx expo start` (briefly) `&& npx tsc --noEmit` | N/A — process step, not a test file |
| (font/radii) | `rounded-control`/`rounded-card`/`rounded-pill` classes resolve to the expected px values | manual/visual-only (Tailwind class generation isn't meaningfully unit-testable in RN/Jest without a snapshot of computed styles, which NativeWind's Jest transform may or may not expose) | N/A (spike-verify per Open Question 2, then visual check) | N/A |

### Sampling Rate
- **Per task commit:** `npx jest --watchAll=false <changed test file(s)>`
- **Per wave merge:** `npx tsc --noEmit && npx expo lint && npx jest --watchAll=false && npx expo export --platform android`
- **Phase gate:** Full suite green, plus the human-verify checkpoints below, before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `src/features/presence/api.test.ts` — online-toggle mutation + `kycBlockReason` mapping
- [ ] `src/features/presence/location-broadcaster.test.ts` — throttle/tiering logic, start/stop lifecycle
- [ ] `src/features/presence/components/ConfirmOnlineSheet.test.tsx` — D07 permission-denial branch
- [ ] `src/features/presence/components/HomeMap.test.tsx` — marker/camera-follow logic (map itself mocked)
- [ ] `src/app/(app)/index.test.tsx` — D06 routing branches (no active vehicle / KYC blocked / all-clear)
- [ ] `src/lib/geo.test.ts` (or similar) — `haversineMeters` pure-function test
- [ ] Jest mock helpers: add `expo-location` and `react-native-maps` manual mocks to
      `src/test-utils/expo-mocks.ts` (neither is auto-mocked by `jest-expo` — confirmed by
      grepping `node_modules/jest-expo` for both package names, no matches)
- [ ] Two **human-verify checkpoints**, matching Phase 01.1 Task 3's pattern:
      (a) real-device online/offline toggle + map + location broadcast against a running
      `go-ride-backend` + `location-producers`, confirming rows actually land in
      `driver_locations`; (b) real-device Google Maps API key check across whichever build
      profile is used (dev client vs. EAS internal) per `PITFALLS.md`'s SHA-1/build-variant
      warning — not automatable, and should be called out explicitly as its own checkpoint
      task rather than folded into a generic "verify manually" note.

## Sources

### Primary (HIGH confidence — verified directly against installed source/repo files this session)
- `node_modules/expo-location/build/Location.d.ts`, `Location.types.d.ts` — `watchPositionAsync`, `getForegroundPermissionsAsync`, `requestForegroundPermissionsAsync`, `hasServicesEnabledAsync`, `LocationOptions` (`timeInterval` Android-only, `distanceInterval` cross-platform)
- `node_modules/expo-location/plugin/build/withLocation.js` — confirms `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION` are already in the library's own manifest (no plugin block strictly required for foreground-only Android use); background/foreground-service permissions are opt-in via plugin props not needed this phase
- `node_modules/react-native-maps/plugin/build/android.js` — confirms `androidGoogleMapsApiKey` prop writes `com.google.android.geo.API_KEY` meta-data into `AndroidManifest.xml`
- `node_modules/react-native-maps/package.json`, `node_modules/expo-location/package.json` — installed versions `1.27.2` / `57.0.7`
- `node_modules/@expo-google-fonts/material-symbols/package.json`, `index.js` — confirms package-family export shape (`useFonts` re-export + per-weight named `.ttf` constants)
- `node_modules/expo-font/build/index.d.ts` — confirms `useFonts` export surface
- `node_modules/jest-expo` (grepped) — no built-in mocks for `expo-location` or `react-native-maps`; both need manual `jest.mock()`
- This repo's own files, read directly: `app.json`, `.env`/`.env.example`, `eas.json`, `tailwind.config.js`, `src/theme/radii.ts` (confirmed unused via grep), `src/theme/colors.js`, `src/app/_layout.tsx`, `src/app/(app)/_layout.tsx`, `src/app/(app)/(tabs)/_layout.tsx` and `index.tsx`, `src/app/(app)/(tabs)/{profile,vehicles,verify}/_layout.tsx`, `.expo/types/router.d.ts`, `src/api/http-client.ts`, `src/api/driver-client.ts`, `src/api/types.ts`, `src/stores/session-store.ts`, `src/features/kyc/kyc-errors.ts`, `src/features/kyc/components/KycBlockedBanner.tsx`, `src/features/vehicles/components/ActivateConfirmDialog.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/{Button,Card,Badge,Banner,Stepper,TextInput,Select}.tsx`, `jest.config.js`, `babel.config.js`, `package.json`
- `../design_handoff_go_ride/README.md`, `Driver App.dc.html` (sections `data-screen-label="01 Driver sign in"` through `"07 Confirm online"`), `Screen Flow Spec.dc.html` (§3 "Driver: going online and working") — read directly this session
- `go-ride-kafka-consumers/services/trip-dispatch-worker/internal/config/config.go`, `.env.example`, `docs/cab-request-flow.md` — confirms `DRIVER_LOCATION_FRESH_WINDOW_SECONDS=300` (default) and `DISPATCH_SWEEP_INTERVAL_SECONDS=3` (default), read directly this session
- `.planning/STATE.md` — confirms the typed-routes regeneration pitfall was already discovered and logged in Phase 01.1

### Secondary (MEDIUM confidence)
- `npm view @expo-google-fonts/plus-jakarta-sans version` → `0.4.2`, `npm view react-native-maps versions` — registry queries run this session
- Font export-name convention (`PlusJakartaSans_400Regular` etc.) — inferred from the `@expo-google-fonts` generator pattern confirmed on the installed `material-symbols` sibling, not independently opened for `plus-jakarta-sans`
- Concrete tiered-interval numbers (10s movement-tier / 60s heartbeat-tier / 25m min distance) — reasoned from the backend's `DRIVER_LOCATION_FRESH_WINDOW_SECONDS=300`/`DISPATCH_SWEEP_INTERVAL_SECONDS=3` constants plus general ride-hailing domain practice (not independently benchmarked against this specific backend's dispatch-matching quality)

### Tertiary (LOW confidence)
- Tailwind v3 `borderRadius` custom-key syntax compatibility with NativeWind v4's preset — standard Tailwind v3 behavior, not independently verified against NativeWind v4 docs this session (flagged as Open Question 2)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and version-confirmed directly; only the new font package's exact export names are inferred rather than opened.
- Architecture: HIGH — patterns extend already-locked `ARCHITECTURE.md` patterns (app-level singleton, server/session-state split) rather than introducing new ones; config-plugin mechanics verified against installed plugin source, not assumed.
- Pitfalls: HIGH — three of the six pitfalls documented here are confirmed facts about this specific repo (dead `radii.ts`, typed-routes regeneration requirement, unwired `MAP_API_KEY`), not general domain knowledge; the other three carry forward already-researched `PITFALLS.md` items scoped explicitly to this phase.

**Research date:** 2026-08-18
**Valid until:** 30 days (stable Expo SDK 57 line, no fast-moving dependencies in this phase's slice) — re-verify font export names and `react-native-maps` version if this research is consumed after a `npm update`/`expo install` refresh.
