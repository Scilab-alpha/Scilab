import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

export function DetailSection({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon?: ComponentProps<typeof Ionicons>["name"];
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.section, { gap: theme.spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionRule,
            { backgroundColor: theme.colors.primary },
          ]}
        />
        {icon ? (
          <Ionicons color={theme.colors.primary} name={icon} size={17} />
        ) : null}
        <Text
          selectable
          style={[theme.typography.heading, { color: theme.colors.text }]}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[styles.infoRow, { borderBottomColor: theme.colors.outlineSoft }]}
    >
      <Text
        numberOfLines={1}
        style={[theme.typography.caption, { color: theme.colors.textMuted }]}
      >
        {label}
      </Text>
      <Text
        selectable
        style={[theme.typography.body, { color: theme.colors.text }]}
      >
        {value?.trim() || "Unavailable"}
      </Text>
    </View>
  );
}

export function StatusBadge({
  label,
  tone = "primary",
}: {
  label: string;
  tone?: "primary" | "success";
}) {
  const theme = useAppTheme();
  const color =
    tone === "success" ? theme.colors.success : theme.colors.primary;
  const backgroundColor =
    tone === "success" ? theme.colors.successSoft : theme.colors.primarySoft;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        selectable
        style={[theme.typography.caption, { color }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    borderBottomWidth: 1,
    gap: 5,
    padding: 12,
  },
  section: {
    paddingVertical: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  sectionRule: {
    height: 1,
    width: 22,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
