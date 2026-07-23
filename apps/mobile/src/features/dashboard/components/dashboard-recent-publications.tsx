import Ionicons from "@expo/vector-icons/Ionicons";
import { type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { DashboardSectionCard } from "@/features/dashboard/components/dashboard-section-card";
import type { DashboardRecentPublication } from "@/features/dashboard/types/dashboard.type";
import { formatCount } from "@/features/dashboard/utils/dashboard-format";
import { useAppTheme } from "@/theme";

export function RecentPublicationsContent({
  publications,
}: {
  publications: DashboardRecentPublication[];
}) {
  if (publications.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {publications.slice(0, 5).map((publication) => (
        <PublicationRow publication={publication} key={publication.id} />
      ))}
    </View>
  );
}

function PublicationRow({
  publication,
}: {
  publication: DashboardRecentPublication;
}) {
  const theme = useAppTheme();
  const href = `/articles/${encodeURIComponent(publication.id)}` as Href;
  const meta = [
    publication.journal?.trim(),
    publication.publicationYear?.toString(),
    `${formatCount(publication.citationCount)} citations`,
  ].filter(Boolean);

  return (
    <DashboardSectionCard
      backgroundColor={theme.colors.surfaceMuted}
      href={href}
    >
      <View style={styles.row}>
        <Ionicons
          color={theme.colors.primary}
          name="document-text-outline"
          size={18}
          style={styles.rowIcon}
        />
        <View style={styles.rowCopy}>
          <Text
            numberOfLines={2}
            selectable
            style={[theme.typography.label, { color: theme.colors.text }]}
          >
            {publication.title?.trim() || "Untitled publication"}
          </Text>
          <Text
            numberOfLines={1}
            selectable
            style={[styles.rowMeta, { color: theme.colors.textMuted }]}
          >
            {meta.join(" - ")}
          </Text>
        </View>
      </View>
    </DashboardSectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  rowCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  rowIcon: {
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
});
