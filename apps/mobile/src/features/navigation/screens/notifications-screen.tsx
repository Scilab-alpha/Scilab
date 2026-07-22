import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, Text, View } from "react-native";

import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import { useAppTheme } from "@/theme";

const notifications = [
  {
    icon: "sparkles-outline" as const,
    title: "6 new works match Generative AI",
    time: "12 min ago",
  },
  {
    icon: "journal-outline" as const,
    title: "Journal of AI Research published a new issue",
    time: "Yesterday",
  },
  {
    icon: "trending-up-outline" as const,
    title: "Explainable AI is trending this week",
    time: "2 days ago",
  },
];

export function NotificationsScreen() {
  const theme = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        gap: theme.spacing.md,
        padding: theme.spacing.xl,
      }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
    >
      {notifications.map((item) => (
        <SurfaceCard key={item.title}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                alignItems: "center",
                backgroundColor: theme.colors.primarySoft,
                borderRadius: 20,
                height: 40,
                justifyContent: "center",
                width: 40,
              }}
            >
              <Ionicons
                color={theme.colors.primary}
                name={item.icon}
                size={20}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                selectable
                style={[theme.typography.label, { color: theme.colors.text }]}
              >
                {item.title}
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textMuted },
                ]}
              >
                {item.time}
              </Text>
            </View>
          </View>
        </SurfaceCard>
      ))}
    </ScrollView>
  );
}
