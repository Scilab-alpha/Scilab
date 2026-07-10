import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

export function ScreenShell({
  children,
  eyebrow,
  showHeader = true,
  subtitle,
  title,
}: PropsWithChildren<{
  eyebrow?: string;
  showHeader?: boolean;
  subtitle: string;
  title: string;
}>) {
  const theme = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { gap: theme.spacing.xl, padding: theme.spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.colors.background }}
    >
      {showHeader ? (
        <View style={{ gap: theme.spacing.xs }}>
          {eyebrow ? (
            <Text
              selectable
              style={[styles.eyebrow, { color: theme.colors.primary }]}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            selectable
            style={[theme.typography.display, { color: theme.colors.text }]}
          >
            {title}
          </Text>
          <Text
            selectable
            style={[theme.typography.body, { color: theme.colors.textMuted }]}
          >
            {subtitle}
          </Text>
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

export function SurfaceCard({ children }: PropsWithChildren) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.lg,
          gap: theme.spacing.md,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeading({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.sectionHeading}>
      <Text
        selectable
        style={[theme.typography.heading, { color: theme.colors.text }]}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  card: { borderWidth: 1, padding: 16 },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
