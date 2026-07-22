import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getRoleLabel } from "@/features/auth/utils/roles";
import type { UserProfile } from "@/features/profile/types/profile.type";
import { useAppTheme } from "@/theme";

export function ProfileHeroCard({ profile }: { profile: UserProfile }) {
  const theme = useAppTheme();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Scholar";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const showImage =
    Boolean(profile.imageUrl) && failedImageUrl !== profile.imageUrl;

  return (
    <View style={[styles.profile, { gap: theme.spacing.xl }]}>
      <View style={styles.summary}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.outlineSoft,
            },
          ]}
        >
          {showImage ? (
            <Image
              accessibilityLabel={`${displayName}'s profile photo`}
              contentFit="cover"
              onError={() => setFailedImageUrl(profile.imageUrl)}
              source={profile.imageUrl ?? undefined}
              style={styles.avatarImage}
              transition={180}
            />
          ) : (
            <Text style={[styles.initials, { color: theme.colors.primary }]}>
              {initials}
            </Text>
          )}
        </View>

        <View style={styles.identity}>
          <Text
            selectable
            style={[styles.displayName, { color: theme.colors.text }]}
          >
            {displayName}
          </Text>
          <Text
            selectable
            numberOfLines={1}
            style={[styles.email, { color: theme.colors.textMuted }]}
          >
            {profile.email}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.details,
          {
            borderTopColor: theme.colors.outlineSoft,
            gap: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
          },
        ]}
      >
        <ProfileInfoList
          rows={[
            { label: "First name", value: profile.firstName },
            { label: "Last name", value: profile.lastName },
            { label: "Gender", value: formatGender(profile.gender) },
            {
              label: "Date of birth",
              value: formatDateOfBirth(profile.dateOfBirth),
            },
            { label: "Role", value: getRoleLabel(profile.role) },
            { label: "Status", value: formatStatus(profile.status) },
          ]}
        />
      </View>
    </View>
  );
}

function ProfileInfoList({
  rows,
}: {
  rows: { label: string; value: string | null }[];
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.infoList}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[
            styles.infoItem,
            {
              borderBottomColor: theme.colors.outlineSoft,
              borderBottomWidth:
                index === rows.length - 1 ? 0 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              theme.typography.caption,
              styles.infoLabel,
              { color: theme.colors.outline },
            ]}
          >
            {row.label}
          </Text>
          <Text
            selectable
            style={[styles.infoValue, { color: theme.colors.text }]}
          >
            {row.value?.trim() || "Not set"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function formatGender(gender: UserProfile["gender"]) {
  if (!gender) {
    return null;
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

function formatDateOfBirth(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return null;
  }

  const parsedDate = new Date(dateOfBirth);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateOfBirth;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 52,
    borderWidth: 1,
    height: 104,
    justifyContent: "center",
    overflow: "hidden",
    width: 104,
  },
  avatarImage: { height: "100%", width: "100%" },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  email: { fontSize: 13, lineHeight: 19 },
  identity: { flex: 1, gap: 4 },
  initials: { fontSize: 27, fontWeight: "800" },
  details: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 20,
    paddingVertical: 9,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    width: 118,
  },
  infoList: {
    gap: 0,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    minWidth: 0,
  },
  profile: {},
  summary: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
});
