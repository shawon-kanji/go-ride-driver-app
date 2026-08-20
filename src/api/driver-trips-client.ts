import { requestWithBase } from './http-client';
import type { EarningsResponse, OnlineTimeResponse } from './types';

// driver-request-handler runs on its OWN service and port (local dev :8084) with the
// apiPrefix /api/v1/driver-trips already baked into EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL.
// Driver JWT bearer auth, same token as go-ride-backend. period is validated
// server-side against exactly {"today","week"} (see internal/api/period.go).
const DRIVER_TRIPS_BASE_URL = process.env.EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL;

export type StatsPeriod = 'today' | 'week';

export const driverTripsClient = {
  getEarnings: (period: StatsPeriod = 'today') =>
    requestWithBase<EarningsResponse>(DRIVER_TRIPS_BASE_URL, `/earnings?period=${period}`),
  getOnlineTime: (period: StatsPeriod = 'today') =>
    requestWithBase<OnlineTimeResponse>(DRIVER_TRIPS_BASE_URL, `/online-time?period=${period}`),
};
