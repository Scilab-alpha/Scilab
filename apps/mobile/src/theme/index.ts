import { useColorScheme } from "react-native";

const lightColors = {
  background: "#FBF8F6",
  surface: "#FFFCFA",
  surfaceMuted: "#F4ECE8",
  primary: "#805E51",
  primaryPressed: "#6E4E42",
  primarySoft: "#F2E6E0",
  text: "#2B1812",
  textMuted: "#6E5650",
  outline: "#8B7770",
  outlineSoft: "#DCCFC9",
  error: "#BA1A1A",
  errorSoft: "#FFDAD6",
  success: "#2F6B58",
  successSoft: "#DCEFE7",
  teal: "#006A65",
  onPrimary: "#FFFFFF",
} as const;

const darkColors = {
  background: "#1C1715",
  surface: "#261F1C",
  surfaceMuted: "#332824",
  primary: "#E2BBAE",
  primaryPressed: "#F3D1C6",
  primarySoft: "#463029",
  text: "#F6EFEC",
  textMuted: "#D8C3BA",
  outline: "#BAA49B",
  outlineSoft: "#5C4640",
  error: "#FFB4AB",
  errorSoft: "#5F1717",
  success: "#87D8BD",
  successSoft: "#173E32",
  teal: "#72F7EE",
  onPrimary: "#2C160E",
} as const;

export type AppColors = {
  [Key in keyof typeof lightColors]: string;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  sm: 3,
  md: 6,
  lg: 10,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontFamily: process.env.EXPO_OS === "ios" ? "Georgia" : "serif",
    fontSize: 24,
    fontWeight: "400" as const,
    lineHeight: 32,
  },
  heading: {
    fontFamily: process.env.EXPO_OS === "ios" ? "Georgia" : "serif",
    fontSize: 20,
    fontWeight: "400" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 19,
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 10,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
    lineHeight: 14,
  },
} as const;

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return {
    colors: colorScheme === "dark" ? darkColors : lightColors,
    isDark: colorScheme === "dark",
    radii,
    spacing,
    typography,
  };
}
