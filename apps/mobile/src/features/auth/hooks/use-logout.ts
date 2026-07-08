import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { logout } from "@/features/auth/api/auth.service";
import { useAuthStore } from "@/store/auth.store";

export function useLogout() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      queryClient.clear();
      await useAuthStore.getState().clearSession();
      showToast("You have been safely signed out.", {
        title: "Signed out",
        tone: "success",
      });
    },
  });
}
