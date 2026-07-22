import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { PickerConfig } from "@/features/search/types/search.type";
import { useAppTheme } from "@/theme";

type YearPickerConfig = Extract<
  PickerConfig,
  { mode: "article-year-from" | "article-year-to" }
>;

export function FilterDropdown({
  onChange,
  onClose,
  picker,
}: {
  onChange: (selectedValues: string[]) => void;
  onClose: () => void;
  picker: PickerConfig | null;
}) {
  const theme = useAppTheme();
  const [customYear, setCustomYear] = useState("");
  const pickerMode = picker?.mode ?? null;

  useEffect(() => {
    setCustomYear("");
  }, [pickerMode]);

  if (!picker) {
    return null;
  }

  const isCustomYearPicker = isYearPicker(picker);
  const customYearState = getCustomYearState(picker, customYear);

  return (
    <View
      style={[
        styles.dropdown,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <View style={styles.pickerHeader}>
        <Text
          numberOfLines={1}
          selectable
          style={[
            theme.typography.label,
            styles.pickerTitle,
            { color: theme.colors.text },
          ]}
        >
          {picker.title}
        </Text>
        <Pressable
          accessibilityLabel="Close filter"
          hitSlop={8}
          onPress={onClose}
        >
          <Ionicons color={theme.colors.textMuted} name="close" size={16} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.pickerOptions}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={styles.pickerOptionsScroll}
      >
        {picker.options.length ? (
          picker.options.map((option) => {
            const value = option.value;
            const selected = picker.selectedValues.includes(value);

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={value}
                onPress={() => {
                  onChange([value]);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.pickerOption,
                  {
                    backgroundColor: selected
                      ? theme.colors.primarySoft
                      : pressed
                        ? theme.colors.surfaceMuted
                        : theme.colors.background,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.outlineSoft,
                    borderRadius: theme.radii.pill,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    theme.typography.label,
                    styles.pickerOptionLabel,
                    {
                      color: selected
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {selected ? (
                  <Ionicons
                    color={theme.colors.primary}
                    name="checkmark-circle"
                    size={14}
                  />
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <Text
            selectable
            style={[theme.typography.body, { color: theme.colors.textMuted }]}
          >
            No options available yet.
          </Text>
        )}
      </ScrollView>

      {isCustomYearPicker ? (
        <View style={styles.customYearArea}>
          <View
            style={[
              styles.customYearInputWrap,
              {
                backgroundColor: theme.colors.background,
                borderColor:
                  customYear && !customYearState.isValid
                    ? theme.colors.error
                    : theme.colors.outlineSoft,
                borderRadius: theme.radii.pill,
              },
            ]}
          >
            <Ionicons
              color={theme.colors.textMuted}
              name="create-outline"
              size={14}
            />
            <TextInput
              accessibilityLabel="Custom year"
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={setCustomYear}
              placeholder="Custom year"
              placeholderTextColor={theme.colors.outline}
              style={[styles.customYearInput, { color: theme.colors.text }]}
              value={customYear}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!customYearState.isValid}
            onPress={() => {
              onChange([customYearState.value]);
              onClose();
            }}
            style={({ pressed }) => [
              styles.customYearButton,
              {
                backgroundColor: customYearState.isValid
                  ? pressed
                    ? theme.colors.primaryPressed
                    : theme.colors.primary
                  : theme.colors.surfaceMuted,
                borderColor: customYearState.isValid
                  ? theme.colors.primary
                  : theme.colors.outlineSoft,
                borderRadius: theme.radii.pill,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                {
                  color: customYearState.isValid
                    ? theme.colors.onPrimary
                    : theme.colors.textMuted,
                },
              ]}
            >
              Apply
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function isYearPicker(picker: PickerConfig): picker is YearPickerConfig {
  return (
    picker.mode === "article-year-from" || picker.mode === "article-year-to"
  );
}

function getCustomYearState(picker: PickerConfig, value: string) {
  if (!isYearPicker(picker)) {
    return { isValid: false, value: "" };
  }

  const trimmedValue = value.trim();
  const parsedYear = Number(trimmedValue);
  const firstYear = picker.minYear ?? 1900;
  const lastYear = picker.maxYear ?? new Date().getFullYear();
  const isValid =
    /^\d{4}$/.test(trimmedValue) &&
    Number.isInteger(parsedYear) &&
    parsedYear >= firstYear &&
    parsedYear <= lastYear;

  return { isValid, value: trimmedValue };
}

const styles = StyleSheet.create({
  customYearArea: {
    flexDirection: "row",
    gap: 8,
  },
  customYearButton: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  customYearInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 7,
  },
  customYearInputWrap: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  dropdown: {
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 10,
    padding: 12,
    width: "100%",
  },
  pickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  pickerOption: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 30,
    maxWidth: "100%",
    paddingHorizontal: 9,
  },
  pickerOptionLabel: {
    maxWidth: 220,
  },
  pickerOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  pickerOptionsScroll: {
    maxHeight: 154,
  },
  pickerTitle: {
    flex: 1,
    maxWidth: 260,
  },
});
