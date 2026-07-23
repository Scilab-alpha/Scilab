import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useAppTheme } from "@/theme";

export function DashboardSectionCard({
  backgroundColor,
  children,
  href,
}: {
  backgroundColor: string;
  children: ReactNode;
  href?: Href;
}) {
  const theme = useAppTheme();
  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: theme.colors.outlineSoft,
        },
      ]}
    >
      {children}
    </View>
  );

  if (!href) {
    return content;
  }

  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
      >
        {content}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    borderWidth: 1,
    boxShadow: "0 1px 3px rgba(43, 24, 18, 0.06)",
    padding: 18,
  },
});
