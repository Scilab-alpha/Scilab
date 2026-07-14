import type {
  RegisterFieldErrors,
  RegisterRequest,
} from "@/features/auth/types/register.types";

export type RegisterFormValues = RegisterRequest;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterForm(
  values: RegisterFormValues,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!firstName) {
    errors.firstName = "First name is required.";
  } else if (firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  }

  if (!lastName) {
    errors.lastName = "Last name is required.";
  } else if (lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  }

  if (!values.gender) {
    errors.gender = "Select a gender option.";
  }

  if (!values.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required.";
  } else if (Number.isNaN(new Date(values.dateOfBirth).getTime())) {
    errors.dateOfBirth = "Enter a valid date of birth.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password)) {
    errors.password = "Use uppercase and lowercase letters.";
  } else if (!/\d/.test(values.password)) {
    errors.password = "Use at least one number.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
