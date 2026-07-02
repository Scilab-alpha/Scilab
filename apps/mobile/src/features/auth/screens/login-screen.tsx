import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  AppCheckbox,
  AppDivider,
  AppMessage,
  AppTextField,
} from "@/components/ui";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { useLogin } from "@/features/auth/hooks/use-login";
import { createZodResolver, loginSchema } from "@/features/auth/schemas";
import type { LoginFormValues } from "@/features/auth/types";
import { useAppTheme } from "@/theme";

const defaultValues: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

export function LoginScreen() {
  const theme = useAppTheme();
  const loginMutation = useLogin();
  const [notice, setNotice] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues,
    mode: "onBlur",
    resolver: createZodResolver(loginSchema),
  });

  function resetFeedback() {
    loginMutation.reset();
    setNotice(undefined);
  }

  function submit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  const mutationMessage = loginMutation.isError
    ? loginMutation.error.message
    : loginMutation.isSuccess
      ? "Signed in successfully. Your research workspace is ready."
      : undefined;

  return (
    <AuthScreen
      description="Access your curated research trends and bibliographic datasets."
      footer={<AuthFooter />}
      title="Welcome Back, Scholar"
    >
      <View style={{ gap: theme.spacing.xxl }}>
        <SocialLoginButtons
          onUnavailable={(provider) => {
            loginMutation.reset();
            setNotice(`${provider} sign-in is not connected yet.`);
          }}
        />

        <AppDivider label="or login with email" />

        <View style={{ gap: theme.spacing.xxl }}>
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
                onSubmitEditing={() => {
                  void handleSubmit(submit)();
                }}
                placeholder="scholar@university.edu"
                returnKeyType="next"
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
                action={
                  <Link href="/forgot-password" asChild>
                    <Pressable hitSlop={8}>
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Forgot?
                      </Text>
                    </Pressable>
                  </Link>
                }
                autoComplete="current-password"
                error={errors.password?.message}
                label="Password"
                onBlur={field.onBlur}
                onChangeText={(password) => {
                  field.onChange(password);
                  resetFeedback();
                }}
                onSubmitEditing={() => {
                  void handleSubmit(submit)();
                }}
                password
                placeholder="Enter your password"
                returnKeyType="done"
                textContentType="password"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="rememberMe"
            render={({ field }) => (
              <AppCheckbox
                checked={field.value}
                label="Keep me logged in for 30 days"
                onChange={(rememberMe) => {
                  field.onChange(rememberMe);
                  resetFeedback();
                }}
              />
            )}
          />

          <AppMessage
            message={mutationMessage ?? notice}
            tone={
              loginMutation.isError
                ? "error"
                : loginMutation.isSuccess
                  ? "success"
                  : "info"
            }
          />

          <AppButton
            label="Sign In to Dashboard"
            loading={loginMutation.isPending}
            onPress={() => {
              void handleSubmit(submit)();
            }}
          />
        </View>

        <View style={[styles.membership, { gap: theme.spacing.xs }]}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            New to the collective?
          </Text>
          <Link href="/register" style={{ color: theme.colors.primary }}>
            <Text style={theme.typography.label}>Apply for Membership</Text>
          </Link>
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  membership: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
