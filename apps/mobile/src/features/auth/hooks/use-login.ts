import { useMutation } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { getCurrentUser, login } from "@/features/auth/api/auth.service";
import type { LoginFormValues } from "@/features/auth/types";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

export function useLogin() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ email, password, rememberMe }: LoginFormValues) => {
      const tokens = await login({
        email: email.trim().toLowerCase(),
        password,
      });
      const authStore = useAuthStore.getState();

      await authStore.setSession(tokens, rememberMe);

      try {
        const user = await getCurrentUser();
        authStore.setUser(user);
        return user;
      } catch (error) {
        await authStore.clearSession();
        throw error;
      }
    },
    onSuccess: (user) => {
      showToast(`Welcome back, ${user.firstName ?? user.email}.`, {
        title: "Signed in successfully",
        tone: "success",
      });
    },
    onError: (error) => {
      showToast(getUserFriendlyApiErrorMessage(error, "login"), {
        title: "Sign-in unsuccessful",
        tone: "error",
      });
    },
  });
}
