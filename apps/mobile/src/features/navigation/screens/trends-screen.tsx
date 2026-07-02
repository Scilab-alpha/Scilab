import { Text, View } from "react-native";

import {
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from "@/features/navigation/components/screen-shell";
import { useAppTheme } from "@/theme";

export function TrendsScreen() {
  const theme = useAppTheme();
  const topics = [
    ["Large language models", "+24%"],
    ["Explainable AI", "+15%"],
    ["Edge intelligence", "+11%"],
  ];

  return (
    <ScreenShell
      subtitle="Compare publication momentum across topics and time."
      title="Publication trends"
    >
      <SurfaceCard>
        <Text
          selectable
          style={[theme.typography.caption, { color: theme.colors.primary }]}
        >
          TREND SNAPSHOT · 2021–2026
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            height: 130,
            alignItems: "flex-end",
          }}
        >
          {[28, 38, 46, 59, 73, 92].map((height, index) => (
            <View
              key={height}
              style={{ alignItems: "center", flex: 1, gap: 6 }}
            >
              <View
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 4,
                  height: `${height}%`,
                  opacity: 0.82,
                  width: "72%",
                }}
              />
              <Text
                selectable
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textMuted },
                ]}
              >
                {21 + index}
              </Text>
            </View>
          ))}
        </View>
      </SurfaceCard>
      <View style={{ gap: theme.spacing.md }}>
        <SectionHeading title="Fast-growing topics" />
        <SurfaceCard>
          {topics.map(([topic, growth], index) => (
            <View
              key={topic}
              style={{
                alignItems: "center",
                borderBottomColor: theme.colors.outlineSoft,
                borderBottomWidth: index === topics.length - 1 ? 0 : 1,
                flexDirection: "row",
                paddingVertical: 7,
              }}
            >
              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.text, flex: 1 },
                ]}
              >
                {topic}
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.label,
                  { color: theme.colors.success },
                ]}
              >
                {growth}
              </Text>
            </View>
          ))}
        </SurfaceCard>
      </View>
    </ScreenShell>
  );
}
