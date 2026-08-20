import { requestWithBase } from './http-client';
import type { UpdateLocationPayload, UpdateLocationResponse } from './types';

// location-producers runs on its OWN service and port (local dev :8081), not
// go-ride-backend's :8080. Its handler calls decoder.DisallowUnknownFields(), so the
// payload must carry only keys declared on UpdateLocationPayload — build the object
// conditionally rather than spreading undefined values in.
// Auth note: this service enforces no auth today (a known go-ride-backend-side gap,
// see STATE.md Blockers) — we send the bearer token anyway so it just works once the
// gap closes.
const LOCATION_BASE_URL = process.env.EXPO_PUBLIC_LOCATION_BASE_URL;

export const locationClient = {
  updateLocation: (payload: UpdateLocationPayload) =>
    requestWithBase<UpdateLocationResponse>(LOCATION_BASE_URL, '/update-location', {
      method: 'POST',
      body: payload,
    }),
};
