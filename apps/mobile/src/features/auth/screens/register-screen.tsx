import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  AppCheckbox,
  AppMessage,
  AppTextField,
} from "@/components/ui";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { createZodResolver, registerSchema } from "@/features/auth/schemas";
import type { RegisterFormValues } from "@/features/auth/types";
import { useAppTheme } from "@/theme";

const defaultValues: RegisterFormValues = {
  acceptsTerms: false,
  confirmPassword: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
};

export function RegisterScreen() {
  const theme = useAppTheme();
  const [notice, setNotice] = useState<string>();
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
    setNotice(undefined);
  }

  function submit() {
    setNotice(
      "Registration is not available in the API yet. Your form is ready for integration.",
    );
  }

  return (
    <AuthScreen
      description="Join a focused community built around credible research and academic discovery."
      footer={<AuthFooter />}
      title="Create Your Scholar Profile"
    >
      <View style={{ gap: theme.spacing.xxl }}>
        <View style={[styles.nameRow, { gap: theme.spacing.lg }]}>
          <View style={styles.nameField}>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <AppTextField
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  label="First Name"
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
                  label="Last Name"
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
              label="Institutional Email"
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
              placeholder="At least 8 characters"
              textContentType="newPassword"
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <AppTextField
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              label="Confirm Password"
              onBlur={field.onBlur}
              onChangeText={(confirmPassword) => {
                field.onChange(confirmPassword);
                resetFeedback();
              }}
              onSubmitEditing={() => {
                void handleSubmit(submit)();
              }}
              password
              placeholder="Repeat your password"
              returnKeyType="done"
              textContentType="newPassword"
              value={field.value}
            />
          )}
        />

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

        <AppMessage message={notice} />
        <AppButton
          label="Apply for Membership"
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
  nameField: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
  },
  signIn: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});
