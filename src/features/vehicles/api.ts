import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { vehiclesClient } from '../../api/vehicles-client';
import type { VehiclePayload } from '../../api/types';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehicleKeys.all, 'list'] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
};

export function useVehiclesQuery() {
  return useQuery({ queryKey: vehicleKeys.list(), queryFn: vehiclesClient.listVehicles });
}

export function useVehicleQuery(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesClient.getVehicle(id),
  });
}

// Every mutation below invalidates the whole ['vehicles'] prefix, not just the
// touched vehicle's key. Required because activate() silently flips a *different*
// vehicle's is_active server-side that the mutation response has no id for — a
// narrower cache update would leave a stale "active" badge on that other vehicle.
function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
}

export function useCreateVehicleMutation() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (payload: VehiclePayload) => vehiclesClient.createVehicle(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateVehicleMutation(id: string) {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (payload: VehiclePayload) => vehiclesClient.updateVehicle(id, payload),
    onSuccess: invalidate,
  });
}

export function useActivateVehicleMutation() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (id: string) => vehiclesClient.activateVehicle(id),
    onSuccess: invalidate,
  });
}

export function useDeleteVehicleMutation() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (id: string) => vehiclesClient.deleteVehicle(id),
    onSuccess: invalidate,
  });
}
