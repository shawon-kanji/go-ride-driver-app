import { z } from 'zod';

// Shared by register and update — go-ride-backend's RegisterVehicleRequest and
// UpdateVehicleRequest have identical fields/validation.
export const vehicleSchema = z.object({
  plate_number: z.string().trim().min(2).max(20),
  color: z.string().trim().min(2).max(50),
  model_name: z.string().trim().min(1).max(100),
  seat_count: z.number().int().min(1).max(20),
  category: z.enum(['normal', 'luxury']),
});
export type VehicleFormValues = z.infer<typeof vehicleSchema>;

export const CATEGORY_OPTIONS = [
  { label: 'Normal', value: 'normal' as const },
  { label: 'Luxury', value: 'luxury' as const },
];
