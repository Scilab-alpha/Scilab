import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAppTheme } from "@/theme";

type SocialLoginButtonsProps = {
  onUnavailable: (provider: "Google" | "ORCID") => void;
};

export function SocialLoginButtons({ onUnavailable }: SocialLoginButtonsProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, { gap: theme.spacing.md }]}>
      <SocialButton
        icon={<GoogleIcon />}
        label="Google"
        onPress={() => onUnavailable("Google")}
      />
      <SocialButton
        icon={
          <View
            style={[styles.orcidIcon, { backgroundColor: theme.colors.teal }]}
          >
            <Text style={[styles.orcidText, { color: theme.colors.surface }]}>
              iD
            </Text>
          </View>
        }
        label="ORCID"
        onPress={() => onUnavailable("ORCID")}
      />
    </View>
  );
}

function SocialButton({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={`Continue with ${label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialButton,
        {
          backgroundColor: pressed
            ? theme.colors.surfaceMuted
            : theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.sm,
        },
      ]}
    >
      {icon}
      <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function GoogleIcon() {
  return (
    <Svg height={18} viewBox="0 0 24 24" width={18}>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.6 6.6 0 0 1-9.87-3.47H2.18v2.84A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15A10.6 10.6 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84A6.6 6.6 0 0 1 12 5.38Z"
        fill="#EA4335"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  orcidIcon: {
    alignItems: "center",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  orcidText: {
    fontSize: 8,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
  },
  socialButton: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
});
