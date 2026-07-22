import { Link, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { AppButton, AppCheckbox, AppTextField } from "@/components/ui";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { AuthScreen } from "@/features/auth/components/auth-screen";
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
  const params = useLocalSearchParams<{
    email?: string;
    registered?: string;
  }>();
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormValues>({
    defaultValues,
    mode: "onBlur",
    resolver: createZodResolver(loginSchema),
  });

  useEffect(() => {
    if (params.registered !== "1") {
      return;
    }

    if (typeof params.email === "string") {
      setValue("email", params.email, { shouldValidate: true });
    }
  }, [params.email, params.registered, setValue]);

  function resetFeedback() {
    loginMutation.reset();
  }

  function submit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <AuthScreen
      description="Access your curated research trends and bibliographic datasets."
      footer={<AuthFooter />}
      scrollEnabled={false}
      title="Welcome Back, Scholar"
    >
      <View style={{ gap: theme.spacing.xxl }}>
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
                label="Keep me logged in"
                onChange={(rememberMe) => {
                  field.onChange(rememberMe);
                  resetFeedback();
                }}
              />
            )}
          />

          <AppButton
            label="Sign In"
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
