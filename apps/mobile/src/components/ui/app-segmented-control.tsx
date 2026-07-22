import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

type AppSegmentedControlOption<T extends string> = {
  label: string;
  value: T;
};

type AppSegmentedControlProps<T extends string> = {
  compact?: boolean;
  error?: string;
  label: string;
  onChange: (value: T) => void;
  options: AppSegmentedControlOption<T>[];
  value: T;
};

export function AppSegmentedControl<T extends string>({
  compact = false,
  error,
  label,
  onChange,
  options,
  value,
}: AppSegmentedControlProps<T>) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        style={[
          theme.typography.caption,
          { color: error ? theme.colors.error : theme.colors.outline },
        ]}
      >
        {label}
      </Text>

      <View
        accessibilityRole="radiogroup"
        style={[
          styles.container,
          compact ? styles.containerCompact : null,
          {
            borderColor: error ? theme.colors.error : theme.colors.outlineSoft,
            borderRadius: theme.radii.sm,
          },
        ]}
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                compact ? styles.optionCompact : null,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : pressed
                      ? theme.colors.surfaceMuted
                      : "transparent",
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  compact ? theme.typography.caption : theme.typography.label,
                  {
                    color: selected
                      ? theme.colors.onPrimary
                      : theme.colors.textMuted,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={[theme.typography.caption, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 40,
    overflow: "hidden",
  },
  containerCompact: {
    minHeight: 36,
  },
  option: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8,
  },
  optionCompact: {
    paddingHorizontal: 4,
  },
});
