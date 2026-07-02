import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useAppTheme } from "@/theme";

type AppTextFieldProps = Omit<TextInputProps, "style"> & {
  action?: ReactNode;
  error?: string;
  label: string;
  password?: boolean;
};

export function AppTextField({
  action,
  error,
  label,
  onBlur,
  onFocus,
  password = false,
  ...inputProps
}: AppTextFieldProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View style={styles.labelRow}>
        <Text
          style={[
            theme.typography.caption,
            {
              color: error
                ? theme.colors.error
                : focused
                  ? theme.colors.primary
                  : theme.colors.outline,
            },
          ]}
        >
          {label}
        </Text>
        {action}
      </View>

      <View
        style={[
          styles.inputRow,
          {
            borderBottomColor: error
              ? theme.colors.error
              : focused
                ? theme.colors.primary
                : theme.colors.outlineSoft,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.colors.outlineSoft}
          secureTextEntry={password && !passwordVisible}
          selectionColor={theme.colors.primary}
          style={[
            styles.input,
            theme.typography.body,
            { color: theme.colors.text },
          ]}
        />
        {password ? (
          <Pressable
            accessibilityLabel={
              passwordVisible ? "Hide password" : "Show password"
            }
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setPasswordVisible((visible) => !visible)}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              {passwordVisible ? "Hide" : "Show"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={[theme.typography.caption, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 6,
  },
  inputRow: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
