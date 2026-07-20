import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton, AppSegmentedControl, AppTextField } from "@/components/ui";
import { createZodResolver } from "@/features/auth/schemas";
import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import { createProfileSchema } from "@/features/profile/schemas/profile.schema";
import type {
  ProfileFormValues,
  UserProfile,
} from "@/features/profile/types/profile.type";
import { useAppTheme } from "@/theme";
import { formatIsoDateInput } from "@/utils/date-input";

const requiredGenderOptions: {
  label: string;
  value: ProfileFormValues["gender"];
}[] = [
  { label: "Female", value: "FEMALE" },
  { label: "Male", value: "MALE" },
  { label: "Other", value: "OTHER" },
];

const optionalGenderOptions: {
  label: string;
  value: ProfileFormValues["gender"];
}[] = [{ label: "Not set", value: "" }, ...requiredGenderOptions];

export function ProfileForm({
  isSaving,
  onSubmit,
  profile,
}: {
  isSaving: boolean;
  onSubmit: (values: ProfileFormValues) => void;
  profile: UserProfile;
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compactLayout = width < 400;
  const canClearDateOfBirth = !profile.dateOfBirth;
  const canClearGender = !profile.gender;
  const genderOptions = canClearGender
    ? optionalGenderOptions
    : requiredGenderOptions;
  const resolver = useMemo(
    () =>
      createZodResolver(
        createProfileSchema({ canClearDateOfBirth, canClearGender }),
      ),
    [canClearDateOfBirth, canClearGender],
  );
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    reset,
  } = useForm<ProfileFormValues>({
    defaultValues: toFormValues(profile),
    mode: "onBlur",
    resolver,
  });

  useEffect(() => {
    reset(toFormValues(profile));
  }, [profile, reset]);

  return (
    <SurfaceCard>
      <View style={{ gap: theme.spacing.lg }}>
        <View
          style={[
            styles.profilePhotoRow,
            { borderBottomColor: theme.colors.outlineSoft },
          ]}
        >
          <View
            style={[
              styles.photoIcon,
              { backgroundColor: theme.colors.primarySoft },
            ]}
          >
            <Ionicons
              color={theme.colors.primary}
              name="camera-outline"
              size={18}
            />
          </View>
          <Text style={[styles.photoTitle, { color: theme.colors.text }]}>
            Profile photo
          </Text>
          <Text
            style={[theme.typography.caption, { color: theme.colors.outline }]}
          >
            Waiting API
          </Text>
        </View>

        <View
          style={[
            styles.fieldRow,
            {
              flexDirection: compactLayout ? "column" : "row",
              gap: theme.spacing.lg,
            },
          ]}
        >
          <View style={styles.field}>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <AppTextField
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  label="First name"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Ada"
                  textContentType="givenName"
                  value={field.value}
                />
              )}
            />
          </View>
          <View style={styles.field}>
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <AppTextField
                  autoComplete="family-name"
                  error={errors.lastName?.message}
                  label="Last name"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Lovelace"
                  textContentType="familyName"
                  value={field.value}
                />
              )}
            />
          </View>
        </View>

        <View>
          <Text
            style={[theme.typography.caption, { color: theme.colors.outline }]}
          >
            Email
          </Text>
          <View
            style={[
              styles.readOnlyField,
              { borderBottomColor: theme.colors.outlineSoft },
            ]}
          >
            <Text
              selectable
              numberOfLines={1}
              style={[
                styles.readOnlyValue,
                theme.typography.body,
                { color: theme.colors.textMuted },
              ]}
            >
              {profile.email}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.outline },
              ]}
            >
              Read-only
            </Text>
          </View>
        </View>

        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <AppSegmentedControl
              error={errors.gender?.message}
              label="Gender"
              onChange={field.onChange}
              options={genderOptions}
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <AppTextField
              autoComplete="birthdate-full"
              error={errors.dateOfBirth?.message}
              keyboardType="number-pad"
              label={
                canClearDateOfBirth
                  ? "Date of birth (optional)"
                  : "Date of birth"
              }
              maxLength={10}
              onBlur={field.onBlur}
              onChangeText={(dateOfBirth) => {
                field.onChange(formatIsoDateInput(dateOfBirth));
              }}
              placeholder="YYYYMMDD"
              textContentType="birthdate"
              value={field.value}
            />
          )}
        />

        <AppButton
          disabled={!isDirty}
          label="Save changes"
          loading={isSaving}
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
        />
      </View>
    </SurfaceCard>
  );
}

function toFormValues(profile: UserProfile): ProfileFormValues {
  return {
    dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? "",
    firstName: profile.firstName ?? "",
    gender: profile.gender ?? "",
    lastName: profile.lastName ?? "",
  };
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  fieldRow: { width: "100%" },
  photoIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  photoTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  profilePhotoRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 48,
    paddingBottom: 12,
  },
  readOnlyField: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingVertical: 6,
  },
  readOnlyValue: {
    flex: 1,
    paddingRight: 12,
  },
});
