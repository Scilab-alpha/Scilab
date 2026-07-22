import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Text, View } from "react-native";

import { AppSegmentedControl } from "@/components/ui";
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
        <>
          <LibraryItem
            icon="bookmark"
            meta="Journal of AI Research · 2026"
            title="Evaluating reasoning in autonomous research agents"
          />
          <LibraryItem
            icon="bookmark"
            meta="Computational Science Review · 2025"
            title="Knowledge graphs for scientific discovery"
          />
        </>
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

function LibraryItem({
  icon,
  meta,
  title,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  meta: string;
  title: string;
}) {
  const theme = useAppTheme();
  return (
    <SurfaceCard>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Ionicons color={theme.colors.primary} name={icon} size={20} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text
            selectable
            style={[theme.typography.label, { color: theme.colors.text }]}
          >
            {title}
          </Text>
          <Text
            selectable
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            {meta}
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}
