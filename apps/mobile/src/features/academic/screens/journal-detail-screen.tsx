import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import { JournalProfile } from "@/features/academic/components/journal-profile";
import { useJournal } from "@/features/academic/hooks/use-journal";
import { AppBackButton } from "@/features/navigation/components/app-back-button";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function JournalDetailScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ journalId?: string }>();
  const journalId = Array.isArray(params.journalId)
    ? params.journalId[0]
    : params.journalId;
  const {
    data: journal,
    error,
    isLoading,
    refetch,
  } = useJournal(journalId ?? "");

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
          title: "Journal Details",
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
            title="Could not load journal"
          />
        ) : journal ? (
          <JournalProfile journal={journal} />
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
