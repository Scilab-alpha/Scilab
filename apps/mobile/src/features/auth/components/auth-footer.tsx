import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

export function AuthFooter() {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.sm }]}>
      <View style={[styles.links, { gap: theme.spacing.md }]}>
        <Text
          style={[theme.typography.caption, { color: theme.colors.outline }]}
        >
          Privacy Policy
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.outlineSoft },
          ]}
        >
          •
        </Text>
        <Text
          style={[theme.typography.caption, { color: theme.colors.outline }]}
        >
          Academic Terms
        </Text>
      </View>
      <Link href="/login" style={{ color: theme.colors.primary }}>
        <Text style={theme.typography.caption}>ScholarTrend Mobile</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  links: {
    alignItems: "center",
    flexDirection: "row",
  },
});
