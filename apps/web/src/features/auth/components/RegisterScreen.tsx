"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertCircle,
  Atom,
  BarChart3,
  Check,
  FlaskConical,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { registerAccount } from "@/features/auth/api/register.api";
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
import { routes } from "@/shared/constants/routes";
import { useAuth } from "@/providers/auth-provider";
import {
  type RegisterFormValues,
  validateRegisterForm,
} from "@/shared/schemas/register.schema";

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

const defaultValues: RegisterFormValues = {
  email: "",
  displayName: "",
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
  const { registerSession } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const {
    formState: { errors, isSubmitting },
    clearErrors,
    handleSubmit,
    register,
    setError,
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
    setStatusMessage("Creating your ScholarTrend account.");

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
      await registerAccount(values);
      registerSession({
        email: values.email,
        displayName: values.displayName,
      });
      setStatusMessage("Account created. Opening your dashboard.");
      toast.success("ScholarTrend account created.");

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

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    setGlobalError("");
    setStatusMessage("Google registration is waiting for backend support.");

    await new Promise((resolve) => setTimeout(resolve, 500));

    const message =
      "Google registration is pending backend integration. Please create an account with email for now.";
    setGlobalError(message);
    setStatusMessage(message);
    toast.info("Google registration is pending backend integration.");
    setIsGoogleLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left — editorial hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-raised border-r border-border">
        <div className="flex flex-col justify-between py-12 px-16 xl:px-24 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-[var(--radius-card)] flex items-center justify-center">
              <Atom className="w-6 h-6 text-primary-foreground" strokeWidth={1.75} />
            </div>
            <span className="font-heading text-2xl text-foreground">ScholarTrend</span>
          </div>

          <div className="space-y-8 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-input)] bg-accent px-4 py-2 text-sm text-accent-foreground">
              <FlaskConical className="h-4 w-4" strokeWidth={1.75} />
              Metadata and trend tracking
            </span>

            <h1 className="font-heading text-5xl xl:text-6xl text-foreground leading-tight">
              Create your research workspace
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Follow journals, bookmark publication metadata, and compare topic
              trends from one ScholarTrend account.
            </p>

            <div className="space-y-6 pt-4">
              {[
                {
                  title: "Trend analysis",
                  desc: "Compare publication patterns by keyword, topic, and year.",
                },
                {
                  title: "Saved discovery",
                  desc: "Keep useful journals and articles close for dashboard review.",
                },
              ].map((item, i) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[var(--radius-card)] bg-accent flex items-center justify-center flex-shrink-0">
                    {i === 0 ? (
                      <BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    ) : (
                      <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
            {["Journal search", "Article bookmarks", "Role-aware access"].map((label) => (
              <div key={label} className="text-sm text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — registration form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-[560px]">
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex items-center gap-3 lg:hidden">
              <div className="w-10 h-10 bg-primary rounded-[var(--radius-card)] flex items-center justify-center">
                <Atom className="w-5 h-5 text-primary-foreground" strokeWidth={1.75} />
              </div>
              <span className="font-heading text-2xl text-foreground">ScholarTrend</span>
            </div>

            <h2 className="font-heading text-4xl text-foreground">Create your account</h2>
            <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
              Start tracking publication metadata and research trends.
            </p>
          </div>

          <Card>
            <CardHeader className="border-b border-border/60 pb-8 pt-8 px-8">
              {globalError ? (
                <Alert variant="destructive" className="mb-5" aria-live="polite">
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
                    className="h-11"
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
                    <p id="email-error" className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-4 w-4" strokeWidth={1.75} />
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    className="h-11"
                    aria-invalid={!!errors.displayName}
                    aria-describedby={errors.displayName ? "displayName-error" : undefined}
                    disabled={isBusy}
                    {...register("displayName", {
                      onChange: () => {
                        clearErrors("displayName");
                        setGlobalError("");
                      },
                    })}
                  />
                  {errors.displayName ? (
                    <p id="displayName-error" className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-4 w-4" strokeWidth={1.75} />
                      {errors.displayName.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className="h-11"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : "password-status"}
                    disabled={isBusy}
                    {...register("password", {
                      onChange: () => {
                        clearErrors("password");
                        setGlobalError("");
                      },
                    })}
                  />
                  {errors.password ? (
                    <p id="password-error" className="flex items-center gap-1 text-sm text-destructive">
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
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              index < passwordStrength
                                ? strengthColor[passwordStrength - 1]
                                : "bg-surface-raised"
                            }`}
                          />
                        ))}
                      </div>
                      <p id="password-status" className="flex items-center gap-1 text-sm text-muted-foreground">
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
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className="h-11"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword ? "confirmPassword-error" : "confirmPassword-status"
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
                    <p id="confirmPassword-error" className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-4 w-4" strokeWidth={1.75} />
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                  {confirmPassword && !errors.confirmPassword && password === confirmPassword ? (
                    <p id="confirmPassword-status" className="flex items-center gap-1 text-sm text-teal">
                      <Check className="h-4 w-4" strokeWidth={1.75} />
                      Passwords match.
                    </p>
                  ) : null}
                </div>

                <div aria-live="polite" className="sr-only">
                  {statusMessage}
                </div>

                <Button type="submit" className="h-11 w-full" disabled={isBusy}>
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
                  <span className="px-4 bg-card text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
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
                  className="text-tag hover:underline font-medium"
                  disabled={isBusy}
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By creating an account, you agree to ScholarTrend access policies for
            research metadata and dashboard features.
          </p>
        </div>
      </div>
    </div>
  );
}
