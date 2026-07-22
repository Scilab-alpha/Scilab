import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { ArticleErrorState } from "@/components/academic/article-error-state";
import { AuthorProfile } from "@/features/authors/components/author-profile";
import { useAuthor } from "@/features/authors/hooks/use-author";
import { AppBackButton } from "@/components/navigation/app-back-button";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function AuthorDetailScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ authorId?: string }>();
  const authorId = Array.isArray(params.authorId)
    ? params.authorId[0]
    : params.authorId;
  const { data: author, error, isLoading, refetch } = useAuthor(authorId ?? "");

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => (
            <View style={styles.headerBackSlot}>
              <AppBackButton variant="brown" />
            </View>
          ),
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.primary,
          headerTitleAlign: "center",
          headerTitleStyle: {
            color: theme.colors.primary,
            fontSize: 15,
            fontWeight: "700",
          },
          title: "Author Details",
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { gap: theme.spacing.xl, padding: theme.spacing.xl },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : error ? (
          <ArticleErrorState
            message={getUserFriendlyApiErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : author ? (
          <AuthorProfile author={author} />
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  content: {
    paddingBottom: 36,
  },
  headerBackSlot: {
    marginLeft: 4,
  },
});
