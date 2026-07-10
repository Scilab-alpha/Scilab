import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const profileSchema = createProfileSchema();

export function createProfileSchema({
  canClearDateOfBirth = true,
  canClearGender = true,
}: {
  canClearDateOfBirth?: boolean;
  canClearGender?: boolean;
} = {}) {
  return z.object({
    dateOfBirth: z
      .string()
      .trim()
      .refine(
        (value) => canClearDateOfBirth || value !== "",
        "Date of birth can't be removed yet",
      )
      .refine(
        (value) => value === "" || datePattern.test(value),
        "Use the YYYY-MM-DD format",
      )
      .refine(
        (value) => value === "" || isValidPastDate(value),
        "Enter a valid date in the past",
      ),
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(255, "First name is too long"),
    gender: z
      .union([z.enum(["FEMALE", "MALE", "OTHER"]), z.literal("")])
      .refine(
        (value) => canClearGender || value !== "",
        "Gender can't be removed yet",
      ),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(255, "Last name is too long"),
  });
}

function isValidPastDate(value: string) {
  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();

  return (
    year >= 1900 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() < today.getTime()
  );
}
