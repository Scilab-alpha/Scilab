import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid institutional email."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean(),
});
