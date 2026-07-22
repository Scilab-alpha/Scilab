import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import { useAppTheme } from "@/theme";

const appVersion = "1.0.0";

const highlights = [
  {
    icon: "search-outline" as const,
    title: "Academic discovery",
    description: "Search papers, authors, journals, and research topics.",
  },
  {
    icon: "library-outline" as const,
    title: "Personal library",
    description: "Save articles and follow journals or topics that matter.",
  },
  {
    icon: "notifications-outline" as const,
    title: "Research signals",
    description: "Track updates from followed scholarly interests.",
  },
];

export function AboutScreen() {
  const theme = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { gap: theme.spacing.lg, padding: theme.spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.colors.background }}
    >
      <SurfaceCard>
        <View style={styles.hero}>
          <View
            style={[
              styles.logoSlot,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <BrandMark colors={theme.colors} size={42} />
          </View>
          <View style={styles.heroCopy}>
            <Text
              selectable
              style={[theme.typography.heading, { color: theme.colors.text }]}
            >
              ScholarTrend
            </Text>
            <Text
              selectable
              style={[theme.typography.body, { color: theme.colors.textMuted }]}
            >
              A mobile workspace for following academic signals, saving useful
              papers, and keeping research interests close at hand.
            </Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <View style={{ gap: theme.spacing.md }}>
          {highlights.map((item) => (
            <View key={item.title} style={styles.highlightRow}>
              <View
                style={[
                  styles.iconSlot,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderRadius: theme.radii.pill,
                  },
                ]}
              >
                <Ionicons color={theme.colors.primary} name={item.icon} size={18} />
              </View>
              <View style={styles.highlightCopy}>
                <Text
                  selectable
                  style={[theme.typography.label, { color: theme.colors.text }]}
                >
                  {item.title}
                </Text>
                <Text
                  selectable
                  style={[
                    theme.typography.body,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <View style={{ gap: theme.spacing.sm }}>
          <InfoRow label="Version" value={appVersion} />
          <InfoRow label="Theme" value="System" />
        </View>
      </SurfaceCard>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[theme.typography.caption, { color: theme.colors.outline }]}>
        {label}
      </Text>
      <Text selectable style={[theme.typography.label, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  heroCopy: {
    flex: 1,
    gap: 5,
  },
  highlightCopy: {
    flex: 1,
    gap: 3,
  },
  highlightRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  iconSlot: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoSlot: {
    alignItems: "center",
    height: 64,
    justifyContent: "center",
    width: 64,
  },
});
