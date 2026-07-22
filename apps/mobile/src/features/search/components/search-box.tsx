import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { formatArticlePlaceholder } from "@/features/search/utils/search-filtering";
import { useAppTheme } from "@/theme";

export function SearchBox({
  articleKeyword,
  authorKeyword,
  isShowingAuthors,
  onArticleKeywordChange,
  onAuthorKeywordChange,
}: {
  articleKeyword: string;
  authorKeyword: string;
  isShowingAuthors: boolean;
  onArticleKeywordChange: (value: string) => void;
  onAuthorKeywordChange: (value: string) => void;
}) {
  const theme = useAppTheme();
  const keyword = isShowingAuthors ? authorKeyword : articleKeyword;

  return (
    <View
      style={[
        styles.searchBox,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.textMuted} name="search" size={18} />
      <TextInput
        accessibilityLabel={
          isShowingAuthors ? "Search authors" : "Search articles"
        }
        onChangeText={
          isShowingAuthors ? onAuthorKeywordChange : onArticleKeywordChange
        }
        placeholder={
          isShowingAuthors
            ? "Search loaded authors by name or ORCID..."
            : formatArticlePlaceholder()
        }
        placeholderTextColor={theme.colors.outline}
        style={[styles.input, { color: theme.colors.text }]}
        value={keyword}
      />
      {keyword ? (
        <Pressable
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() =>
            isShowingAuthors
              ? onAuthorKeywordChange("")
              : onArticleKeywordChange("")
          }
        >
          <Ionicons
            color={theme.colors.textMuted}
            name="close-circle"
            size={20}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 10,
  },
  searchBox: {
    alignItems: "center",
    borderCurve: "continuous",
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 44,
    paddingHorizontal: 14,
  },
});
