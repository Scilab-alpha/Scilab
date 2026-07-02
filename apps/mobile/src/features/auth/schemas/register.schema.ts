import { z } from "zod";

export const registerSchema = z
  .object({
    acceptsTerms: z.boolean().refine((accepted) => accepted, {
      message: "Please accept the academic terms.",
    }),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Enter a valid institutional email."),
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Use at least 8 characters."),
  })
  .refine((values) => values.confirmPassword === values.password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
