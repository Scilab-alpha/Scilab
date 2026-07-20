import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useToast } from "@/components/ui";
import { useFollowStatus } from "@/features/follows/hooks/use-follows";
import { useToggleFollow } from "@/features/follows/hooks/use-toggle-follow";
import type {
  FollowNotifyMode,
  FollowObjectType,
} from "@/features/follows/types/follow.type";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function FollowButton({
  label = "Follow",
  notifyMode = "IN_APP",
  objectId,
  objectType,
}: {
  label?: string;
  notifyMode?: FollowNotifyMode;
  objectId: string;
  objectType: FollowObjectType;
}) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const followStatusQuery = useFollowStatus({ objectId, objectType });
  const toggleFollow = useToggleFollow();
  const latestToggle =
    toggleFollow.data &&
    toggleFollow.data.objectId === objectId &&
    toggleFollow.data.objectType === objectType
      ? toggleFollow.data.followed
      : null;
  const isFollowed = latestToggle ?? followStatusQuery.data ?? false;
  const isPending = toggleFollow.isPending;

  const handlePress = () => {
    if (isPending) {
      return;
    }

    toggleFollow.mutate(
      { notifyMode, objectId, objectType },
      {
        onError: (error) => {
          showToast(getUserFriendlyApiErrorMessage(error), { tone: "error" });
        },
        onSuccess: (result) => {
          showToast(
            result.followed
              ? "Follow added to your library."
              : "Follow removed from your library.",
            { tone: "success" },
          );
        },
      },
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isPending}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isFollowed
            ? theme.colors.primaryPressed
            : theme.colors.primary,
          borderRadius: theme.radii.md,
          opacity: pressed || isPending ? 0.82 : 1,
        },
      ]}
    >
      {isPending ? (
        <ActivityIndicator color={theme.colors.onPrimary} size="small" />
      ) : null}
      <Text style={[theme.typography.label, { color: theme.colors.onPrimary }]}>
        {isPending ? "Updating..." : isFollowed ? "Following" : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
});
