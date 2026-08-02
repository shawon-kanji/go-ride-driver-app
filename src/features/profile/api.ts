import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { driverClient } from '../../api/driver-client';
import type { UpdateProfilePayload } from '../../api/types';

export const profileKeys = {
  detail: () => ['profile'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: driverClient.getProfile,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => driverClient.updateProfile(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(profileKeys.detail(), result);
    },
  });
}
