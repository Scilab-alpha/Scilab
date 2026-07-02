import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/brand-mark";
import { useAppTheme } from "@/theme";

type AuthScreenProps = PropsWithChildren<{
  description: string;
  footer?: ReactNode;
  title: string;
}>;

export function AuthScreen({
  children,
  description,
  footer,
  title,
}: AuthScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: theme.spacing.xxxl,
              paddingTop: Math.max(insets.top + 18, theme.spacing.xxxl),
            },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        >
          <Animated.View
            entering={FadeInDown.duration(240)}
            style={[styles.content, { gap: theme.spacing.xxxl }]}
          >
            <View style={[styles.brand, { gap: theme.spacing.sm }]}>
              <BrandMark colors={theme.colors} />
              <Text
                selectable
                style={[
                  theme.typography.display,
                  { color: theme.colors.primary },
                ]}
              >
                ScholarTrend
              </Text>
            </View>

            <View style={{ gap: theme.spacing.sm }}>
              <Text
                selectable
                style={[theme.typography.heading, { color: theme.colors.text }]}
              >
                {title}
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.textMuted },
                ]}
              >
                {description}
              </Text>
            </View>

            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: Math.max(insets.bottom, theme.spacing.md),
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: 480,
    width: "100%",
  },
  flex: {
    flex: 1,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
});
