import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { driverClient } from '../../api/driver-client';
import { useSessionStore } from '../../stores/session-store';
import { profileKeys } from './api';
import type { Driver } from '../../api/types';

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    const cached = queryClient.getQueryData<{ driver: Driver }>(profileKeys.detail());
    if (cached?.driver.is_online) {
      // Best-effort — logout must proceed regardless of whether this succeeds.
      try {
        await driverClient.setOnlineStatus(false);
      } catch {
        // swallow
      }
    }

    await useSessionStore.getState().clearSession();
    queryClient.clear();
    router.replace('/(auth)/login');
  };
}
