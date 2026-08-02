import { apiRequest } from './http-client';
import type { Driver, UpdateProfilePayload } from './types';

export const driverClient = {
  getProfile: () => apiRequest<{ driver: Driver }>('/driver/profile'),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiRequest<{ driver: Driver }>('/driver/profile', { method: 'PATCH', body: payload }),

  setOnlineStatus: (isOnline: boolean) =>
    apiRequest<{ driver: Driver }>('/driver/online', {
      method: 'PATCH',
      body: { is_online: isOnline },
    }),
};
