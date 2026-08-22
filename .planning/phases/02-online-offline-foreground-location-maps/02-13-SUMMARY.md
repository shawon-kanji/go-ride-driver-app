---
phase: 02-online-offline-foreground-location-maps
plan: 13
type: execute
wave: 7
status: complete
---

# 02-13 Summary: Device checkpoint — Maps + online/offline + location broadcast

## What was verified on-device

Physical Android device (`R5CR2116JDY`), dev-client build via `npx expo run:android`,
against the full local backend stack (`go-ride-backend` + all `go-ride-kafka-consumers`
services + Postgres/Kafka/AIStor via `go-ride-infra/local`).

- **Maps tiles**: `HomeMap` renders real Google Maps tiles (not blank/grey) on the device
  build — confirms `MAP_API_KEY` reached `AndroidManifest.xml` correctly and the key's
  Android package + SHA-1 restriction matches this build.
- **KYC + vehicle-active gate**: exercised the real `deriveOnlineGate` path — driver started
  with an incomplete document set, manually approved the remaining documents + activated the
  vehicle directly in Postgres (documented dev workflow, no backoffice UI in scope), and
  confirmed the online toggle unlocked immediately after.
- **Online/offline toggle**: `PATCH /driver/online` round-trips correctly from D07's
  `ConfirmOnlineSheet`; `is_online` flips in Postgres each time.
- **Foreground location broadcast — end to end, confirmed working after a real bug fix**:
  a location ping from the device reached `location-producers` → Kafka
  (`driver.location.updated.v1`) → `location-consumers` → `driver_locations` row, with the
  device's actual GPS coordinates. See Bug Found below — broadcasting did not work until this
  was fixed.
- **Document upload (KYC presigned-URL flow)**: confirmed working after a separate
  infra-config bug (see below) — selfie/govt-ID-front and two vehicle documents were
  uploaded from the device through the real presign → PUT → confirm pipeline.

## Not exercised this session

- Extended multi-hour real-GPS movement/battery cadence (02-VALIDATION.md's own
  "Manual-Only Verifications" table flags this as inherently un-batchable in one sitting).
  What *was* confirmed: the first ping fires immediately on going online (heartbeat sentinel
  behavior), with correct coordinates. Sustained 10s-movement/60s-heartbeat tiering over a
  long session is unverified beyond this.
- Phase 01.1's checkpoint (01.1-07 Task 3) steps 7–10 (gallery-fallback upload, rejected-doc
  re-upload flow, replace-approved-document confirm dialog, KYC-blocked activation banner)
  were not exercised tonight — only steps 4–6 and an equivalent of step 11 (manual approval
  unlocking the gate) were covered as a side effect of testing Phase 2. That checkpoint stays
  open; see STATE.md Pending Todos.

## Bugs found and fixed (real defects, not scope deviations)

1. **`useSessionStore.driver` stayed `null` after any session restore.** `hydrate()` (run on
   every app relaunch that isn't a fresh login) never populated `driver`, only the initial
   `setSession()` at login did. `location-broadcaster.ts`'s `handleFix` reads
   `useSessionStore.getState().driver?.id` and silently no-ops when it's null — so permission
   checks, `watchPositionAsync`, and `handleFix` itself all fired correctly, but the actual
   `POST /update-location` never went out, with no error surfaced anywhere (by design, per
   the "best-effort ping" comment). Root-caused via temporary diagnostic logging placed at
   each stage of the pipeline, narrowing it to this one silent guard. Fixed in
   `src/features/presence/use-location-broadcast-lifecycle.ts`: the lifecycle hook now
   mirrors `useProfileQuery()`'s driver into `useSessionStore` on every load, since that
   query is guaranteed fresh regardless of how the session was established.
2. **`StatCards.tsx`'s `formatMinutes` leaked float precision into the UI**
   (`"4.322342525466766m"`). `total % 60` was applied directly to a fractional
   `total_minutes` from the backend without flooring first. Fixed by flooring to whole
   minutes before splitting into h/m.

## Infra/config issues found and fixed (not app-code bugs — local dev setup only)

Both are in `go-ride`'s sibling `scripts/run-all.sh`, not in this repo, but blocked device
testing of this phase and are recorded here since they'll otherwise resurface for anyone else
running this phase's manual checkpoint:

1. `run-all.sh` started every Go service with `go run ./cmd/api` without sourcing that
   service's own `.env` — so `driver-request-handler`, `cab-request-handler`, and
   `websocket-gateway` (which have no `JWT_SECRET` default) failed to boot, and
   `go-ride-backend` silently fell back to its own default JWT secret instead of the shared
   `.env` value, meaning tokens signed by one service wouldn't validate against another.
   Fixed by sourcing each service directory's `.env` before `eval`\ing its run command.
2. Same root cause caused KYC document uploads to 404: `go-ride-backend`'s `STORAGE_ENDPOINT`
   never reached the process, so its S3 client fell back to real AWS S3
   (`*.s3.us-east-1.amazonaws.com`) instead of the local AIStor/MinIO container — the device
   obviously can't reach a bucket that doesn't exist there. Fixed by the same `.env`-sourcing
   change; presigned URLs now correctly point at `http://localhost:9000` (adb-reversed to the
   device).

## Verdict

Phase 2's four success criteria (no-vehicle blocks online / active-vehicle unlocks online /
own position renders on map while online / foreground location broadcasts while online) are
all confirmed working on a real device against a real backend. Approving 02-13's checkpoint
on that basis — see 02-VALIDATION.md sign-off.
