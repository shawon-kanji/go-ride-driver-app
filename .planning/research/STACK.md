# Stack Research

**Domain:** Android-first Expo/React Native ride-hailing driver app (realtime job offers over WebSocket, background location, push notifications, maps)
**Researched:** 2026-08-01
**Confidence:** HIGH (core framework/versions verified against npm registry + Expo official changelogs), MEDIUM (maps/New Architecture interaction, background reliability patterns)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | **57** (`expo@57.0.9`) | Managed native runtime, config plugins, EAS integration | Current stable SDK as of Aug 2026 (shipped June 30, 2026). SDK 55 permanently removed Legacy Architecture — every SDK from 55 onward runs New Architecture only, so there is no "safer" older SDK to fall back to; starting greenfield on the current stable SDK avoids an immediate forced upgrade. SDK 57 is described by Expo as a deliberately small, no-breaking-changes release over 56, which is good for a first EAS project. Confidence: HIGH. |
| React Native | **0.86.x** (pinned by Expo SDK 57, currently 0.86.2) | App runtime | Version is dictated by the Expo SDK, not chosen independently — always let `expo install` resolve it. New Architecture (Fabric/TurboModules) is mandatory from RN 0.82+; there is no opt-out flag anymore. Confidence: HIGH. |
| React | **19.2.x** (pinned by Expo SDK 57) | UI library | Matches RN 0.86's peer requirement. Do not hand-pick a different React version; `expo install` / `npx expo-doctor` will flag mismatches. Confidence: HIGH. |
| TypeScript | **5.9.3** | Static typing | TS 7.0 (the Go-rewritten "native compiler") is out and 8–12x faster, but tooling that imports the classic `typescript` compiler API (some Babel/webpack/config-plugin tooling in the Expo ecosystem) isn't confirmed compatible yet — Microsoft's own guidance is to wait for 7.1+ or use the side-by-side alias if you depend on the compiler API. Since Expo/Metro type-checks with `tsc --noEmit` and transpiles with Babel (not `tsc`), TS7 adoption risk is lower than in webpack-based stacks, but there's no urgency: stay on the mature 5.9.x line for this greenfield build and revisit TS7 once the RN/Expo ecosystem explicitly confirms support. Confidence: MEDIUM (TS7 ecosystem readiness is the uncertain part, not 5.9.x's suitability). |
| expo-router | **57.0.9** | File-based navigation | Already decided in PROJECT.md and confirmed still current best practice for Expo SDK 55+ — file-based routing plus typed routes (compile-time-checked `Link`/`router.push` calls) is the standard, not a legacy React Navigation setup. Keep `experiments.typedRoutes: true` in `app.json`. Confidence: HIGH. |
| @tanstack/react-query | **5.101.4** (v5 line) | Server-state cache for all HTTP calls (auth, vehicles, trip lifecycle, current-trip polling) | Already decided in PROJECT.md; still the ecosystem standard for RN/Expo apps in 2026, no v6 yet. Pairs cleanly with native `fetch` (no axios needed — see "What NOT to Use"). Use it for the current-trip polling fallback mentioned in PROJECT.md's backend gaps (no REST list-pending-offers endpoint) via a short-interval `refetchInterval`. Confidence: HIGH. |
| zustand | **5.14.x** (v5 line, latest 5.0.14 at time of writing — confirm exact patch at install time) | Client-only UI/session state (online/offline toggle, current WS connection status, active job offer, auth token in memory) | Already decided in PROJECT.md; remains the standard lightweight alternative to Redux for Expo apps this size. Confidence: HIGH. |
| NativeWind | **4.2.6** (v4 line — do not adopt v5 yet) | Tailwind-style styling for the bold/vibrant design requirement | Already decided in PROJECT.md. NativeWind v5 exists as a pre-release (built on Tailwind v4.1+, drops the Babel plugin, adds a CSS-variable-based `VariableContextProvider` for runtime theming) but is not yet promoted to `latest` — treat it as not production-ready. v4.2.6 is stable, works with RN 0.86/New Architecture, and is what the design-token/theming approach in PROJECT.md was presumably planned against. Re-evaluate v5 in a later milestone once it's stable — its runtime theme-swapping would actually suit a two-app (driver+rider) shared design system well. Confidence: HIGH for v4 recommendation, MEDIUM on v5 timeline. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-maps | **1.29.0** | Map rendering, driver location marker, route/polyline display | Already decided in PROJECT.md over `expo-maps` — confirmed still correct: `expo-maps` remains alpha, breaking changes are frequent, and it deliberately has no Google Maps on iOS. `react-native-maps` is the de facto production standard for ride-hailing-style apps. **Caveat (see Pitfalls):** New Architecture support is real but incomplete — 1.29.0 added only partial iOS Fabric support (Marker/Polygon), and Android-side Fabric issues (e.g., callout rendering) are still being reported in GitHub issues as of mid-2026. It works via RN's New Architecture interop layer, which is fine for MVP, but budget a spike early (map screen with live-updating driver marker) to confirm no Fabric-specific bugs block your specific usage (animated marker, custom polyline, rotated heading — all called out as requirements in PROJECT.md's own rationale). Confidence: MEDIUM. |
| expo-location | **57.0.7** | Foreground + (later phase) background GPS location for the online driver | Standard, actively maintained Expo module. For MVP (foreground-only broadcast per PROJECT.md's active requirements), use `watchPositionAsync`. Confidence: HIGH. |
| expo-task-manager | **57.0.7** | Defines the background task that `expo-location`'s `startLocationUpdatesAsync` invokes | Required pairing with `expo-location` for the later background-tracking phase; must be registered via `TaskManager.defineTask` in a module loaded at app startup (top-level, outside any component) — this is an Expo-documented gotcha, not optional. Confidence: HIGH. |
| expo-notifications | **57.0.8** | Push notifications for job offers when app is backgrounded/killed | Required for the explicit PROJECT.md requirement. Must configure Firebase Cloud Messaging **v1 API** (not the deprecated Legacy FCM API, which Google/Expo have fully sunset) — needs a Firebase service account JSON uploaded to EAS, not just a server key. SDK 55+ also throws (not warns) if you try to use push notifications inside Expo Go on Android — this app already uses a custom dev client per PROJECT.md constraints, so this doesn't block you, but confirms the dev-client decision was correct. Confidence: HIGH. |
| expo-background-task | **57.0.7** | Periodic background reconciliation (e.g., re-syncing job-offer state, retrying missed WS replay) if/when background tracking phase lands | Newer unified replacement for the older `expo-background-fetch`/`expo-task-manager` split for *periodic* (not continuous) background work; continuous background location still goes through `expo-location` + `expo-task-manager` above, not this. Only pull this in when you build the background-location phase — not needed for the foreground-only MVP. Confidence: MEDIUM (newer API, less field-tested than expo-location/task-manager). |
| expo-secure-store | **57.0.1** | Encrypted storage for the JWT access token | Standard choice for auth tokens on Expo — Android Keystore-backed. Given the backend's 60-minute hard token expiry and no refresh endpoint (PROJECT.md known gap), keep token lifecycle logic (re-login prompt on expiry) simple rather than over-engineering silent refresh that the backend can't yet support. Confidence: HIGH. |
| react-native-mmkv | **4.3.2** | Fast local key-value storage backing zustand's `persist` middleware (e.g., last-known online/offline preference, non-sensitive cached state) | Recommended addition (not in PROJECT.md's prior decisions) — MMKV is ~30x faster than AsyncStorage, synchronous (avoids async boilerplate in zustand persist), and JSI-based so it's compatible with New Architecture. Use for *non-sensitive* persisted UI state only; keep the JWT in `expo-secure-store`, never in MMKV/AsyncStorage. Confidence: MEDIUM (strong community consensus, but this is a new addition you should confirm you want vs. plain AsyncStorage's simplicity). |
| react-native-reanimated | **4.5.3** (requires `react-native-worklets` as a separate peer dependency in v4+) | Animations (bottom sheets, job-offer alert transitions, marker movement) | Standard for any polished RN UI; v4 split the "worklets" runtime out of the core package — **you must install `react-native-worklets` alongside it or builds will fail**, this is a common upgrade trap. Confidence: HIGH. |
| react-native-worklets | **0.11.3** | Peer dependency of reanimated v4 | Install alongside reanimated — not optional. Confidence: HIGH. |
| react-native-gesture-handler | **3.1.0** | Gesture handling (bottom sheet drag, swipe-to-accept if designed) | Standard companion to Reanimated for RN; v3 aligns with New Architecture. Confidence: HIGH. |
| react-hook-form | **7.84.0** | Forms (signup, login, vehicle registration/edit) | Standard, minimal-re-render form library for RN; pairs with Zod via `@hookform/resolvers`. Confidence: HIGH. |
| zod | **4.4.3** | Runtime validation for forms and for hand-maintained API DTOs | PROJECT.md notes API types are hand-maintained mirrors of Go DTOs (no codegen) — Zod schemas double as both form validation and a runtime safety net against backend response drift, which matters more here than in a codegenned setup. Confidence: HIGH. |
| @hookform/resolvers | **5.6.0** | Wires Zod schemas into react-hook-form | Needed alongside both of the above. Confidence: HIGH. |
| expo-updates | **57.0.11** | EAS Update (OTA JS updates) | Already implied by PROJECT.md's "EAS-managed builds" constraint. Confirm channel strategy (e.g., `preview`/`production`) in `eas.json` early since it affects the dev-client/build workflow from day one. Confidence: HIGH. |
| expo-dev-client | **57.0.10** | Custom dev client (not Expo Go) | Already decided in PROJECT.md — confirmed correct and necessary given native modules used (maps, background location, push, MMKV). Confidence: HIGH. |
| expo-constants, expo-application, expo-device | 57.0.x each | App/device metadata (e.g., device info for correlation/debugging, EAS project ID lookup for push tokens) | `expo-constants` specifically is required to read the EAS `projectId` when requesting an Expo push token — not optional boilerplate. Confidence: HIGH. |
| @sentry/react-native | **8.21.0** | Crash/error monitoring | Not in PROJECT.md's prior decisions but strongly recommended given the app's core value ("reliably get matched... without missing or losing a job offer") — you need production visibility into WS disconnects, missed offers, and background-task failures, which are exactly the failure modes that are hard to reproduce locally. Add this before first EAS build, not as an afterthought. Confidence: MEDIUM (recommendation is sound; exact version should be re-checked at install time). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| eas-cli | Build/submit/update orchestration | Latest `21.4.0` at research time — install as a dev dependency or via `npx eas-cli@latest`, don't rely on the deprecated global `expo-cli`. |
| expo-doctor (`npx expo-doctor`) | Validates SDK/package version alignment | Run this before every EAS build during setup — catches the classic "installed a non-Expo-managed version of a native package" class of bug early, which is especially easy to hit with `react-native-maps`/`reanimated` version pinning. |
| ESLint (`eslint-config-expo`) + Prettier | Linting/formatting | Use Expo's official flat-config ESLint preset (`npx expo lint` scaffolds it) rather than hand-rolling a React Native ESLint config — it's kept in sync with each SDK. |

## Installation

```bash
# Scaffold (already assumed done per PROJECT.md, shown for completeness)
npx create-expo-app@latest --template blank-typescript

# Core navigation + data/state layer
npx expo install expo-router @tanstack/react-query zustand

# Styling
npx expo install nativewind
npm install -D tailwindcss@^3  # NativeWind v4 pins Tailwind v3, NOT v4 — see note below

# Maps
npx expo install react-native-maps

# Location + background task + push
npx expo install expo-location expo-task-manager expo-notifications expo-background-task expo-secure-store

# Animation/gesture (required peers)
npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler

# Forms/validation
npm install react-hook-form zod @hookform/resolvers

# Storage
npm install react-native-mmkv

# Dev client + updates (already implied by PROJECT.md constraints)
npx expo install expo-dev-client expo-updates expo-constants expo-application expo-device

# Monitoring
npx expo install @sentry/react-native

# Dev tooling
npx expo lint   # scaffolds eslint-config-expo + prettier
```

**Important correction to watch for:** NativeWind **v4** (the recommended version above) is built on **Tailwind CSS v3**, not v4 — this trips people up because "NativeWind v4 + Tailwind v4" sounds natural but is wrong; that pairing is what NativeWind **v5** (still pre-release) introduces. Follow NativeWind v4's own installation docs for the exact Tailwind version pin at install time rather than assuming latest Tailwind.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|--------------|-------------|--------------------------|
| react-native-maps | expo-maps | Only if you drop the iOS requirement entirely (not just defer it) and only need Apple Maps/Google Maps split — its alpha status and missing animated-marker/rotated-heading APIs make it unsuitable for this app's stated needs even for Android-only, per PROJECT.md's own rationale (confirmed still true in 2026). |
| Hand-rolled WebSocket client | A generic library (e.g., `reconnecting-websocket`, `socket.io-client`) | Only if the backend protocol grows more complex (multiple channels/rooms, ack-based delivery beyond simple replay-on-connect) — PROJECT.md's assessment that the protocol is simple enough to hand-roll is confirmed reasonable; don't add `socket.io-client` since the backend isn't Socket.IO, it's a plain WebSocket server (`/ws/driver`). |
| zustand + react-native-mmkv persist | Redux Toolkit + redux-persist | Only if the team anticipates much more complex cross-cutting state/middleware needs (time-travel debugging, complex derived selectors across many domains) than a driver app's online-status/job-offer/trip-lifecycle state warrants — unlikely to be justified here. |
| NativeWind v4 | Tamagui | Already rejected in PROJECT.md for iteration-speed reasons; confirmed reasonable — Tamagui's main edge (compile-time style extraction for perf) isn't a bottleneck at this app's scale, and NativeWind's Tailwind-familiar syntax lowers ramp-up cost for a solo/small team. |
| TypeScript 5.9.x | TypeScript 7.0 (native/Go compiler) | Once RN/Expo/Metro ecosystem tooling explicitly confirms compatibility with the new compiler (watch Expo's changelogs) — the 8-12x type-check speedup is attractive for a growing codebase, but adopting it greenfield today is premature given unresolved compiler-API-dependent tooling compatibility. |
| Native `fetch` + TanStack Query | axios | Only if you need axios-specific features (request/response interceptor chains beyond what a thin fetch wrapper + TanStack Query's `queryFn`/`onError` already give you, or automatic XSRF handling — irrelevant for a mobile app talking to a JWT-authenticated API). RN 0.86's built-in `fetch` is sufficient; axios adds bundle size and an extra abstraction layer with no real benefit for this app's needs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Expo Go (for any development beyond the very first "hello world") | This app requires native modules (react-native-maps, expo-location background mode, expo-notifications, MMKV) that Expo Go doesn't support; SDK 55+ additionally hard-errors (not just warns) on push notification usage inside Expo Go on Android | Custom dev client (`expo-dev-client`), already correctly decided in PROJECT.md |
| Legacy FCM "server key" push setup | Google has fully sunset the Legacy FCM HTTP API; Expo Push Service requires the FCM **v1** API with a Firebase service-account JSON as of the current SDK generation | FCM v1 credentials uploaded to EAS/Expo project config from the start — set this up in the same phase as the push-notification feature, not retrofitted later |
| `AsyncStorage` (or MMKV) for the JWT access token | Neither is encrypted at rest by default; a driver's auth token is a sensitive credential | `expo-secure-store` (Android Keystore-backed) |
| NativeWind v5 (pre-release) | Not yet promoted to `latest`; CSS-first Tailwind v4 config and the Babel-plugin removal are still stabilizing as of research date | NativeWind v4.2.6 (stable) |
| `socket.io-client` or other Socket.IO-protocol libraries | The backend's `websocket-gateway` speaks plain WebSocket (query-param token auth, small JSON message set), not the Socket.IO wire protocol — pulling in a Socket.IO client would add dead weight and false protocol expectations | Native `WebSocket` API (already available in RN/Hermes) wrapped in a small hand-rolled reconnect/backoff module, per PROJECT.md's own decision |
| Assuming the WebSocket connection survives Android backgrounding/app-kill | Confirmed by both Expo community reports and general Android OS background-execution limits: WS connections routinely close when the app is minimized/backgrounded on Android, independent of any JS-level reconnect logic — this is an OS-level constraint, not a library bug to work around | Push notifications (`expo-notifications`) as the source of truth for job offers when backgrounded/killed, with WS-reconnect-and-replay only covering the foreground/briefly-backgrounded case — this is exactly why PROJECT.md already lists both WS-replay-on-reconnect *and* push notifications as separate active requirements; treat that redundancy as required, not belt-and-suspenders overkill |

## Stack Patterns by Variant

**If the background-location phase (deferred per PROJECT.md's active requirements) is started:**
- Use `expo-location`'s `startLocationUpdatesAsync` with an `expo-task-manager`-registered task, plus Android's required persistent foreground-service notification (Android 8+ background execution limits mandate this — there's no way around showing a "go-ride is tracking your location" notification while a driver is online)
- Because Android silently stops background location updates without a foreground service once the app backgrounds; this is an OS constraint Expo's docs and community reports both confirm, not a bug to debug around

**If/when iOS support is picked back up (explicitly deferred, not descoped, per PROJECT.md):**
- Re-verify `react-native-maps` iOS Fabric support maturity at that time (it's the more actively-worked-on side of its New Architecture migration per current GitHub activity) and re-run the New-Architecture-interop risk assessment for both platforms together
- Because iOS background location entitlements, push cert/APNs setup, and TestFlight are all net-new work streams that should be scoped as their own phase, consistent with PROJECT.md's Out of Scope note

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `expo@57.0.9` | `react-native@0.86.x`, `react@19.2.x` | Always resolve via `npx expo install <pkg>`, never hand-pin RN/React versions independently of the Expo SDK — mismatches are the #1 cause of native build failures in Expo projects. |
| `react-native-reanimated@4.x` | `react-native-worklets` (separate package, any 0.11.x) | Reanimated v4 no longer bundles its own worklets runtime; omitting `react-native-worklets` causes a runtime crash, not a build-time error, making it an easy-to-miss trap. |
| `nativewind@4.x` | `tailwindcss@^3` (not v4) | Confirm exact pin against NativeWind's own docs at install time — v4/v3 pairing is correct, v4/v4 (which sounds more "current") is not. |
| `react-native-maps@1.29.0` | RN 0.86 New Architecture, via interop layer | Full native-Fabric support is still landing incrementally (iOS ahead of Android per current GitHub issue activity); treat as functional-but-verify, not a solved problem — see Pitfalls research for phase-planning implications. |
| `expo-notifications@57.0.8` | Firebase Cloud Messaging **v1 API** only | Legacy FCM API is fully sunset; a Firebase service-account JSON must be configured in the Expo/EAS project before Android push notifications will work at all — this is a setup dependency for the push-notification phase, not just a library install. |

## Sources

- [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57) — confirmed React Native 0.86 / React 19.2, "no breaking changes" framing, release timing (June 30, 2026). HIGH confidence.
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55) — confirmed Legacy Architecture removal, stable release Feb 25 2026, expo-notifications fixes. HIGH confidence.
- [Expo SDK 56 changelog / release coverage](https://expo.dev/changelog/sdk-56) — confirmed May 21 2026 release, RN 0.85/React 19.2. HIGH confidence.
- npm registry (`npm view <pkg> version`) for all package versions listed above, queried 2026-08-01. HIGH confidence for version numbers, MEDIUM for "is this still the right library" judgments where WebSearch-sourced.
- [react-native-maps GitHub releases](https://github.com/react-native-maps/react-native-maps/releases) and [Discussion #5355 on New Architecture support](https://github.com/react-native-maps/react-native-maps/discussions/5355) — confirmed partial/in-progress Fabric support as of v1.29.0. MEDIUM confidence (community-sourced, actively changing).
- [Expo Push Notifications FCM v1 migration blog](https://expo.dev/blog/expo-push-notifications-migrating-to-fcm-v1) and [Expo push notifications setup docs](https://docs.expo.dev/push-notifications/push-notifications-setup/) — confirmed FCM v1 requirement. HIGH confidence.
- [NativeWind v5 docs/migration guide](https://www.nativewind.dev/v5) — confirmed v5 pre-release status and Tailwind v4 basis, contrasted with stable v4's Tailwind v3 basis. MEDIUM confidence (pre-release, timeline could shift).
- WebSearch coverage of RN New Architecture mandatoriness (RN 0.82+), TypeScript 7.0 native compiler ecosystem readiness, WebSocket Android-background-kill behavior, and MMKV vs AsyncStorage community consensus — MEDIUM confidence throughout (multiple independent sources agreeing, but not Context7/official-doc-verified for every claim).

---
*Stack research for: Android-first Expo/React Native ride-hailing driver app*
*Researched: 2026-08-01*
