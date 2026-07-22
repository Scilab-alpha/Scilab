import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import type { FollowObjectType } from "@/features/follows/types/follow.type";
import { SurfaceCard } from "@/components/layout/screen-shell";
import { useAppTheme } from "@/theme";

type FollowingFilter = "ALL" | FollowObjectType;

export function FollowingEmptyState({ filter }: { filter: FollowingFilter }) {
  const theme = useAppTheme();

  return (
    <SurfaceCard>
      <View style={{ alignItems: "center", gap: 8, padding: 8 }}>
        <Ionicons color={theme.colors.primary} name="radio-outline" size={28} />
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {getEmptyTitle(filter)}
        </Text>
        <Text
          selectable
          style={[
            theme.typography.body,
            { color: theme.colors.textMuted, textAlign: "center" },
          ]}
        >
          {getEmptyMessage(filter)}
        </Text>
      </View>
    </SurfaceCard>
  );
}

function getEmptyTitle(filter: FollowingFilter) {
  if (filter === "AUTHOR") {
    return "No followed authors yet";
  }

  if (filter === "JOURNAL") {
    return "No followed journals yet";
  }

  if (filter === "TOPIC") {
    return "No followed topics yet";
  }

  return "No followed targets yet";
}

function getEmptyMessage(filter: FollowingFilter) {
  if (filter === "AUTHOR") {
    return "Follow authors from author profile pages.";
  }

  if (filter === "JOURNAL") {
    return "Follow journals from journal profile pages.";
  }

  if (filter === "TOPIC") {
    return "Follow topic chips from article details.";
  }

  return "Follow authors, journals and topics to build your research signal.";
}
