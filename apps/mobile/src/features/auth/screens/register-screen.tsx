import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  AppCheckbox,
  AppSegmentedControl,
  AppTextField,
} from "@/components/ui";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { useRegister } from "@/features/auth/hooks/use-register";
import { createZodResolver, registerSchema } from "@/features/auth/schemas";
import type { RegisterFormValues } from "@/features/auth/types";
import { useAppTheme } from "@/theme";
import { formatIsoDateInput } from "@/utils/date-input";

const defaultValues: RegisterFormValues = {
  acceptsTerms: false,
  confirmPassword: "",
  dateOfBirth: "",
  email: "",
  firstName: "",
  gender: "OTHER",
  lastName: "",
  password: "",
};

const genderOptions: { label: string; value: RegisterFormValues["gender"] }[] =
  [
    { label: "Female", value: "FEMALE" },
    { label: "Male", value: "MALE" },
    { label: "Other", value: "OTHER" },
  ];

export function RegisterScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const registerMutation = useRegister();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues,
    mode: "onBlur",
    resolver: createZodResolver(registerSchema),
  });

  function resetFeedback() {
    registerMutation.reset();
  }

  function submit(values: RegisterFormValues) {
    registerMutation.mutate(values, {
      onSuccess: () => {
        router.replace({
          params: {
            email: values.email.trim().toLowerCase(),
            registered: "1",
          },
          pathname: "/login",
        });
      },
    });
  }

  return (
    <AuthScreen
      description="Create your research profile and start following credible academic signals."
      footer={<AuthFooter />}
      title="Create Scholar Profile"
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View
          style={[
            styles.fieldRow,
            {
              flexDirection: "row",
              gap: theme.spacing.md,
            },
          ]}
        >
          <View style={styles.nameField}>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <AppTextField
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  label="First name"
                  onBlur={field.onBlur}
                  onChangeText={(firstName) => {
                    field.onChange(firstName);
                    resetFeedback();
                  }}
                  placeholder="Ada"
                  textContentType="givenName"
                  value={field.value}
                />
              )}
            />
          </View>
          <View style={styles.nameField}>
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <AppTextField
                  autoComplete="family-name"
                  error={errors.lastName?.message}
                  label="Last name"
                  onBlur={field.onBlur}
                  onChangeText={(lastName) => {
                    field.onChange(lastName);
                    resetFeedback();
                  }}
                  placeholder="Lovelace"
                  textContentType="familyName"
                  value={field.value}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <AppTextField
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
              keyboardType="email-address"
              label="Email"
              onBlur={field.onBlur}
              onChangeText={(email) => {
                field.onChange(email);
                resetFeedback();
              }}
              placeholder="scholar@university.edu"
              textContentType="emailAddress"
              value={field.value}
            />
          )}
        />

        <View
          style={[
            styles.fieldRow,
            {
              flexDirection: "row",
              gap: theme.spacing.sm,
            },
          ]}
        >
          <View style={styles.genderField}>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <AppSegmentedControl
                  compact
                  error={errors.gender?.message}
                  label="Gender"
                  onChange={(gender) => {
                    field.onChange(gender);
                    resetFeedback();
                  }}
                  options={genderOptions}
                  value={field.value}
                />
              )}
            />
          </View>

          <View style={styles.birthdayField}>
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <AppTextField
                  autoComplete="birthdate-full"
                  error={errors.dateOfBirth?.message}
                  keyboardType="number-pad"
                  label="Birthday"
                  maxLength={10}
                  onBlur={field.onBlur}
                  onChangeText={(dateOfBirth) => {
                    field.onChange(formatIsoDateInput(dateOfBirth));
                    resetFeedback();
                  }}
                  placeholder="YYYYMMDD"
                  textContentType="birthdate"
                  value={field.value}
                />
              )}
            />
          </View>
        </View>

        <View
          style={[
            styles.fieldRow,
            {
              flexDirection: "column",
              gap: theme.spacing.md,
            },
          ]}
        >
          <View style={styles.nameField}>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <AppTextField
                  autoComplete="new-password"
                  error={errors.password?.message}
                  label="Password"
                  onBlur={field.onBlur}
                  onChangeText={(password) => {
                    field.onChange(password);
                    resetFeedback();
                  }}
                  password
                  placeholder="8+ characters"
                  textContentType="newPassword"
                  value={field.value}
                />
              )}
            />
          </View>

          <View style={styles.nameField}>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <AppTextField
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  label="Confirm"
                  onBlur={field.onBlur}
                  onChangeText={(confirmPassword) => {
                    field.onChange(confirmPassword);
                    resetFeedback();
                  }}
                  onSubmitEditing={() => {
                    void handleSubmit(submit)();
                  }}
                  password
                  placeholder="Repeat password"
                  returnKeyType="done"
                  textContentType="newPassword"
                  value={field.value}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="acceptsTerms"
          render={({ field }) => (
            <AppCheckbox
              checked={field.value}
              error={errors.acceptsTerms?.message}
              label="I agree to the Privacy Policy and Academic Terms"
              onChange={(acceptsTerms) => {
                field.onChange(acceptsTerms);
                resetFeedback();
              }}
            />
          )}
        />

        <AppButton
          label="Apply for Membership"
          loading={registerMutation.isPending}
          onPress={() => {
            void handleSubmit(submit)();
          }}
        />

        <View style={[styles.signIn, { gap: theme.spacing.xs }]}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            Already a member?
          </Text>
          <Link href="/login" style={{ color: theme.colors.primary }}>
            <Text style={theme.typography.label}>Sign In</Text>
          </Link>
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  birthdayField: {
    flex: 1,
  },
  genderField: {
    flex: 1.4,
  },
  nameField: {
    flex: 1,
  },
  fieldRow: {
    width: "100%",
  },
  signIn: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});
