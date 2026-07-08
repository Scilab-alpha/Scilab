import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { updateMyProfile } from "@/features/profile/api/profile.service";
import { profileQueryKey } from "@/features/profile/hooks/use-profile";
import type { ProfileFormValues } from "@/features/profile/types/profile.type";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (values: ProfileFormValues) => {
      const dateOfBirth = values.dateOfBirth.trim();

      return updateMyProfile({
        ...(dateOfBirth ? { dateofbirth: dateOfBirth } : {}),
        firstname: values.firstName.trim(),
        ...(values.gender ? { gender: values.gender } : {}),
        lastname: values.lastName.trim(),
      });
    },
    onError: (error) => {
      showToast(getUserFriendlyApiErrorMessage(error), {
        title: "Profile update failed",
        tone: "error",
      });
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
      useAuthStore.getState().setUser({
        email: profile.email,
        firstName: profile.firstName,
        id: profile.id,
        imageUrl: profile.imageUrl,
        lastName: profile.lastName,
        role: profile.role,
        status: profile.status,
      });
      showToast("Your personal information is up to date.", {
        title: "Profile saved",
        tone: "success",
      });
    },
  });
}
