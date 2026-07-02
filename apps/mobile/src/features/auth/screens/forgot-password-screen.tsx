import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { AppButton, AppMessage, AppTextField } from "@/components/ui";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import {
  createZodResolver,
  forgotPasswordSchema,
} from "@/features/auth/schemas";
import type { ForgotPasswordFormValues } from "@/features/auth/types";
import { useAppTheme } from "@/theme";

const defaultValues: ForgotPasswordFormValues = {
  email: "",
};

export function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const [notice, setNotice] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues,
    mode: "onBlur",
    resolver: createZodResolver(forgotPasswordSchema),
  });

  function submit() {
    setNotice(
      "Password recovery is temporarily unavailable. Please try again later.",
    );
  }

  return (
    <AuthScreen
      description="Enter your institutional email and we'll help you return to your research workspace."
      footer={<AuthFooter />}
      title="Recover Your Account"
    >
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
                setNotice(undefined);
              }}
              onSubmitEditing={() => {
                void handleSubmit(submit)();
              }}
              placeholder="scholar@university.edu"
              returnKeyType="send"
              textContentType="emailAddress"
              value={field.value}
            />
          )}
        />

        <AppMessage message={notice} />
        <AppButton
          label="Send Recovery Instructions"
          onPress={() => {
            void handleSubmit(submit)();
          }}
        />

        <View style={[styles.back, { gap: theme.spacing.xs }]}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            Remembered your password?
          </Text>
          <Link href="/login" style={{ color: theme.colors.primary }}>
            <Text style={theme.typography.label}>Back to Sign In</Text>
          </Link>
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
