import { useMutation } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { registerStudent } from "@/features/auth/api/auth.service";
import type { RegisterFormValues } from "@/features/auth/types";
import { getUserFriendlyApiErrorMessage } from "@/services/api";

export function useRegister() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      dateOfBirth,
      email,
      firstName,
      gender,
      lastName,
      password,
    }: RegisterFormValues) =>
      registerStudent({
        dataofbirth: dateOfBirth.trim(),
        email: email.trim().toLowerCase(),
        firstname: firstName.trim(),
        gender,
        lastname: lastName.trim(),
        password,
      }),
    onError: (error) => {
      showToast(getUserFriendlyApiErrorMessage(error, "register"), {
        title: "Registration unsuccessful",
        tone: "error",
      });
    },
    onSuccess: (user) => {
      showToast(`Registered ${user.email}. Please sign in.`, {
        title: "Account created",
        tone: "success",
      });
    },
  });
}
