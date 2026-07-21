import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Text, View } from "react-native";

import { AppSegmentedControl } from "@/components/ui";
import { SavedBookmarksList } from "@/features/bookmarks/components/saved-bookmarks-list";
import {
  ScreenShell,
  SurfaceCard,
} from "@/features/navigation/components/screen-shell";
import { useAppTheme } from "@/theme";

type LibraryMode = "saved" | "following";

export function LibraryScreen() {
  const theme = useAppTheme();
  const [mode, setMode] = useState<LibraryMode>("saved");

  return (
    <ScreenShell
      subtitle="Your saved works and followed research signals."
      title="Library"
    >
      <AppSegmentedControl
        label="Library view"
        onChange={setMode}
        options={[
          { label: "Saved", value: "saved" },
          { label: "Following", value: "following" },
        ]}
        value={mode}
      />
      {mode === "saved" ? (
        <SavedBookmarksList />
      ) : (
        <SurfaceCard>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
            <Ionicons
              color={theme.colors.primary}
              name="radio-outline"
              size={24}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                selectable
                style={[theme.typography.label, { color: theme.colors.text }]}
              >
                8 topics and journals
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.textMuted },
                ]}
              >
                Daily in-app updates are enabled
              </Text>
            </View>
          </View>
        </SurfaceCard>
      )}
    </ScreenShell>
  );
}
