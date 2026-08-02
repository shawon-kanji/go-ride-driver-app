import { z } from 'zod';

// Only first_name/last_name are editable — mirrors PATCH /driver/profile exactly.
// Email and password have no editable path anywhere in the backend.
export const editProfileSchema = z.object({
  first_name: z.string().trim().min(2).max(100),
  last_name: z.string().trim().min(2).max(100),
});
export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
