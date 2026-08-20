import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { driverClient } from '../../api/driver-client';
import { driverTripsClient } from '../../api/driver-trips-client';
import { profileKeys } from '../profile/api';

export const presenceKeys = {
  all: ['presence'] as const,
  earnings: (period: string) => [...presenceKeys.all, 'earnings', period] as const,
  onlineTime: (period: string) => [...presenceKeys.all, 'online-time', period] as const,
};

/** Wraps the already-wired driverClient.setOnlineStatus (PATCH /driver/online).
 *  Deliberately does NOT catch the 403s — callers map them with kycBlockReason()
 *  from ../kyc/kyc-errors, exactly as Phase 01.1's vehicle-activation flow does
 *  (see that phase's forward note). Swallowing them here would hide genuinely
 *  unexpected failures too.
 *  Invalidates ['profile'] because Driver.is_online is served from
 *  GET /driver/profile, and the D06 profile chip reads its online/offline label
 *  from that cached driver. */
export function useSetOnlineStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isOnline: boolean) => driverClient.setOnlineStatus(isOnline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}

/** D06 stat card 1. staleTime 60s: today's earnings change only when a trip
 *  completes, and the driver is looking at a map, not a ledger. */
export function useTodayEarningsQuery() {
  return useQuery({
    queryKey: presenceKeys.earnings('today'),
    queryFn: () => driverTripsClient.getEarnings('today'),
    staleTime: 60_000,
  });
}

/** D06 stat card 2. Same 60s staleTime — the value is a running duration, so a
 *  minute of staleness is invisible at the card's 1-minute display granularity. */
export function useTodayOnlineTimeQuery() {
  return useQuery({
    queryKey: presenceKeys.onlineTime('today'),
    queryFn: () => driverTripsClient.getOnlineTime('today'),
    staleTime: 60_000,
  });
}
