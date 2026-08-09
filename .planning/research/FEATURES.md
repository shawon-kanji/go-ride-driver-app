# Feature Research

**Domain:** Ride-hailing driver-side mobile app (Expo/React Native, Android-first, cash-only MVP)
**Researched:** 2026-08-01
**Confidence:** MEDIUM-HIGH (feature landscape is well-documented across Uber/Bolt/Grab/Lyft public materials and driver-community discussion; specific numeric details like heatmap refresh intervals are LOW confidence and not load-bearing for this project)

> **Resolved 2026-08-09:** every "confirm with backend whether KYC exists" callout below is now answered — it does. See `.planning/REQUIREMENTS.md` VEH-04. Left as-written; still useful context for why it was flagged P2/MEDIUM-HIGH rather than folded into Phase 1.

## Feature Landscape

This research is scoped to the **driver-side** app only (not the rider-facing product). Every incumbent — Uber Driver, Bolt Driver, Grab Driver, Lyft Driver — converges on the same core loop: **go online → receive offer → accept → navigate → complete trip → get paid → repeat**, wrapped in onboarding/compliance and a safety layer. Where they differentiate is earnings intelligence (heatmaps, guaranteed-earnings promos), gamification, and multi-service breadth (Grab's delivery/parcel stack). Given this project's PROJECT.md already locks in cash-only, email+password auth, no reject-offer UX, and Android-first, this document evaluates the full ecosystem landscape but flags where the project's existing decisions already resolve a feature question (rather than re-litigating it).

### Table Stakes (Users Expect These)

Features professional drivers assume exist. Missing these makes the app unusable for earning a living, not just "incomplete."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sign up / log in | Baseline account access; every competitor gates the app behind driver auth | LOW | Already scoped: email+password against `go-ride-backend`. |
| Profile view/edit | Drivers manage contact info, photo, payout details | LOW | Already an Active requirement. |
| Vehicle registration & management (multiple vehicles, activate/deactivate) | Drivers often own/rent multiple vehicles or switch between them; platform must know which vehicle is "live" | MEDIUM | Already scoped; a driver needs an *active* vehicle before going online — this is a hard dependency (see Feature Dependencies). |
| Document/vehicle verification (KYC) at onboarding | Every incumbent (Uber, Bolt, Grab, Lyft) requires license photo + selfie + vehicle docs before a driver can accept trips — regulatory and trust requirement | MEDIUM-HIGH | Not in current Active requirements list — PROJECT.md doesn't mention a document-upload/verification flow. Flag as a likely gap: without it, "vehicle registration" has no compliance teeth. Worth confirming with backend whether this exists server-side or is deferred entirely. |
| Online/offline toggle | The fundamental "am I working" switch every driver app has | LOW | Already scoped. |
| Foreground location broadcast while online | Dispatch can't match a driver it can't locate | MEDIUM | Already scoped as foreground-first; background is later. |
| Realtime job offer delivery (push when backgrounded, WebSocket when foregrounded, replay on reconnect) | The single most safety-critical UX in the entire app — a missed offer is lost income and a bad first impression of reliability | HIGH | Already scoped and correctly identified in PROJECT.md's Core Value statement. This is the feature this whole app exists to get right. |
| Accept offer within TTL (first-wins) | Matches how every platform structures dispatch — offers are broadcast/timed, first acceptance wins | MEDIUM | Already scoped (~15s TTL via HTTP). |
| Trip detail preview before/at accept (pickup distance, fare estimate) | Drivers decide whether a trip is worth taking; all four incumbents surface pickup ETA and estimated fare on the offer card | LOW-MEDIUM | Depends on what `driver.job_offer.created.v1` payload already carries — check event contract before assuming new backend work is needed. |
| In-app or deep-linked turn-by-turn navigation to pickup, then to dropoff | Drivers cannot do the job without directions; this is non-negotiable | MEDIUM | See Anti-Features — the *build* choice (native nav engine vs. map display + deep link to Google Maps/Waze) matters more than the requirement itself. |
| Trip lifecycle actions: arrived, start, end, cancel | Mirrors real-world trip stages; already scoped for start/end/cash/cancel | MEDIUM | Already scoped. "Arrived" (notify rider driver is at pickup) is a common intermediate state worth confirming exists in the backend's trip state machine — not explicitly named in PROJECT.md's Active list. |
| Cash payment collection & confirmation | MVP is cash per PROJECT.md; every driver needs a screen to mark "cash collected" to close the trip loop | LOW-MEDIUM | Already scoped. |
| Trip history / past trips list | Drivers need a record for reconciliation, disputes, and taxes | LOW-MEDIUM | Not explicitly in Active requirements — worth flagging for the roadmap; every incumbent has this. |
| Basic earnings summary (today/this week totals, trip count) | Drivers check this constantly; it's the primary reason they open the app between trips | LOW-MEDIUM | Not explicitly in Active requirements. Even a simple sum-of-completed-trip-fares view meets table-stakes bar; the elaborate Uber "Pro dashboard" tier is a differentiator, not table stakes. |
| Driver rating visibility (and being rated by riders) | Standard trust mechanism across all incumbents; low rating affects standing | LOW-MEDIUM | Depends on backend having a rating endpoint/table — verify before committing to a phase. |
| Basic safety: emergency/SOS affordance | Bolt and Grab both ship an SOS button; regulatory and liability pressure makes this close to non-negotiable in most markets | MEDIUM | Not in current scope. At minimum, "call local emergency services" deep link is a low-cost version of this; full incident-reporting/trip-sharing is a differentiator (see below). Recommend flagging as a near-table-stakes gap for the roadmap even though PROJECT.md doesn't mention it. |
| Push notifications for offers when backgrounded/killed | Already scoped; matches all four incumbents (this is how they keep drivers reachable without keeping the app foregrounded and draining battery) | HIGH | Already scoped. |

### Differentiators (Competitive Advantage)

Not required to be a functioning driver app, but where incumbents compete for driver retention/loyalty.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Demand heatmap / suggested zones | Uber's rides heatmap and "Driving Insights" dashboard help drivers position themselves for more offers; directly increases driver earnings and therefore platform liquidity | HIGH | Requires historical/real-time demand aggregation on the backend — no evidence this exists in `go-ride-kafka-consumers` yet. Not a v1 candidate; flag as v2+. |
| Reliable WS reconnect + offer replay done *better* than incumbents | PROJECT.md's Core Value is explicitly "without missing or losing a job offer" — this is the app's actual differentiation, not a bolt-on feature | HIGH | Already the design center of the WebSocket gateway work; this is where craft investment should go disproportionately. |
| In-app rider contact (masked call / chat) | Reduces friction locating riders at pickup; standard-ish across incumbents once a platform matures | MEDIUM-HIGH | No evidence `go-ride-backend` has telephony masking or a chat channel yet — backend dependency, not purely a driver-app feature. Defer until backend supports it. |
| Trip-sharing with a trusted contact (safety) | Bolt's "share live trip status" feature; meaningful trust/safety differentiator, especially for a new platform trying to earn driver confidence | MEDIUM | Reuses location broadcast infrastructure already being built for dispatch — relatively low incremental cost once background location exists. Good v1.x candidate. |
| Multi-stop trip support | Higher-value trips, matches Uber/Lyft/Bolt "multiple stops" feature | MEDIUM | No evidence of backend support for multi-stop trip requests; defer. |
| Detailed performance analytics (acceptance rate, cancellation rate, completion rate breakdowns) | Uber Pro-style gamified tiers drive retention but add real complexity | MEDIUM-HIGH | Nice-to-have; not aligned with current MVP's cash-first, minimal-scope philosophy. v2+. |
| Bold/vibrant, intentionally-designed visual identity (vs. Uber's monochrome minimalism) | Already a stated non-negotiable product requirement in PROJECT.md, positions the app closer to Bolt/Grab's approachable brand tone than Uber's utilitarian one | MEDIUM | This is a differentiator on brand/feel, not on feature checklist — but it's real: driver apps are famously utilitarian, and a well-designed one stands out. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| In-app payment gateway | "Riders expect cashless payment like Uber" | Explicitly out of scope per PROJECT.md; requires backend payment-processor integration, PCI concerns, reconciliation logic — large scope addition with no current backend support | Cash-only MVP, driver-confirmed collection (already the plan). Revisit jointly with backend once core loop is validated. |
| Phone number + OTP auth | "Feels more mobile-native, matches most consumer apps" | Explicitly out of scope; `go-ride-backend` only supports email+password today, switching would require backend auth-model changes not currently planned | Keep email+password; revisit only if backend adds OTP support. |
| Driver decline/reject-offer button | Seems obviously necessary — "why can't I say no?" | Backend has no reject endpoint; a reject button with nowhere to send the reject would either no-op or require inventing undocumented backend behavior | Let offers expire via TTL (already how losing an offer is communicated); revisit once backend ships a reject endpoint (noted in PROJECT.md as a known gap). |
| Building a custom turn-by-turn navigation engine | "Full control over the driver navigation experience, like Uber's in-house nav" | Very high cost (routing engine, live traffic, voice guidance, map data licensing) for a benefit real-world drivers frequently opt out of anyway — driver community consensus is that most prefer Waze/Google Maps over platform-native navigation regardless of platform | Use `react-native-maps` (already decided) for map display + trip visualization, and deep-link out to Google Maps/Waze for actual turn-by-turn guidance, OR use Google Routes API purely for ETA/fare-distance calculation without building guidance UI. |
| Multi-service platform (food delivery, parcel, etc., à la Grab) | "Grab shows this is where the market goes, more services = more driver earning opportunities" | Massive scope expansion unrelated to the ride-hailing core loop this project and its backend are built around; `go-ride-backend`/`go-ride-kafka-consumers` have zero delivery-domain modeling | Stay scoped to ride-hailing. If delivery is ever wanted, treat it as a separate product initiative, not a feature added to this app. |
| Gamified incentive/tier system (Uber Pro-style rewards, streaks, badges) | "Improves driver retention and engagement" | Requires backend-side incentive computation, is a growth/retention lever appropriate for a mature platform with real driver-volume data, not a pre-launch MVP | Defer entirely until there's a driver base large enough to make incentive design meaningful. |
| Real-time chat with rider | "Riders expect to be able to message the driver" | No backend messaging channel exists; building one is a meaningful scope addition (message storage, delivery guarantees, moderation) for a use case largely covered by a phone call or pickup-instructions field | Defer; if needed short-term, a free-text "pickup notes" field set at trip-request time (rider side) may cover 80% of the real need without a live chat feature. |

## Feature Dependencies

```
Vehicle registered + active
    └──requires──> Driver can go online
                       └──requires──> Driver can receive job offers (WS connected / push registered)
                                          └──requires──> Driver can accept job offer (HTTP, within TTL)
                                                             └──requires──> Driver can start trip
                                                                                └──requires──> Driver can end trip
                                                                                                   └──requires──> Driver can collect cash payment
                                                                                                                      └──enables──> Trip appears in trip history
                                                                                                                      └──enables──> Trip counts toward earnings summary

Document/vehicle verification (KYC)
    └──should gate──> Vehicle "active" status (compliance dependency — verify with backend whether this is enforced today or missing entirely)

Push notification registration (device token)
    └──requires──> Driver logged in
    └──enables──> Job offers reachable while app is backgrounded/killed

Background location tracking (later phase)
    └──enhances──> Reliability of job offer targeting while app isn't foregrounded
    └──conflicts with──> None directly, but is a superset of the foreground-only broadcast already scoped — sequencing matters (foreground first, as already decided)

Trip-sharing with contact (differentiator)
    └──requires──> Location broadcast infrastructure (already being built for dispatch)

In-app rider contact (masked call/chat)
    └──requires──> Backend telephony/messaging support (does not exist yet — external blocker)

Demand heatmap
    └──requires──> Backend historical/aggregate demand data pipeline (does not exist yet — external blocker)

Driver decline/reject-offer UX
    └──requires──> Backend reject endpoint (does not exist yet — external blocker, noted in PROJECT.md)
```

### Dependency Notes

- **Vehicle active status gates going online:** already explicit in PROJECT.md ("a driver needs an active vehicle before going online"). This must land in an earlier phase than online/offline toggle work.
- **Document verification should gate vehicle activation, but currently doesn't appear scoped anywhere:** this is the single biggest gap this research surfaces. Either (a) `go-ride-backend` already enforces this server-side and the app just needs an upload UI, or (b) it genuinely doesn't exist yet and vehicles can be marked "active" with zero compliance check. Worth a direct question to backend before roadmap phases are finalized — it changes whether "vehicle registration" is a 1-phase or 2-phase feature.
- **Several differentiators/near-table-stakes items (masked calling, chat, heatmap, reject UX) are blocked on backend work not currently planned.** These should not be scheduled into early roadmap phases regardless of driver-app-side complexity, because there's nothing to build against yet.
- **Trip-sharing-with-contact is comparatively cheap** because it reuses location-broadcast plumbing the core loop already requires — good v1.x candidate once the core loop (through cash collection) is proven.

## MVP Definition

### Launch With (v1)

This mirrors PROJECT.md's existing Active requirements — confirmed by this research as the correct table-stakes set, with two gaps flagged for explicit roadmap decisions.

- [x] Sign up / log in (email+password) — baseline access, already scoped
- [x] Profile view/edit — already scoped
- [x] Vehicle registration/list/update/activate-deactivate — already scoped, gates going online
- [x] Online/offline toggle — already scoped
- [x] Foreground location broadcast while online — already scoped
- [x] Realtime job offers (WS + reconnect replay + push when backgrounded/killed) — already scoped, this *is* the product's core value
- [x] Accept job offer within TTL — already scoped
- [x] Trip lifecycle: start, end, collect cash, cancel — already scoped
- [x] Bold/vibrant visual identity — already scoped as a hard product requirement
- [ ] **Trip history list** — not currently in Active requirements; recommend adding. Table stakes across every incumbent, low-medium complexity, and a natural byproduct of the trip-lifecycle data already being captured.
- [ ] **Basic earnings summary (today/week totals)** — not currently in Active requirements; recommend adding. Same rationale — drivers check this constantly, and it's cheap to compute from completed trips once trip history exists.

### Add After Validation (v1.x)

- [ ] Document/vehicle KYC verification flow — trigger: once confirmed whether backend already enforces this or needs it built; this closes the biggest compliance gap in the current scope
- [ ] "Arrived at pickup" trip-state notification — trigger: confirm whether backend's trip state machine already models this distinct from "start trip"; if so, cheap to surface
- [ ] Basic SOS/emergency affordance (even a simple "call emergency services" deep link) — trigger: before any real driver pilot, given liability/trust considerations every incumbent treats as near-mandatory
- [ ] Driver rating visibility — trigger: once confirmed backend has a rating data model
- [ ] Trip-sharing with a trusted contact — trigger: once background location tracking phase lands (reuses that plumbing)
- [ ] Refresh-token flow — trigger: this is a backend gap noted in PROJECT.md (60-min hard expiry forces re-login); not a "feature" per se but will materially hurt driver retention if a driver gets logged out mid-shift. Flag for backend coordination.

### Future Consideration (v2+)

- [ ] Demand heatmap / suggested positioning zones — defer: requires backend aggregate-demand pipeline that doesn't exist; high build cost relative to a pre-launch, single-vehicle-type MVP
- [ ] In-app masked calling / chat with rider — defer: blocked on backend telephony/messaging support that doesn't exist
- [ ] Multi-stop trips — defer: blocked on backend trip-request model support
- [ ] Gamified incentive/tier system — defer: only makes sense with a real driver base and volume data
- [ ] In-app payment gateway — defer: explicitly out of scope per PROJECT.md, joint backend scoping required
- [ ] Driver decline/reject-offer UX — defer: blocked on backend reject endpoint (explicitly out of scope per PROJECT.md until backend adds one)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Realtime job offers (WS + push + replay) | HIGH | HIGH | P1 |
| Accept offer within TTL | HIGH | MEDIUM | P1 |
| Online/offline toggle + vehicle-active gating | HIGH | LOW-MEDIUM | P1 |
| Trip lifecycle (start/end/cash/cancel) | HIGH | MEDIUM | P1 |
| Auth (signup/login) | HIGH | LOW | P1 |
| Vehicle registration/management | HIGH | MEDIUM | P1 |
| Bold/vibrant visual identity | MEDIUM | MEDIUM | P1 |
| Trip history | MEDIUM-HIGH | LOW-MEDIUM | P1 |
| Basic earnings summary | MEDIUM-HIGH | LOW-MEDIUM | P1 |
| Document/vehicle KYC verification | HIGH (compliance) | MEDIUM-HIGH | P2 |
| SOS/emergency affordance | MEDIUM-HIGH (trust/safety) | LOW-MEDIUM | P2 |
| Driver rating visibility | MEDIUM | LOW-MEDIUM | P2 |
| Trip-sharing with contact | MEDIUM | MEDIUM | P2 |
| Refresh-token flow (backend-dependent) | MEDIUM (retention) | LOW (app side) / backend work | P2 |
| Demand heatmap | MEDIUM | HIGH | P3 |
| In-app rider contact (call/chat) | MEDIUM | MEDIUM-HIGH | P3 |
| Multi-stop trips | LOW-MEDIUM | MEDIUM | P3 |
| Gamified incentives/tiers | LOW-MEDIUM | HIGH | P3 |
| In-app payment gateway | HIGH (long-term) | HIGH | P3 (explicit later milestone) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Uber Driver | Bolt Driver | Grab Driver | Our Approach (go-ride Driver) |
|---------|-------------|-------------|-------------|-------------------------------|
| Job offer delivery | Push + in-app real-time queue; "Driver Preferences" for trip radius/destination filters | Real-time offer with short accept window | Real-time offer, similar accept window | WebSocket + push, first-wins accept, ~15s TTL, reconnect replay — architecture already decided |
| Navigation | Proprietary in-app nav (historically weak per driver community), most drivers still prefer Waze/Google Maps | Uses Google Maps under the hood for driver-facing navigation in most markets | Uses Google Maps | `react-native-maps` for display; deep-link to external nav app for turn-by-turn (recommended, avoid building proprietary nav engine) |
| Earnings visibility | Rich: Driving Insights dashboard, Pro-tier fuel savings, tax withholding estimates, instant cashout | Simpler weekly/daily earnings breakdown | Wallet-style earnings + incentive tracking | Simple today/week totals for MVP; richer dashboard deferred to v2+ |
| Demand guidance | Real-time surge heatmap (10-min refresh, purple surge overlay) | Basic demand indicators in some markets | Demand hotspots in some markets | Deferred — no backend demand-aggregation pipeline exists yet |
| Safety | SOS button, trip verification, RideCheck-style anomaly detection | SOS button, driver verification (license + selfie), live trip-sharing with a third party | SOS button, verified drivers | Recommend minimal SOS affordance as P2; full anomaly detection out of scope for MVP |
| Payments to riders | Cashless (card/wallet) is default; cash supported in some markets | Cashless default, cash in some markets | Cashless (GrabPay) + cash in some markets | Cash-only MVP, driver-confirmed collection — deliberate MVP scope choice already made |
| Auth | Phone + OTP | Phone + OTP | Phone + OTP | Email + password — deliberate divergence to avoid backend auth-model changes |
| Multi-service | Rides + Eats + other verticals in one driver app in many markets | Rides-focused, some markets add delivery | Rides + delivery + parcel, heavily multi-service | Rides-only, deliberately — anti-feature per this research |

## Sources

- [Introducing the Driving Insights dashboard — Uber blog](https://www.uber.com/us/en/blog/driving-insights-dashboard/) — MEDIUM confidence, official Uber source
- [Enhancing Uber's Guidance Heatmap with Deep Probabilistic Models — Uber blog](https://www.uber.com/us/en/blog/enhancing-ubers-guidance-heatmap-with-deep-probabilistic-models/) — MEDIUM confidence, official Uber engineering blog
- [Earnings Heatmap — Uber blog](https://www.uber.com/us/en/blog/earnings-heatmap/) — MEDIUM confidence, official Uber source
- [How Much Do Drivers Make? — Uber](https://www.uber.com/us/en/drive/how-much-drivers-make/) — MEDIUM confidence, official
- [Safety features for Bolt partner drivers — Bolt](https://bolt.eu/en/driver/safety/) — MEDIUM confidence, official Bolt source
- [Bolt's Driver Verification Feature Lauded for Improving App Safety — TechMoran](https://techmoran.com/2025/11/10/bolts-driver-verification-feature-lauded-for-improving-app-safety/) — LOW-MEDIUM confidence, trade press, but corroborated by Bolt's own safety page
- [Bolt introduces additional safety features on driver's App — Connecting Africa](https://www.connectingafrica.com/emerging-technology/bolt-introduces-additional-safety-features-on-driver-s-app) — LOW-MEDIUM confidence, trade press
- [As an Uber driver, do you prefer the in-app navigation, Google, or Waze? — Quora](https://www.quora.com/As-an-Uber-driver-do-you-prefer-the-in-app-navigation-Google-or-Waze-and-what-are-the-reasons-for-your-preference) — LOW confidence individually, but corroborated across multiple driver-community sources (Uber People forum, Upworthy analysis) — used only to support the "don't build proprietary navigation" anti-feature recommendation, not a load-bearing factual claim
- [New driver - which navigation? — Uber Drivers Forum](https://www.uberpeople.net/threads/new-driver-which-navigation.487731/) — LOW confidence, community forum, directional signal only
- General ecosystem/table-stakes framing corroborated across multiple ride-hailing dev-agency blogs (icoderzsolutions, vivocabs, zetaton, grepixit) — LOW-MEDIUM confidence individually (marketing-adjacent sources), used only where consistent across all of them (navigation, dashboard, document verification, wallet as universal essentials)
- Internal project context: `/Users/shawonkanji/Documents/projects/go-ride-driver-app/.planning/PROJECT.md` — HIGH confidence, ground truth for what's already decided/out of scope in this project

---
*Feature research for: ride-hailing driver-side mobile app*
*Researched: 2026-08-01*
