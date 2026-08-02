import { apiRequest } from './http-client';
import type { Vehicle, VehiclePayload } from './types';

export const vehiclesClient = {
  listVehicles: () => apiRequest<{ vehicles: Vehicle[] }>('/driver/vehicles'),

  getVehicle: (id: string) => apiRequest<{ vehicle: Vehicle }>(`/driver/vehicles/${id}`),

  createVehicle: (payload: VehiclePayload) =>
    apiRequest<{ vehicle: Vehicle }>('/driver/vehicles', { method: 'POST', body: payload }),

  updateVehicle: (id: string, payload: VehiclePayload) =>
    apiRequest<{ vehicle: Vehicle }>(`/driver/vehicles/${id}`, {
      method: 'PATCH',
      body: payload,
    }),

  activateVehicle: (id: string) =>
    apiRequest<{ vehicle: Vehicle }>(`/driver/vehicles/${id}/activate`, { method: 'POST' }),

  deleteVehicle: (id: string) =>
    apiRequest<void>(`/driver/vehicles/${id}`, { method: 'DELETE' }),
};
