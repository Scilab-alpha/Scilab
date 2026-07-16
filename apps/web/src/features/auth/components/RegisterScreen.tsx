"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertCircle,
  BarChart3,
  Check,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AuthShell from "@/features/auth/components/AuthShell";
import PasswordInput from "@/features/auth/components/PasswordInput";
import {
  getAuthErrorMessage,
  getAuthFieldErrors,
} from "@/features/auth/api/auth-errors";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { routes } from "@/shared/constants/routes";
import { useAuth } from "@/providers/auth-provider";
import {
  type RegisterFormValues,
  validateRegisterForm,
} from "@/shared/schemas/register.schema";
import { APP_NAME } from "@/shared/constants/app";

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

const defaultValues: RegisterFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  gender: "OTHER",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
};

const strengthText = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const strengthColor = [
  "bg-destructive/60",
  "bg-destructive/40",
  "bg-primary/50",
  "bg-teal/60",
  "bg-teal",
];

const REGISTER_FEATURES = [
  {
    icon: BarChart3,
    title: "Trend analysis",
    description: "Compare publication patterns by keyword, topic, and year.",
  },
  {
    icon: Sparkles,
    title: "Saved discovery",
    description:
      "Keep useful journals and articles close for dashboard review.",
  },
] as const;

const REGISTER_CAPABILITIES = [
  "Journal search",
  "Article bookmarks",
  "Role-aware access",
] as const;

function calculatePasswordStrength(password: string) {
  return [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z\d]/.test(password),
  ].filter(Boolean).length;
}

export default function RegisterScreen({
  onNavigateToLogin,
  onRegisterSuccess,
}: RegisterScreenProps) {
  const router = useRouter();
  const { register: registerWithAuth } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const {
    formState: { errors, isSubmitting },
    clearErrors,
    handleSubmit,
    register,
    setError,
    setValue,
    control,
  } = useForm<RegisterFormValues>({ defaultValues, mode: "onBlur" });

  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";
  const passwordStrength = calculatePasswordStrength(password);
  const isBusy = isSubmitting || isGoogleLoading;
  const passwordStatus =
    password && !errors.password
      ? `Password strength: ${strengthText[passwordStrength - 1] ?? "Very weak"}`
      : "";

  const navigateToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
      return;
    }

    router.push(routes.auth.login);
  };

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    setGlobalError("");
    setStatusMessage(`Creating your ${APP_NAME} account.`);

    const validationErrors = validateRegisterForm(values);
    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field as keyof RegisterFormValues, { message });
      });
      setStatusMessage("Please fix the highlighted fields.");
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      await registerWithAuth(values);
      setStatusMessage("Account created. Opening your dashboard.");
      toast.success(`${APP_NAME} account created.`);

      if (onRegisterSuccess) {
        onRegisterSuccess();
      } else {
        router.push(routes.student.dashboard);
      }
    } catch (error) {
      const fieldErrors = getAuthFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof RegisterFormValues, { message });
      });

      const message = getAuthErrorMessage(error);
      setGlobalError(message);
      setStatusMessage(message);
      toast.error(message);
    }
  });

  const handleGoogleRegister = () => {
    setIsGoogleLoading(true);
    setGlobalError("");
    setStatusMessage("Google registration is waiting for backend support.");

    const message =
      "Google registration is not available yet. Please create an account with email for now.";
    setGlobalError(message);
    setStatusMessage(message);
    toast.info("Google registration is not available yet.");
    setIsGoogleLoading(false);
  };

  return (
    <AuthShell
      eyebrow="Metadata and trend tracking"
      heroTitle="Create your research workspace"
      heroDescription={`Follow journals, bookmark publication metadata, and compare topic trends from one ${APP_NAME} account.`}
      features={REGISTER_FEATURES}
      footerItems={REGISTER_CAPABILITIES}
      formTitle="Create your account"
      formDescription="Start tracking publication metadata and research trends."
      formWidth="register"
    >
      <Card>
        <CardHeader className="border-b border-border/60 pb-8 pt-8 px-8">
          {globalError ? (
            <Alert
              variant="destructive"
              className="auth-feedback-enter mb-5"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
              <AlertTitle>Registration issue</AlertTitle>
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@university.edu"
                className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                disabled={isBusy}
                {...register("email", {
                  onChange: () => {
                    clearErrors("email");
                    setGlobalError("");
                  },
                })}
              />
              {errors.email ? (
                <p
                  id="email-error"
                  className="flex items-center gap-1 text-sm text-destructive"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={
                    errors.firstName ? "firstName-error" : undefined
                  }
                  disabled={isBusy}
                  {...register("firstName", {
                    onChange: () => {
                      clearErrors("firstName");
                      setGlobalError("");
                    },
                  })}
                />
                {errors.firstName ? (
                  <p
                    id="firstName-error"
                    className="flex items-center gap-1 text-sm text-destructive"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                    {errors.firstName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Smith"
                  className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={
                    errors.lastName ? "lastName-error" : undefined
                  }
                  disabled={isBusy}
                  {...register("lastName", {
                    onChange: () => {
                      clearErrors("lastName");
                      setGlobalError("");
                    },
                  })}
                />
                {errors.lastName ? (
                  <p
                    id="lastName-error"
                    className="flex items-center gap-1 text-sm text-destructive"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                    {errors.lastName.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  defaultValue={defaultValues.gender}
                  disabled={isBusy}
                  onValueChange={(value) => {
                    setValue("gender", value as RegisterFormValues["gender"], {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    clearErrors("gender");
                    setGlobalError("");
                  }}
                >
                  <SelectTrigger
                    id="gender"
                    className="h-11 bg-input-background/80 hover:border-primary/25 focus:bg-card"
                    aria-invalid={!!errors.gender}
                    aria-describedby={
                      errors.gender ? "gender-error" : undefined
                    }
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" {...register("gender")} />
                {errors.gender ? (
                  <p
                    id="gender-error"
                    className="flex items-center gap-1 text-sm text-destructive"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                    {errors.gender.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  autoComplete="bday"
                  className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                  aria-invalid={!!errors.dateOfBirth}
                  aria-describedby={
                    errors.dateOfBirth ? "dateOfBirth-error" : undefined
                  }
                  disabled={isBusy}
                  {...register("dateOfBirth", {
                    onChange: () => {
                      clearErrors("dateOfBirth");
                      setGlobalError("");
                    },
                  })}
                />
                {errors.dateOfBirth ? (
                  <p
                    id="dateOfBirth-error"
                    className="flex items-center gap-1 text-sm text-destructive"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                    {errors.dateOfBirth.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : "password-status"
                }
                disabled={isBusy}
                {...register("password", {
                  onChange: () => {
                    clearErrors("password");
                    setGlobalError("");
                  },
                })}
              />
              {errors.password ? (
                <p
                  id="password-error"
                  className="flex items-center gap-1 text-sm text-destructive"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                  {errors.password.message}
                </p>
              ) : null}

              {password && !errors.password ? (
                <div className="space-y-2">
                  <div className="flex gap-1" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                          index < passwordStrength
                            ? strengthColor[passwordStrength - 1]
                            : "bg-surface-raised"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    id="password-status"
                    className="auth-feedback-enter flex items-center gap-1 text-sm text-muted-foreground"
                  >
                    {passwordStrength >= 4 ? (
                      <Check className="h-4 w-4 text-teal" strokeWidth={1.75} />
                    ) : null}
                    {passwordStatus}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="h-11 bg-input-background/80 hover:border-primary/25 focus-visible:bg-card"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword
                    ? "confirmPassword-error"
                    : "confirmPassword-status"
                }
                disabled={isBusy}
                {...register("confirmPassword", {
                  onChange: () => {
                    clearErrors("confirmPassword");
                    setGlobalError("");
                  },
                })}
              />
              {errors.confirmPassword ? (
                <p
                  id="confirmPassword-error"
                  className="flex items-center gap-1 text-sm text-destructive"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                  {errors.confirmPassword.message}
                </p>
              ) : null}
              {confirmPassword &&
              !errors.confirmPassword &&
              password === confirmPassword ? (
                <p
                  id="confirmPassword-status"
                  className="auth-feedback-enter flex items-center gap-1 text-sm text-teal"
                >
                  <Check className="h-4 w-4" strokeWidth={1.75} />
                  Passwords match.
                </p>
              ) : null}
            </div>

            <div aria-live="polite" className="sr-only">
              {statusMessage}
            </div>

            <Button
              type="submit"
              className="auth-clickable h-11 w-full"
              disabled={isBusy}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardHeader>

        <CardContent className="px-8 pt-6 pb-8 space-y-5">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="auth-clickable h-11 w-full"
            onClick={handleGoogleRegister}
            disabled={isBusy}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={navigateToLogin}
              className="auth-link disabled:pointer-events-none disabled:opacity-50"
              disabled={isBusy}
            >
              Sign in
            </button>
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        By creating an account, you agree to {APP_NAME} access policies for
        research metadata and dashboard features.
      </p>
    </AuthShell>
  );
}
