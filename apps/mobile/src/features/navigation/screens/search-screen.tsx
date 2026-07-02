import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppSegmentedControl } from "@/components/ui";
import {
  ScreenShell,
  SurfaceCard,
} from "@/features/navigation/components/screen-shell";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

type SearchMode = "articles" | "journals";

export function SearchScreen() {
  const theme = useAppTheme();
  const [mode, setMode] = useState<SearchMode>("articles");
  const isResearcher = useAuthStore(
    (state) => state.user?.role === "RESEARCHER",
  );

  return (
    <ScreenShell
      subtitle="Search credible works and journals from one place."
      title="Discover research"
    >
      <AppSegmentedControl
        label="Search in"
        onChange={setMode}
        options={[
          { label: "Articles", value: "articles" },
          { label: "Journals", value: "journals" },
        ]}
        value={mode}
      />
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineSoft,
          },
        ]}
      >
        <Ionicons color={theme.colors.textMuted} name="search" size={20} />
        <TextInput
          accessibilityLabel={`Search ${mode}`}
          placeholder={
            mode === "articles"
              ? "Title, keyword, author or DOI"
              : "Name, ISSN, topic or country"
          }
          placeholderTextColor={theme.colors.outline}
          style={[styles.input, { color: theme.colors.text }]}
        />
        <Pressable accessibilityLabel="Open filters" hitSlop={8}>
          <Ionicons
            color={theme.colors.primary}
            name="options-outline"
            size={21}
          />
        </Pressable>
      </View>
      <SurfaceCard>
        <Text
          selectable
          style={[theme.typography.caption, { color: theme.colors.primary }]}
        >
          START EXPLORING
        </Text>
        <Text
          selectable
          style={[theme.typography.heading, { color: theme.colors.text }]}
        >
          Find the signal in a growing body of research
        </Text>
        <Text
          selectable
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          Use filters for year, open access, quartile and subject area when
          search results are connected.
        </Text>
      </SurfaceCard>
      {isResearcher ? (
        <SurfaceCard>
          <View style={styles.researcherTool}>
            <Ionicons
              color={theme.colors.primary}
              name="git-network-outline"
              size={24}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                selectable
                style={[theme.typography.label, { color: theme.colors.text }]}
              >
                Graph advanced search
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.textMuted },
                ]}
              >
                Explore co-authorship and complex academic relationships.
              </Text>
            </View>
            <Ionicons
              color={theme.colors.textMuted}
              name="chevron-forward"
              size={17}
            />
          </View>
        </SurfaceCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 12 },
  researcherTool: { alignItems: "center", flexDirection: "row", gap: 12 },
});
