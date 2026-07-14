import { Link, type Href } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { AuthorListItem } from "@/features/academic/types/article.type";
import { getAuthorDisplayName } from "@/features/academic/utils/article-format";
import { useAppTheme } from "@/theme";

type AuthorCardProps = {
  author: AuthorListItem;
};

export function AuthorCard({ author }: AuthorCardProps) {
  const theme = useAppTheme();
  const authorHref = `/authors/${encodeURIComponent(author.id)}` as Href;
  const name = getAuthorDisplayName(author);

  return (
    <Link asChild href={authorHref}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <View style={styles.row}>
          <AuthorAvatar imageUrl={author.imageUrl} name={name} size={42} />
          <View style={styles.authorText}>
            <Text
              numberOfLines={1}
              style={[
                theme.typography.label,
                styles.name,
                { color: theme.colors.text },
              ]}
            >
              {name}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                theme.typography.caption,
                styles.meta,
                { color: theme.colors.textMuted },
              ]}
            >
              {formatAuthorMeta(author)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export function AuthorAvatar({
  imageUrl,
  name,
  size = 52,
}: {
  imageUrl?: string | null;
  name: string;
  size?: number;
}) {
  const theme = useAppTheme();
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.outlineSoft,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}
    >
      {imageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: imageUrl }}
          style={[styles.avatarImage, { borderRadius: size / 2 }]}
        />
      ) : (
        <Text style={[theme.typography.label, { color: theme.colors.primary }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

export function formatArticleCount(count: number) {
  return `${count} article${count === 1 ? "" : "s"}`;
}

function formatAuthorMeta(author: AuthorListItem) {
  return formatArticleCount(author.articleCount);
}

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0 || name === "Unknown author") {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  card: {
    borderCurve: "continuous",
    borderWidth: 0,
    width: "100%",
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  authorText: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  meta: {
    lineHeight: 15,
  },
  name: {
    fontSize: 14,
    lineHeight: 18,
  },
  row: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    width: "100%",
  },
});
