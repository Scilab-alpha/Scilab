import * as Haptics from "expo-haptics";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useAppTheme } from "@/theme";

type ToastTone = "error" | "info" | "success";

type ShowToastOptions = {
  title?: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, options?: ShowToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (message: string, options: ShowToastOptions = {}) => {
      const tone = options.tone ?? "info";

      if (tone !== "info" && process.env.EXPO_OS !== "web") {
        void Haptics.notificationAsync(
          tone === "success"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error,
        ).catch(() => undefined);
      }

      Toast.show({
        position: "top",
        text1: options.title ?? toastTitles[tone],
        text2: message,
        topOffset: insets.top + theme.spacing.md,
        type: tone,
        visibilityTime: tone === "error" ? 4400 : 3200,
      });
    },
    [insets.top, theme.spacing.md],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);
  const toastConfig = useMemo(
    () => ({
      error: ({ text1, text2 }: ToastContent) => (
        <ToastCard message={text2} title={text1} tone="error" />
      ),
      info: ({ text1, text2 }: ToastContent) => (
        <ToastCard message={text2} title={text1} tone="info" />
      ),
      success: ({ text1, text2 }: ToastContent) => (
        <ToastCard message={text2} title={text1} tone="success" />
      ),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.host}>
        {children}
        <Toast config={toastConfig} />
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}

type ToastContent = {
  text1?: string;
  text2?: string;
};

const toastTitles: Record<ToastTone, string> = {
  error: "Unable to continue",
  info: "Notice",
  success: "Success",
};

const toastGlyphs: Record<ToastTone, string> = {
  error: "!",
  info: "i",
  success: "✓",
};

function ToastCard({
  message,
  title,
  tone,
}: {
  message?: string;
  title?: string;
  tone: ToastTone;
}) {
  const theme = useAppTheme();
  const color =
    tone === "error"
      ? theme.colors.error
      : tone === "success"
        ? theme.colors.success
        : theme.colors.primary;
  const softColor =
    tone === "error"
      ? theme.colors.errorSoft
      : tone === "success"
        ? theme.colors.successSoft
        : theme.colors.primarySoft;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderLeftColor: color,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: softColor,
            borderRadius: theme.radii.pill,
          },
        ]}
      >
        <Text style={[styles.iconText, { color }]}>{toastGlyphs[tone]}</Text>
      </View>

      <View style={styles.copy}>
        <Text
          numberOfLines={1}
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {title ?? toastTitles[tone]}
        </Text>
        <Text
          numberOfLines={3}
          selectable
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          {message}
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Dismiss notification"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => Toast.hide()}
        style={({ pressed }) => [
          styles.close,
          {
            backgroundColor: pressed
              ? theme.colors.surfaceMuted
              : "transparent",
            borderRadius: theme.radii.pill,
          },
        ]}
      >
        <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>
          ×
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  toast: {
    alignItems: "center",
    borderCurve: "continuous",
    borderLeftWidth: 4,
    borderWidth: 1,
    boxShadow: "0 8px 24px rgba(43, 24, 18, 0.14)",
    flexDirection: "row",
    gap: 12,
    maxWidth: 400,
    minHeight: 72,
    padding: 12,
    width: "92%",
  },
  icon: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  iconText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  close: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  closeText: {
    fontSize: 20,
    fontWeight: "400",
    lineHeight: 22,
  },
});
