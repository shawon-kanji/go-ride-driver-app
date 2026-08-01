# Pitfalls Research

**Domain:** Ride-hailing driver app — Expo/React Native, Android-first, realtime WebSocket job offers, background location
**Researched:** 2026-08-01
**Confidence:** MEDIUM-HIGH (Android background-execution and FCM-priority behavior verified against Firebase/Android official docs; Expo-specific gotchas verified against expo/expo GitHub issues; OEM battery-killer specifics are well-documented community knowledge, verify against dontkillmyapp.com for the specific device models you test on)

## Critical Pitfalls

### Pitfall 1: OEM battery managers kill the app before Android's own Doze/standby ever kicks in

**What goes wrong:**
Standard Android background-execution guidance (foreground service + `WAKE_LOCK` + Doze whitelisting) is necessary but not sufficient. Xiaomi (MIUI/HyperOS), Huawei (EMUI), OnePlus (OxygenOS), Samsung, Oppo/Vivo and others ship their own battery managers layered on top of AOSP that kill background processes and foreground services independently of stock Android's rules — often within minutes of the screen turning off, and they frequently reset "autostart"/"protected apps" permissions after OTA updates. A driver can be "online" in the app's UI while the process is actually dead, silently missing every job offer until they next open the app.

**Why it happens:**
Teams test on Pixel/stock-Android emulators or their own daily-driver phone, see background location and the WebSocket survive fine, and assume the behavior generalizes. It doesn't — MIUI, EMUI, and OxygenOS collectively cover a huge share of the low/mid-range Android market that ride-hailing drivers actually use.

**How to avoid:**
- Treat OEM battery-killer handling as a first-class feature, not a bug-fix backlog item: on first "go online," detect OEM (via `Build.MANUFACTURER`) and route through OEM-specific settings deep links (autostart list, protected apps, "no restrictions" battery setting) with a short explainer screen, following patterns from dontkillmyapp.com.
- Request `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` exemption for the driver-online foreground service (Play Store explicitly allows this for apps whose core function requires uninterrupted background execution — a driver dispatch app qualifies, similar to navigation apps).
- Test on at least one real (not emulator) Xiaomi/MIUI or OnePlus device before considering background location "done" — emulators do not reproduce OEM battery managers.
- Surface an in-app health check ("background location: last update Xm ago") so drivers/support can detect silent kills rather than discovering it via a missed-fare complaint.

**Warning signs:**
- Background location updates or WS connections that work reliably in dev (screen-on, USB-connected) but degrade over a multi-hour real-world soak test with screen off.
- Support/QA reports of "app said I was online but I got no offers" that correlate with specific phone brands.

**Phase to address:**
Background location tracking phase (explicitly flagged in PROJECT.md as "a later phase") — but the OEM-detection/settings-deeplink UX and the battery-exemption request should be designed alongside the online/offline toggle phase so the groundwork (manufacturer detection, permission-education screens) isn't bolted on afterward.

---

### Pitfall 2: Data-only FCM/push messages do not reliably run app code when the app is killed

**What goes wrong:**
PROJECT.md requires "driver receives push notifications for job offers when the app is backgrounded/killed." The natural implementation is a data-only FCM message that Expo's background task handler processes to show a custom job-offer UI (with accept/decline actions and a countdown). This works when the app is backgrounded but is unreliable-to-nonexistent when the app process has been killed by Android: system-level restrictions mean custom JS/background-task code frequently does not execute at all in the killed state, so drivers who had the app swiped away (or OEM-killed, see Pitfall 1) silently never see the offer.

**Why it happens:**
Expo/React Native background message handling relies on the JS bundle being loaded to run custom logic; in the killed state, Android gives apps a very narrow, unreliable execution window, and this is a widely-reported gap in `expo-notifications` (see expo/expo issues #14078, #31886).

**How to avoid:**
- Send FCM messages with a `notification` payload (not data-only) for job offers, so Android OS displays the notification directly without requiring app JS to run, even when killed.
- For the ~15s TTL urgency, use a high-priority FCM message plus a full-screen intent notification (the same mechanism VoIP/call apps use) so the offer appears as an "incoming call"-style takeover screen even over the lock screen — this is the pattern Uber/Lyft-style driver apps use and is explicitly sanctioned by Android for time-sensitive, "losing this costs real money" use cases.
- Do not rely on a JS `setTimeout` for the offer countdown when the app might be backgrounded — Android freezes JS timers when the app isn't foregrounded, so a countdown UI built purely in JS state will not tick accurately after backgrounding, and may show a stale (already-expired) offer as still live when the user returns to the app. Compute expiry from the offer's server-provided timestamp, not elapsed local timer ticks.
- Verify actual delivery-when-killed behavior with real device testing (force-stop the app, send a test job offer) before considering the push-notification phase complete — do not trust that it "should work" from foreground/backgrounded testing alone.

**Warning signs:**
- Push notification tests only ever done with the app backgrounded (not force-stopped/killed).
- Countdown UI implemented as `setInterval` decrementing local state rather than deriving remaining time from a server timestamp.

**Phase to address:**
Push notifications phase — this should be scoped explicitly as "notification-type FCM messages with full-screen intent for killed-state delivery," not "wire up expo-notifications," to avoid discovering the killed-state gap late.

---

### Pitfall 3: WebSocket connection silently dies in the background with no signal to the app or user

**What goes wrong:**
React Native WebSocket connections are not guaranteed to survive backgrounding on Android — the OS can suspend network I/O for a backgrounded app, and the connection drops without a clean close event firing promptly. The app's local "connected" state can remain stale/true, so the driver appears online and the UI shows no error, while the server-side `websocket-gateway` may or may not know the connection died (depending on its own read-deadline/ping-pong timeout). Job offers dispatched during this window are lost from the driver's perspective, recoverable only via the reconnect-replay mechanism or, per PROJECT.md, push notification as a fallback.

**Why it happens:**
Developers build and test WebSocket reconnect logic against foreground network drops (airplane mode toggle, wifi-to-cell handoff) but don't specifically test the background-then-resume path, which behaves differently on Android (the socket may already be dead before `AppState` even fires the background event).

**How to avoid:**
- Don't treat "backgrounded" as "still connected" — proactively close/reconnect the WebSocket on `AppState` transitions rather than waiting for a read timeout to detect the drop, and re-run the connect-time replay-offers flow (already planned per PROJECT.md) on every foreground transition, not just cold start.
- Implement exponential backoff with jitter for reconnect attempts, and cap max backoff low enough that a driver who briefly backgrounds the app (e.g., checking a map app) doesn't miss a 15s-TTL offer waiting for the next reconnect attempt.
- Treat push notification delivery (Pitfall 2) as the load-bearing fallback for the "app backgrounded during exact offer window" case — the WebSocket path alone cannot guarantee delivery given Android's background network suspension, this is a known, accepted architecture gap per PROJECT.md's own requirements list, not something to "fix" at the WS layer.
- Server-side: confirm `websocket-gateway`'s ping/pong or read-deadline is short enough (well under the 15s offer TTL) that it marks a driver's connection dead promptly and falls back to push, rather than holding a stale connection open for minutes.

**Warning signs:**
- App UI shows "online"/"connected" for a driver whose socket died minutes ago (only detectable via server-side connection metrics or manual background+reconnect testing).
- No `AppState` listener driving an active reconnect/replay cycle — reconnect logic that only fires on `onclose`/`onerror` events.

**Phase to address:**
WebSocket realtime job-offer phase — reconnect-on-foreground and replay-on-reconnect are core acceptance criteria, not a hardening pass. Cross-check against `websocket-gateway`'s server-side timeout config (see `go-ride-kafka-consumers`) during this phase, not after.

---

### Pitfall 4: Android 14 foreground service type mismatch crashes the app or gets the build rejected

**What goes wrong:**
Starting with Android 14 (API 34), any foreground service must declare a specific `foregroundServiceType` (e.g., `location`) and the app must hold the matching runtime permission (`FOREGROUND_SERVICE_LOCATION` in addition to `ACCESS_BACKGROUND_LOCATION`). If the app starts a location foreground service without background location permission already granted, the system throws a `SecurityException` and crashes the app outright — this has bitten Expo SDK 50+ users (expo/expo #26846, #27336). Separately, Play Console requires declaring foreground service types and their justification under Policy → App content before a build targeting API 34+ can be published; missing this causes review rejection, not just a runtime crash.

**Why it happens:**
`expo-location`'s background-location config plugin changed its required Android manifest/permission wiring across SDK versions; teams following slightly outdated tutorials or copy-pasted `app.json` snippets miss the new `FOREGROUND_SERVICE_LOCATION` permission or the Play Console declaration step, and it's invisible in local dev (Expo Go/dev client behave differently) until a production-targeted build hits a real Android 14 device or Play review.

**How to avoid:**
- Pin and read the `expo-location` docs for the exact Expo SDK version in use (not a general "how background location works" article) when configuring the background-location config plugin, and confirm which Android target SDK the project builds against.
- Explicitly request `ACCESS_BACKGROUND_LOCATION` and confirm it's granted *before* starting the location foreground service, never assume permission ordering.
- Add the Play Console "foreground service type" declaration (with justification text) as an explicit checklist item before the first production/internal-testing submission, not something discovered at review time.
- Test the exact "go online" flow on a real Android 14+ device, not just an older emulator image, since this is precisely where the manifest/permission mismatch manifests as a crash.

**Warning signs:**
- Foreground-service location code that only specifies `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` without a background-location-specific permission request flow.
- App builds and runs fine in Expo dev client on an older Android emulator but hasn't been smoke-tested on an Android 14 device.

**Phase to address:**
Background location tracking phase (foreground-service-backed). Also touches the online/offline toggle phase if foreground location broadcasting there is later upgraded to a foreground service.

---

### Pitfall 5: Job-offer accept race ("first-wins") isn't designed for in the UI, producing confusing dead-ends

**What goes wrong:**
Per the backend (`driver-request-handler`'s `POST /job-offers/{id}/accept`), acceptance is a first-wins row lock — the losing driver(s) get an error response, not a success. If the app doesn't explicitly design for this (e.g., generic error toast, or worse, silently doing nothing), a driver who taps "accept" a beat too late sees a confusing failure with no clear next step, and — per PROJECT.md's explicit out-of-scope note — there's no backend reject/decline endpoint yet, so "offer lost" is only knowable by TTL expiry or a failed accept call.

**Why it happens:**
Happy-path UI design (accept → success → trip screen) is built first and the "someone else got it" branch is treated as a generic API-error case rather than a first-class, expected, frequent outcome in a competitive-dispatch system.

**How to avoid:**
- Design an explicit "offer no longer available" state (distinct from generic network/server errors) triggered by the accept endpoint's conflict response, returning the driver directly to "waiting for next offer" rather than a dead-end error screen.
- Make the accept button state clearly reflect the TTL countdown (disabled/relabeled as it nears expiry) so drivers aren't tapping accept on an offer that's about to lose the race anyway.
- Since there's no reject endpoint, ensure the offer UI auto-dismisses cleanly at TTL expiry without requiring user action, and doesn't leave a stale "accept/decline" screen on top of the app after the offer window has passed.

**Warning signs:**
- Only one accept-flow UI state (loading → success) mocked up during design; no explicit "lost the race" mock.
- Manual testing only ever done with a single test driver account (the race condition literally can't be observed without ≥2 concurrent drivers).

**Phase to address:**
Accept job offer phase — should be tested with at least two simulated concurrent drivers against the real `trip-dispatch-worker`/`driver-request-handler` flow, not just single-driver happy-path testing.

---

### Pitfall 6: 60-minute hard JWT expiry with no refresh token silently logs the driver out mid-shift or mid-trip

**What goes wrong:**
PROJECT.md flags this as a known, non-blocking backend gap: `go-ride-backend` has no refresh-token endpoint, so access tokens hard-expire after 60 minutes. If the app doesn't handle this proactively, a driver mid-trip (or mid-shift, connected to the WebSocket) can have their token expire silently — WS auth (query-param token) fails on reconnect, the location-broadcast/foreground-service calls start failing with 401s, and the driver has no clear signal that they need to re-authenticate, potentially losing connectivity to job offers or being unable to complete an in-progress trip's HTTP actions (start/end/cash-collection).

**Why it happens:**
Token expiry is easy to overlook until it's hit in practice, since a 60-minute session comfortably outlasts most manual testing sessions; the failure mode (silent background 401s) doesn't surface until a long-running background/soak test or a real multi-hour shift.

**How to avoid:**
- Build explicit, proactive expiry handling now even though there's no refresh endpoint to swap the token for: track the token's expiry client-side, and surface a clear "session expiring — please log in again" prompt with enough lead time that it doesn't interrupt an active trip unexpectedly (e.g., warn at 55 minutes).
- Ensure the WebSocket reconnect logic (Pitfall 3) distinguishes an auth-failure close (expired token) from a network-failure close, so it stops silently retrying with a token it knows is dead and instead routes to re-login.
- Treat this as a flagged external blocker for the online/job-offer phase per PROJECT.md — but the client-side expiry-awareness UX doesn't require the backend fix and should ship regardless.

**Warning signs:**
- WS/API error handling that treats all 401s the same as generic network errors, with generic retry logic that never resolves.
- No client-side tracking of token expiry timestamp (only reactive handling after a request fails).

**Phase to address:**
Auth phase (client-side expiry tracking/warning UX) and WebSocket realtime job-offer phase (distinguishing auth-close from network-close in reconnect logic).

---

### Pitfall 7: Testing exclusively in Expo Go or a stale dev client masks native-config-plugin breakage

**What goes wrong:**
Background location, push notifications, and full-screen-intent notifications all require native config plugins and custom native code that Expo Go cannot run (PROJECT.md correctly specifies a custom dev client for this reason). But it's easy to add/change a config plugin (`app.json`/`app.config.js` `plugins` array) — e.g., adjusting background-location or notification permission config — without rebuilding the dev client via EAS Build, and keep developing against a stale dev client binary that doesn't reflect the new native config. Everything "looks fine" (JS hot-reloads normally) until a fresh install or production build reveals the config was never actually applied natively.

**Why it happens:**
JS-level changes hot-reload instantly in a dev client, creating a false sense that native config changes did too; only `expo prebuild`/EAS Build actually regenerates native project files from plugin config.

**How to avoid:**
- Any time `app.json`/`app.config.js` native config (permissions, plugins, foreground service config, notification config) changes, rebuild the dev client via EAS Build (or `expo prebuild` + local build) before trusting subsequent test results — don't assume the running dev client already reflects it.
- Add a checklist step to the background-location and push-notification phases specifically: "rebuilt dev client after last native config change? Y/N" before marking acceptance criteria met.
- Periodically test against a genuinely fresh install (uninstall/reinstall, or a new EAS internal-distribution build) rather than an iteratively-hot-reloaded dev client, to catch config drift.

**Warning signs:**
- Background location or push notifications "worked yesterday" but stop working after a permissions/manifest tweak, with no dev-client rebuild in between.
- Team relying on `expo start` + existing dev client for weeks without an intervening EAS Build.

**Phase to address:**
Every native-module-touching phase (background location, push notifications, maps) — call this out explicitly in each phase's setup/verification steps.

---

### Pitfall 8: Google Play's background location policy review blocks or delays the release, discovered too late

**What goes wrong:**
Apps requesting `ACCESS_BACKGROUND_LOCATION` on Android must complete Google Play's background location permission declaration (Policy → App content) with justification, a prominent in-app disclosure before the permission prompt, and pass a manual policy review — this can take days and can bounce the submission back for clarification. Teams that build the feature and only think about the Play Console declaration/disclosure UX right before submission risk a launch-blocking delay.

**Why it happens:**
The permission itself is trivial to request in code; the *policy* requirements (prominent disclosure screen with specific required language, declaration form, potential video/screenshot evidence) are a separate, easy-to-defer compliance task that doesn't block local development at all.

**How to avoid:**
- Build the "why we need your location in the background" prominent-disclosure screen (shown before the OS permission dialog, not just relying on the OS dialog's own text) as part of the background-location phase's actual UI work, not a launch-week afterthought.
- Fill out and submit the Play Console background location declaration as soon as a build requesting the permission is ready for internal testing, so review turnaround doesn't sit on the critical path to a real release.
- Budget calendar time (days, not hours) for this review specifically when sequencing the background-location phase against any target ship date.

**Warning signs:**
- Background location permission requested directly from a settings toggle with no preceding in-app explanation screen.
- Play Console app content declarations left blank going into a release-candidate build.

**Phase to address:**
Background location tracking phase — include the disclosure UI and Play Console declaration as explicit deliverables, not just the `expo-location` integration.

---

### Pitfall 9: Naive `react-native-maps` usage drains battery and janks the UI under continuous location updates

**What goes wrong:**
A driver's map view re-renders the driver marker (and potentially rider/route markers) on every location update. Without optimization, this causes markers to redraw every render cycle regardless of whether their position actually changed, contributing to CPU load, jank, and — compounding Pitfall 1 — additional battery drain on top of the location tracking itself, undermining the very battery-conservation goals background location work is trying to protect.

**Why it happens:**
`react-native-maps`'s default marker behavior re-evaluates view changes on every prop update; this is invisible at low update frequency during dev testing but compounds once location updates stream continuously during a real online session.

**How to avoid:**
- Set `tracksViewChanges={false}` on markers once their icon/content has stabilized (only `true` during the brief update itself), which has been reported to meaningfully improve marker-render performance.
- Memoize marker components and debounce map region/camera updates rather than re-centering on every single location tick.
- Profile actual battery/CPU usage during a long-running online session (not just visual smoothness) before considering the online/map phase complete.

**Warning signs:**
- Marker components with no `tracksViewChanges` handling, re-created inline in render rather than memoized.
- No debounce on location-update-driven map camera changes.

**Phase to address:**
Online/offline + foreground location broadcast phase, revisited again in the background location phase where update frequency and duration both increase.

---

### Pitfall 10: No mock-location/GPS-spoofing guard on driver location broadcasts

**What goes wrong:**
Nothing in the current requirements addresses detecting spoofed/mocked GPS location (e.g., via developer options "mock location app" or rooted-device spoofing tools). A malicious or fraud-motivated driver could broadcast a fabricated location to game dispatch matching (e.g., appear closer to lucrative areas than they are), which is a well-known abuse vector in gig-economy location-based dispatch systems.

**Why it happens:**
It's not part of the "happy path" feature set and has no functional impact on a legitimate driver's experience, so it's easy to leave unaddressed until fraud is observed in production.

**How to avoid:**
- At minimum, check Android's `Location.isFromMockProvider()` (exposed by most location libraries, verify `expo-location`'s equivalent) on each location fix used for dispatch-relevant broadcasts, and flag/reject broadcasts from mock providers server-side or client-side.
- Treat this as a backend-and-client joint concern — note it as a flagged gap for `location-producers` (which per PROJECT.md context currently has no auth enforcement despite a configured JWT secret) rather than assuming client-side checks alone are sufficient, since a modified client can bypass client-side checks entirely.
- Scope depth of anti-spoofing work to actual fraud risk observed — this doesn't need to be exhaustive for an MVP, but the absence of even a basic mock-provider check is worth flagging explicitly rather than silently omitting.

**Warning signs:**
- Location broadcast code with no mock-provider check anywhere in the pipeline.
- No server-side plausibility check (e.g., implausible speed/jump between consecutive fixes) in `location-producers`/`location-consumers`.

**Phase to address:**
Online/offline + foreground location broadcast phase for the basic client-side check; flag server-side hardening as a backend follow-up outside this repo's scope per PROJECT.md's "backend is a dependency" constraint.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Foreground-only location tracking before implementing background tracking (already planned per PROJECT.md) | Ships the core online/matching loop faster | Drivers who background the app while online silently stop broadcasting location, degrading dispatch quality until background phase lands | Acceptable as an explicit, time-boxed MVP phase — exactly as PROJECT.md scopes it — as long as it's communicated as a known gap, not treated as "done"|
| Data-only FCM messages instead of notification-type + full-screen intent, to move faster | Simpler client code, no full-screen-intent native config needed | Job offers silently undelivered when app is killed (Pitfall 2) — undermines the core value prop ("without missing or losing a job offer") | Never acceptable for the killed-app-state case given this app's explicit core value proposition; acceptable only as a stopgap for backgrounded (not killed) state during early development |
| Relying on OS-default battery optimization dialog text instead of building OEM-specific onboarding | Faster to ship initial online/offline toggle | Silent job-offer loss on Xiaomi/Huawei/OnePlus devices (Pitfall 1), hard to diagnose from support tickets | Acceptable for an initial internal-testing build on the team's own devices; not acceptable before wider driver rollout |
| Skipping the accept-race "offer taken" UI state, showing a generic error instead | Saves one UI state's design/implementation time | Confusing driver experience during real dispatch contention, support burden | Only acceptable for a single-driver internal demo; must be addressed before any multi-driver pilot |
| Client-side-only mock-location check with no server-side validation | Fast to add, no backend coordination needed | Bypassable by a modified/rooted client, doesn't actually stop determined fraud | Acceptable for MVP given low initial driver volume; flag explicitly as a backend follow-up, don't present as "handled" |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| `expo-location` background tracking | Assuming SDK-generic tutorials apply to the exact Expo SDK version in use; missing `FOREGROUND_SERVICE_LOCATION` permission for Android 14+ | Read the docs for the pinned Expo SDK version specifically; explicitly request background permission before starting a location foreground service |
| Firebase Cloud Messaging (via `expo-notifications`) | Sending data-only messages and expecting reliable killed-state delivery/processing | Send `notification`-type, high-priority messages for job offers; reserve data-only high-priority messages for cases that do generate a visible notification, to avoid Google's throttling of "silent" high-priority abuse |
| `websocket-gateway` (query-param token auth) | Assuming the WS connection survives backgrounding; not distinguishing an auth-failure close from a network close | Proactively reconnect on every foreground transition and re-run replay; branch reconnect logic on close reason/code so an expired token routes to re-login, not an infinite retry loop |
| `react-native-maps` | Letting Google Maps API key restrictions (Android package + SHA-1) fall out of sync between debug/EAS-internal/production build variants, each with a different signing cert and thus different SHA-1 | Register SHA-1 fingerprints for every build profile (dev client, EAS internal distribution, production) that will hit the Maps API, not just the final production cert |
| EAS Build / config plugins | Iterating on JS while a stale dev client silently doesn't reflect recent native config changes (Pitfall 7) | Rebuild the dev client via EAS Build after any `app.json`/plugin config change touching native permissions/services |
| `driver-request-handler` JWT audience (`aud` claim) | Assuming auth "works" because login succeeds, without checking whether subsequent WS/HTTP calls are actually accepted — per PROJECT.md this is presently a known blocking mismatch (`aud=go-ride-clients` issued vs `aud=go-ride-drivers`/`go-ride-driver-app` expected) | Treat this as an explicit external blocker to confirm resolved before the online/job-offer phase is considered testable end-to-end against real backend services, not something to silently work around client-side |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Marker re-render on every location tick | UI jank, elevated CPU/battery use during long online sessions | `tracksViewChanges={false}`, memoized marker components, debounced camera updates | Noticeable within a single multi-hour online shift, not in short dev-loop testing |
| Unbounded WebSocket reconnect attempts without backoff cap | Battery/network drain during connectivity flapping (e.g., driving through poor-coverage areas), potential server-side connection-storm load on `websocket-gateway` | Exponential backoff with a sane max interval and jitter | Becomes visible once tested under realistic intermittent-connectivity conditions (e.g., driving, not stationary wifi testing) |
| High-frequency location broadcast interval reused unchanged from foreground into background tracking | Faster battery drain than necessary once background tracking ships, since background needs a coarser cadence than foreground live-tracking | Use a deliberately coarser update interval/distance-filter for background vs. foreground broadcasting | Surfaces as driver complaints about battery drain after the background-location phase ships, if foreground-tuned settings were carried over unchanged |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Auth token passed as a WebSocket query parameter (already the chosen protocol design per PROJECT.md) | Query strings are commonly logged by proxies/load balancers/access logs, risking token leakage into logs | Ensure any infra sitting in front of `websocket-gateway` (per `go-ride-infra`) is configured not to log full request URLs/query strings for the WS upgrade endpoint; keep token TTL short-ish given this exposure surface |
| Storing the JWT in unencrypted storage (e.g., plain AsyncStorage) | Token theft via device compromise/backup extraction, account takeover, ability to broadcast fraudulent location under a driver's identity | Use `expo-secure-store` (Android Keystore-backed) for token persistence, not plain AsyncStorage |
| No mock-location detection on location broadcasts (see Pitfall 10) | Location-spoofing fraud affecting dispatch fairness/accuracy | At minimum, mock-provider flag check on the client; flag server-side validation as a backend follow-up |
| Trusting `location-producers`' currently-unenforced JWT auth (per PROJECT.md, "configured JWT secret" but no enforcement) as if it were already secured | Any client could currently spoof location updates for arbitrary drivers against the real backend | Treat as an explicit external blocker/flag, not something silently relied upon as "already secure" during this app's development |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| No visible signal when the WebSocket/background connection has silently died while "online" | Driver believes they're receiving offers and misses fares, with no way to self-diagnose | Surface a lightweight connection-health indicator (e.g., "reconnecting..." state) tied to actual socket health, not just the online/offline toggle intent |
| Generic error UI for a lost first-wins accept race | Confusing dead-end, driver unsure whether to retry, wait, or the app is broken | Distinct "offer no longer available" state that returns cleanly to the waiting-for-offers screen |
| OS default battery-optimization/background-location permission dialogs shown with no preceding context | Higher permission-decline rates, since users reflexively deny unexplained background-location requests, directly undermining the core "never miss an offer" value prop | Prominent, plain-language in-app explanation screen immediately before each OS permission prompt (also required for Play policy compliance, Pitfall 8) |
| Job-offer countdown UI that doesn't match actual server-side TTL truth after backgrounding/reconnect | Driver taps accept on an offer that's already expired server-side, or misses a still-valid offer they thought had expired | Derive remaining time from the server-provided offer timestamp/TTL on every render, not accumulated local timer state |
| Silent session expiry (Pitfall 6) mid-trip | Driver unable to complete trip actions (end trip, collect cash) with no clear explanation | Proactive expiry warning before the 60-minute cliff, especially if a trip is active |

## "Looks Done But Isn't" Checklist

- [ ] **Background location tracking:** Often missing OEM-specific battery-exemption UX (MIUI/EMUI/OxygenOS) — verify on at least one real non-Pixel device with the app backgrounded for an extended period, not just an emulator.
- [ ] **Push notifications for job offers:** Often missing killed-app-state delivery — verify with the app force-stopped (not just backgrounded), confirming a full-screen/notification-type message actually surfaces the offer.
- [ ] **WebSocket reconnect/replay:** Often missing an active reconnect trigger on app-foreground transition — verify by backgrounding the app for several minutes (long enough for the OS to suspend the socket), sending a job offer, then foregrounding and confirming replay delivers it.
- [ ] **Job offer accept flow:** Often missing the "lost the race" state — verify with two concurrent test driver sessions both accepting the same offer, confirming the loser gets a clear, non-generic outcome.
- [ ] **Google Maps API key:** Often missing SHA-1 registration for every build variant (dev client, EAS internal, production) — verify maps actually render in each build profile, not just the one profile tested during development.
- [ ] **Android 14 foreground service:** Often missing the `FOREGROUND_SERVICE_LOCATION` permission and/or Play Console foreground-service-type declaration — verify on an Android 14+ device and check Play Console app content status before submission.
- [ ] **Session/token expiry:** Often missing any proactive client-side expiry handling — verify by artificially expiring/invalidating a token mid-session and confirming the app surfaces a clear re-login prompt rather than silent failures.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| OEM background kills discovered late (post-launch) | MEDIUM | Add OEM-detection onboarding flow retroactively; push as an app update; consider an in-app "why am I not getting offers" diagnostic/FAQ pointing drivers to their specific device's battery settings |
| Killed-app push delivery gap discovered late | MEDIUM-HIGH | Requires reworking the FCM payload from data-only to notification-type + full-screen intent, plus new native Android notification-channel/permission config — budget for a dedicated fix cycle, not a quick patch |
| Android 14 foreground service crash discovered via Play review rejection | LOW-MEDIUM | Add missing permission + Play Console declaration; typically a config-only fix, but re-review turnaround adds calendar delay |
| Mock-location fraud discovered in production | MEDIUM | Add client-side mock-provider check as a fast patch; coordinate with backend team for server-side plausibility validation as a proper fix (cross-repo, slower) |
| JWT audience mismatch blocking end-to-end testing | Not this repo's cost — external blocker | Coordinate with `go-ride-backend` to reconcile `aud` claim configuration; this app cannot self-resolve it per PROJECT.md's constraints |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| OEM battery managers killing the app (#1) | Background location tracking phase (with groundwork in online/offline phase) | Real-device (non-Pixel) multi-hour soak test with screen off |
| Data-only push undelivered when killed (#2) | Push notifications phase | Force-stop test: send job offer to a killed app, confirm visible notification with working accept action |
| WebSocket silently dying in background (#3) | WebSocket realtime job-offer phase | Background app several minutes, dispatch offer, foreground, confirm replay delivers it |
| Android 14 foreground service crash (#4) | Background location tracking phase | Run on real Android 14+ device; confirm Play Console foreground-service-type declaration completed |
| First-wins accept race UX gap (#5) | Accept job offer phase | Two-concurrent-driver test against real `driver-request-handler`, confirm loser gets clear non-generic state |
| Silent JWT expiry mid-session (#6) | Auth phase (client tracking) + WebSocket phase (close-reason branching) | Artificially expire token mid-session, confirm proactive warning and graceful reconnect-to-login flow |
| Stale dev client masking native config drift (#7) | Every native-module phase (location, push, maps) | Explicit "dev client rebuilt after last config change" check before marking phase acceptance criteria met |
| Play background-location policy review delay (#8) | Background location tracking phase | Prominent disclosure UI built and Play Console declaration submitted well ahead of target release date |
| Map marker/battery performance (#9) | Online/offline + foreground location phase, revisited in background phase | Profile CPU/battery during extended online session, not just visual smoothness |
| Mock-location/GPS spoofing (#10) | Online/offline + foreground location phase (client check); flagged as backend follow-up | Confirm mock-provider flag check present in location broadcast code path |

## Sources

- [Firebase: Set and manage Android message priority](https://firebase.google.com/docs/cloud-messaging/android-message-priority) — HIGH confidence, official docs
- [Firebase Blog: Ensure your FCM notifications reach your users on Android (Apr 2025)](https://firebase.blog/posts/2025/04/fcm-on-android/) — HIGH confidence, official/recent
- [Android Developers: Foreground service types are required (API 34)](https://developer.android.com/about/versions/14/changes/fgs-types-required) — HIGH confidence, official docs
- [Expo: Location SDK docs](https://docs.expo.dev/versions/latest/sdk/location/) — HIGH confidence, official docs (verify against the exact pinned SDK version used)
- [expo/expo GitHub #26846 — Android 14 foreground service permission requirements](https://github.com/expo/expo/issues/26846) — MEDIUM-HIGH confidence, official repo issue tracker
- [expo/expo GitHub #27336 — Android 14 foreground service permission crash](https://github.com/expo/expo/issues/27336) — MEDIUM-HIGH confidence
- [expo/expo GitHub #14078 — NotificationResponseReceivedListener not called when app is killed](https://github.com/expo/expo/issues/14078) — MEDIUM confidence, real reported issue, cross-referenced with #31886
- [expo/expo GitHub #31886 — Unclear notification handling for killed app state](https://github.com/expo/expo/issues/31886) — MEDIUM confidence
- [dontkillmyapp.com — OEM battery management reference (via search summary)](https://dontkillmyapp.com) — MEDIUM confidence community-maintained reference; verify against current device-specific pages for target test devices
- [DEV Community: What Android OEMs do to background apps, and the 11 layers built to survive it](https://dev.to/stoyan_minchev/what-android-oems-do-to-background-apps-and-the-11-layers-i-built-to-survive-it-28bb) — MEDIUM confidence, practitioner account, consistent with dontkillmyapp.com guidance
- [ProAndroidDev: Full-Screen Intent (FSI) Notifications in Android 14 & 15](https://proandroiddev.com/full-screen-intent-fsi-notifications-in-android-14-15-what-changed-why-its-breaking-and-e5e862a75936) — MEDIUM confidence
- [Android Developers: full-screen intent guidance for time-sensitive notifications](https://medium.com/android-news/full-screen-intent-notifications-android-85ea2f5b5dc1) — MEDIUM confidence, cross-referenced with forasoft.com production guide
- react-native-maps marker performance (`tracksViewChanges`) — MEDIUM confidence, consistent findings across multiple independent practitioner sources (sandny.com, Medium performance-tips articles)
- Google Play `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` policy allowed/disallowed use cases — MEDIUM confidence, community-summarized policy interpretation; verify current exact policy text in Play Console Help before relying on it for a submission
- Project-internal context (JWT audience mismatch, no refresh token, `location-producers` auth gap, WS query-param token auth, first-wins accept semantics) — HIGH confidence, sourced directly from `/Users/shawonkanji/Documents/projects/go-ride-driver-app/.planning/PROJECT.md` and this session's `CLAUDE.md` context on the sibling `go-ride-kafka-consumers` backend

---
*Pitfalls research for: ride-hailing driver app (Expo/React Native, Android-first)*
*Researched: 2026-08-01*
