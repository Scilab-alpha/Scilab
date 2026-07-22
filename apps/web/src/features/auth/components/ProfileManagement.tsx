"use client";

import { useEffect } from "react";
import {
  useForm,
  type FieldErrors,
  type UseFormSetError,
} from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Check,
  Loader2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { getMyProfile, updateMyProfile } from "@/features/users/api/users.api";
import { USER_QUERY_KEYS } from "@/features/users/api/user-query-keys";
import type {
  UpdateUserProfileInput,
  UserProfile,
} from "@/features/users/types/user.types";
import { AuthApiError } from "@/features/auth/types/auth.types";
import { useAuth } from "@/providers/auth-provider";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/components/ui/utils";
import { ROLE_LABELS } from "@/shared/constants/permissions";

const profilePatchSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .optional(),
  firstName: z.string().trim().min(1, "First name is required.").optional(),
  lastName: z.string().trim().min(1, "Last name is required.").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z
    .string()
    .trim()
    .min(1, "Date of birth is required.")
    .refine(isValidDateOnly, "Enter a valid date of birth.")
    .optional(),
});

type ProfileFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
};

const editableFields = [
  "email",
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
] as const satisfies ReadonlyArray<keyof ProfileFormValues>;

export default function ProfileManagement() {
  const queryClient = useQueryClient();
  const { logout, refreshCurrentUser } = useAuth();
  const profileQuery = useQuery({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: getMyProfile,
  });
  const updateMutation = useMutation({ mutationFn: updateMyProfile });

  const {
    clearErrors,
    formState: { dirtyFields, errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ProfileFormValues>({
    defaultValues: emptyProfileForm,
    mode: "onBlur",
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset(toProfileForm(profileQuery.data));
    }
  }, [profileQuery.data, reset]);

  const isMissingProfile =
    profileQuery.error instanceof AuthApiError &&
    profileQuery.error.status === 404;

  useEffect(() => {
    if (isMissingProfile) {
      void logout();
    }
  }, [isMissingProfile, logout]);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    updateMutation.reset();

    const candidate = buildDirtyProfilePatch(values, dirtyFields);
    const parsed = profilePatchSchema.safeParse(candidate);

    if (!parsed.success) {
      applyZodErrors(parsed.error, setError);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (Object.keys(parsed.data).length === 0) return;

    try {
      const updatedProfile = await updateMutation.mutateAsync(parsed.data);
      queryClient.setQueryData(USER_QUERY_KEYS.me, updatedProfile);
      reset(toProfileForm(updatedProfile));
      toast.success("Profile updated successfully.");

      // The auth identity powers both shells, so refresh it after the full
      // profile cache has been updated. A shell refresh failure must not turn
      // an already successful profile PATCH into a failed save.
      void Promise.resolve(refreshCurrentUser()).catch(() => undefined);
    } catch (error) {
      applyApiErrors(error, setError);
      toast.error(getProfileErrorMessage(error));
    }
  });

  if (profileQuery.isPending) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ProfileErrorState
        isMissingProfile={isMissingProfile}
        isRetrying={profileQuery.isFetching}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;

  const handleCancel = () => {
    clearErrors();
    updateMutation.reset();
    reset(toProfileForm(profile));
  };

  return (
    <section
      aria-labelledby="profile-heading"
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      <Card className="relative overflow-hidden border border-border/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_52%)]"
        />
        <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar className="size-24 rounded-[var(--radius-card)] border-4 border-card shadow-ambient">
            {profile.imageUrl ? (
              <AvatarImage
                src={profile.imageUrl}
                alt={`${profile.displayName} profile picture`}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback
              delayMs={profile.imageUrl ? 250 : undefined}
              className="rounded-[var(--radius-card)] bg-primary text-2xl font-semibold text-primary-foreground"
            >
              {profile.initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Personal profile
            </p>
            <h1
              id="profile-heading"
              className="truncate font-heading text-3xl text-foreground"
            >
              {profile.displayName}
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="default">{ROLE_LABELS[profile.role]}</Badge>
              <StatusBadge status={profile.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {updateMutation.isError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Changes were not saved</AlertTitle>
          <AlertDescription>
            {getProfileErrorMessage(updateMutation.error)} Your entries are
            still here so you can review them and try again.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Basic information</CardTitle>
            <CardDescription>
              Keep the details associated with your Scilab account up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" noValidate onSubmit={onSubmit}>
              <FormField
                label="Email"
                error={errors.email}
                htmlFor="profile-email"
              >
                <Input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "profile-email-error" : undefined
                  }
                  {...register("email")}
                />
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="First name"
                  error={errors.firstName}
                  htmlFor="profile-first-name"
                >
                  <Input
                    id="profile-first-name"
                    type="text"
                    autoComplete="given-name"
                    aria-invalid={Boolean(errors.firstName)}
                    aria-describedby={
                      errors.firstName ? "profile-first-name-error" : undefined
                    }
                    {...register("firstName")}
                  />
                </FormField>

                <FormField
                  label="Last name"
                  error={errors.lastName}
                  htmlFor="profile-last-name"
                >
                  <Input
                    id="profile-last-name"
                    type="text"
                    autoComplete="family-name"
                    aria-invalid={Boolean(errors.lastName)}
                    aria-describedby={
                      errors.lastName ? "profile-last-name-error" : undefined
                    }
                    {...register("lastName")}
                  />
                </FormField>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Gender"
                  error={errors.gender}
                  htmlFor="profile-gender"
                >
                  <select
                    id="profile-gender"
                    aria-invalid={Boolean(errors.gender)}
                    aria-describedby={
                      errors.gender ? "profile-gender-error" : undefined
                    }
                    className="flex h-9 w-full rounded-[var(--radius-input)] border border-border bg-input-background px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                    {...register("gender")}
                  >
                    <option value="" disabled>
                      Not provided
                    </option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormField>

                <FormField
                  label="Date of birth"
                  error={errors.dateOfBirth}
                  htmlFor="profile-date-of-birth"
                >
                  <Input
                    id="profile-date-of-birth"
                    type="date"
                    autoComplete="bday"
                    aria-invalid={Boolean(errors.dateOfBirth)}
                    aria-describedby={
                      errors.dateOfBirth
                        ? "profile-date-of-birth-error"
                        : undefined
                    }
                    {...register("dateOfBirth")}
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  disabled={!isDirty || updateMutation.isPending}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  disabled={!isDirty || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                  {updateMutation.isPending
                    ? "Saving changes..."
                    : "Save changes"}
                </Button>
              </div>

              <p className="sr-only" aria-live="polite">
                {updateMutation.isPending
                  ? "Saving profile changes."
                  : updateMutation.isSuccess
                    ? "Profile changes saved."
                    : ""}
              </p>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/70 lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Account summary</CardTitle>
            <CardDescription>
              These values reflect your current account access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryItem
              icon={<Mail aria-hidden="true" />}
              label="Email"
              value={profile.email}
            />
            <SummaryItem
              icon={<ShieldCheck aria-hidden="true" />}
              label="Role"
              value={ROLE_LABELS[profile.role]}
            />
            <SummaryItem
              icon={<Activity aria-hidden="true" />}
              label="Status"
              value={formatLabel(profile.status)}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function FormField({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: FieldErrors<ProfileFormValues>[keyof ProfileFormValues];
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error?.message ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-sm text-destructive"
        >
          {String(error.message)}
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: UserProfile["status"] }) {
  const variant =
    status === "active"
      ? "teal"
      : status === "banned"
        ? "destructive"
        : "secondary";

  return (
    <Badge variant={variant}>
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full bg-current",
          status === "inactive" && "opacity-70",
        )}
      />
      {formatLabel(status)}
    </Badge>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-card)] bg-surface-raised p-3">
      <span className="mt-0.5 text-primary [&>svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your profile"
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      <span className="sr-only">Loading your profile...</span>
      <Card className="border border-border/70 p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <Skeleton className="size-24 shrink-0 rounded-[var(--radius-card)] motion-reduce:animate-none" />
          <div className="w-full max-w-sm space-y-3">
            <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
            <Skeleton className="h-8 w-3/4 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-full motion-reduce:animate-none" />
          </div>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="border border-border/70 p-6">
          <Skeleton className="mb-6 h-7 w-48 motion-reduce:animate-none" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn("space-y-2", index === 0 && "sm:col-span-2")}
              >
                <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
                <Skeleton className="h-9 w-full motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="border border-border/70 p-6">
          <Skeleton className="mb-5 h-7 w-40 motion-reduce:animate-none" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 w-full motion-reduce:animate-none"
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProfileErrorState({
  isMissingProfile,
  isRetrying,
  onRetry,
}: {
  isMissingProfile: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Card className="mx-auto w-full max-w-xl border border-border/70">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          {isMissingProfile ? (
            <UserRound aria-hidden="true" />
          ) : (
            <AlertCircle aria-hidden="true" />
          )}
        </span>
        <h1 className="font-heading text-2xl text-foreground">
          {isMissingProfile
            ? "This profile is no longer available"
            : "We could not load your profile"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {isMissingProfile
            ? "Your session is ending so you can sign in with an active account."
            : "Check your connection and try again. Your account has not been changed."}
        </p>
        {!isMissingProfile ? (
          <Button
            type="button"
            variant="outline"
            className="mt-6 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            disabled={isRetrying}
            onClick={onRetry}
          >
            {isRetrying ? (
              <Loader2
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            {isRetrying ? "Trying again..." : "Try again"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function buildDirtyProfilePatch(
  values: ProfileFormValues,
  dirtyFields: Partial<Record<keyof ProfileFormValues, boolean>>,
): UpdateUserProfileInput {
  return editableFields.reduce<UpdateUserProfileInput>((patch, field) => {
    if (dirtyFields[field]) {
      Object.assign(patch, { [field]: values[field] });
    }
    return patch;
  }, {});
}

function applyZodErrors(
  error: z.ZodError,
  setError: UseFormSetError<ProfileFormValues>,
) {
  error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (typeof field === "string" && editableFields.includes(field as never)) {
      setError(field as keyof ProfileFormValues, { message: issue.message });
    }
  });
}

function applyApiErrors(
  error: unknown,
  setError: UseFormSetError<ProfileFormValues>,
) {
  if (!(error instanceof AuthApiError)) return;

  if (error.status === 409) {
    setError("email", { message: "This email is already in use." });
  }

  const fieldAliases: Record<string, keyof ProfileFormValues> = {
    email: "email",
    firstname: "firstName",
    firstName: "firstName",
    lastname: "lastName",
    lastName: "lastName",
    gender: "gender",
    dateofbirth: "dateOfBirth",
    dataofbirth: "dateOfBirth",
    dateOfBirth: "dateOfBirth",
  };

  Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
    const formField = fieldAliases[field];
    if (formField && message) setError(formField, { message });
  });
}

function getProfileErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) return error.message;
  return "We could not save your profile. Please try again.";
}

function toProfileForm(profile: UserProfile): ProfileFormValues {
  return {
    email: profile.email,
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    gender: profile.gender ?? "",
    dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? "",
  };
}

function formatLabel(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`;
}

function isValidDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const emptyProfileForm: ProfileFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
};
