import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import {
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from "@/features/navigation/components/screen-shell";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

export function DashboardScreen() {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName || "Scholar";
  const isResearcher = user?.role === "RESEARCHER";

  return (
    <ScreenShell
      eyebrow="Your research pulse"
      subtitle="A focused view of the topics and journals you follow."
      title={`Welcome back, ${firstName}`}
    >
      <View style={styles.statsRow}>
        <StatCard label="Saved works" value="24" icon="bookmark-outline" />
        <StatCard label="Following" value="8" icon="radio-outline" />
        <StatCard label="New this week" value="12" icon="sparkles-outline" />
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeading title="Research update" />
        <SurfaceCard>
          <View style={styles.updateHeader}>
            <View
              style={[
                styles.updateIcon,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <Ionicons
                color={theme.colors.primary}
                name="trending-up"
                size={22}
              />
            </View>
            <View style={styles.updateCopy}>
              <Text
                selectable
                style={[theme.typography.label, { color: theme.colors.text }]}
              >
                Generative AI continues to accelerate
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textMuted },
                ]}
              >
                18% publication growth over the last 12 months
              </Text>
            </View>
          </View>
          <View style={styles.sparkline}>
            {[22, 31, 27, 40, 38, 54, 65, 61, 78, 88].map((height, index) => (
              <View
                key={`${height}-${index}`}
                style={[
                  styles.sparkBar,
                  {
                    backgroundColor: theme.colors.primary,
                    height: `${height}%`,
                  },
                ]}
              />
            ))}
          </View>
        </SurfaceCard>
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeading title="New from your follows" />
        <SurfaceCard>
          <Text
            selectable
            style={[theme.typography.caption, { color: theme.colors.primary }]}
          >
            ARTIFICIAL INTELLIGENCE · 2026
          </Text>
          <Text
            selectable
            style={[theme.typography.heading, { color: theme.colors.text }]}
          >
            A practical framework for trustworthy research agents
          </Text>
          <Text
            selectable
            style={[theme.typography.body, { color: theme.colors.textMuted }]}
          >
            Journal of Intelligent Systems · 4 authors
          </Text>
        </SurfaceCard>
      </View>

      {isResearcher ? (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeading title="Researcher workspace" />
          <SurfaceCard>
            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              ADVANCED DASHBOARD
            </Text>
            <Text
              selectable
              style={[theme.typography.heading, { color: theme.colors.text }]}
            >
              Compare keywords, heatmaps and journal ranking progress
            </Text>
          </SurfaceCard>
        </View>
      ) : null}
    </ScreenShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={19} />
      <Text selectable style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text
        selectable
        style={[theme.typography.caption, { color: theme.colors.textMuted }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minWidth: 0,
    padding: 12,
  },
  statValue: { fontSize: 20, fontVariant: ["tabular-nums"], fontWeight: "700" },
  updateHeader: { alignItems: "center", flexDirection: "row", gap: 12 },
  updateIcon: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  updateCopy: { flex: 1, gap: 2 },
  sparkline: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 6,
    height: 76,
  },
  sparkBar: { borderRadius: 3, flex: 1, minHeight: 8, opacity: 0.8 },
});
