import { useMutation } from "@tanstack/react-query";

import { login } from "@/features/auth/api/auth.service";
import type { LoginFormValues } from "@/features/auth/types";
import { useAuthStore } from "@/store/auth.store";

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: LoginFormValues) =>
      login({ email: email.trim().toLowerCase(), password }),
    onSuccess: async (tokens, variables) => {
      await useAuthStore.getState().setSession(tokens, variables.rememberMe);
    },
  });
}
