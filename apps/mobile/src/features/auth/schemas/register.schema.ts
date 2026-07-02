import { z } from "zod";

export const genderValues = ["MALE", "FEMALE", "OTHER"] as const;

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const registerSchema = z
  .object({
    acceptsTerms: z.boolean().refine((accepted) => accepted, {
      message: "Please accept the academic terms.",
    }),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, "Date of birth is required.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
      .refine(isValidIsoDate, {
        message: "Enter a valid date.",
      }),
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Enter a valid institutional email."),
    firstName: z.string().trim().min(1, "First name is required."),
    gender: z.enum(genderValues, {
      message: "Select a gender.",
    }),
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
