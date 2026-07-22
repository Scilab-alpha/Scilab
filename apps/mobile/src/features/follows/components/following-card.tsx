import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { useToast } from "@/components/ui";
import { useToggleFollow } from "@/features/follows/hooks/use-toggle-follow";
import type { FollowListItem } from "@/features/follows/types/follow.type";
import {
  formatFollowMeta,
  getFollowIcon,
  getFollowTitle,
} from "@/features/follows/utils/follow-format";
import { SurfaceCard } from "@/components/layout/screen-shell";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function FollowingCard({ follow }: { follow: FollowListItem }) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const toggleFollow = useToggleFollow();
  const isPending =
    toggleFollow.isPending &&
    toggleFollow.variables?.objectId === follow.objectId &&
    toggleFollow.variables.objectType === follow.objectType;
  const target = (
    <View style={{ flexDirection: "row", gap: 12, minWidth: 0 }}>
      <Ionicons
        color={theme.colors.primary}
        name={getFollowIcon(follow)}
        size={20}
      />
      <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
        <Text
          numberOfLines={2}
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {getFollowTitle(follow)}
        </Text>
        <Text
          numberOfLines={2}
          selectable
          style={[theme.typography.caption, { color: theme.colors.textMuted }]}
        >
          {formatFollowMeta(follow)}
        </Text>
      </View>
    </View>
  );
  const linkedTarget = getLinkedTarget(follow, target);

  const unfollow = () => {
    if (isPending) {
      return;
    }

    toggleFollow.mutate(
      { objectId: follow.objectId, objectType: follow.objectType },
      {
        onError: (error) => {
          showToast(getUserFriendlyApiErrorMessage(error), { tone: "error" });
        },
        onSuccess: () => {
          showToast("Follow removed from your library.", { tone: "success" });
        },
      },
    );
  };
  const handleUnfollowPress = () => {
    Alert.alert("Unfollow", `Stop following ${getFollowTitle(follow)}?`, [
      { style: "cancel", text: "Cancel" },
      {
        onPress: unfollow,
        style: "destructive",
        text: "Unfollow",
      },
    ]);
  };

  return (
    <SurfaceCard>
      <View style={{ paddingRight: 74 }}>
        {linkedTarget}
        <Pressable
          accessibilityLabel={`Unfollow ${getFollowTitle(follow)}`}
          accessibilityRole="button"
          disabled={isPending}
          onPress={handleUnfollowPress}
          style={({ pressed }) => [
            {
              alignItems: "center",
              borderRadius: theme.radii.pill,
              justifyContent: "center",
              position: "absolute",
              right: 0,
              top: 0,
              minHeight: 28,
              paddingHorizontal: 6,
            },
            pressed || isPending ? { opacity: 0.72 } : null,
          ]}
        >
          {isPending ? (
            <ActivityIndicator color={theme.colors.error} size="small" />
          ) : (
            <Text
              numberOfLines={1}
              style={[
                theme.typography.caption,
                { color: theme.colors.outline, fontWeight: "700" },
              ]}
            >
              Unfollow
            </Text>
          )}
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

function getLinkedTarget(follow: FollowListItem, target: ReactNode) {
  if (follow.objectType === "AUTHOR") {
    return (
      <TargetLink href={`/authors/${encodeURIComponent(follow.objectId)}`}>
        {target}
      </TargetLink>
    );
  }

  if (follow.objectType === "JOURNAL") {
    return (
      <TargetLink href={`/journals/${encodeURIComponent(follow.objectId)}`}>
        {target}
      </TargetLink>
    );
  }

  return target;
}

function TargetLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link asChild href={href as Href}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          { flex: 1, minWidth: 0 },
          pressed ? { opacity: 0.78 } : null,
        ]}
      >
        {children}
      </Pressable>
    </Link>
  );
}
