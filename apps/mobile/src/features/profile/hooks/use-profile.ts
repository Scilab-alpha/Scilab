import { useQuery } from "@tanstack/react-query";

import { getMyProfile } from "@/features/profile/api/profile.service";

export const profileQueryKey = ["profile", "me"] as const;

export function useProfile() {
  return useQuery({
    queryFn: ({ signal }) => getMyProfile(signal),
    queryKey: profileQueryKey,
  });
}
