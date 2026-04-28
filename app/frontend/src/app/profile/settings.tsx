import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { setToken } from "@/core/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";
import React, { useEffect, useMemo, useState } from "react";

import { ActionButton } from "@/components/settings/ActionButton";
import {
  dateFromStoredTime,
} from "@/core/notifications";
import DeleteAccountBanner from "@/components/deleteAccount/DeleteAccountBanner";
import DeleteAccountButton from "@/components/deleteAccount/DeleteAccountButton";
import { Field } from "@/components/settings/Field";
import { ModeButton } from "@/components/settings/ModeButton";
import { useSettings, MealTimeField } from "@/components/settings/settingsHook";
import { styles } from "@/app/profile/settings.Style"
import { StatusBanner } from "@/components/settings/StatusBanner";
import Slider from "@react-native-community/slider";
import { View, Text } from "@/components/Themed";
import { useAccessibility } from "@/core/accessibility";
import { useRouter, Stack } from "expo-router";
import { useUnits } from "@/core/conversions";

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function formatStoredTime(storedTime: string) {
  return dateFromStoredTime(storedTime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SettingsScreen() {
  const {loading, status, user, pUsername, setPUsername,
    pBio, setPBio, pGymLocation, setPGymLocation,
    notificationLoading, notificationPrefs, refreshMe, refreshNotificationPrefs,
    refreshGymLocations, updateNotificationsEnabled, updateNotificationToggle,
    updateMealTime, doUpdateProfile, doChangePassword, doLogout, setUser, setStatus,
    gymLocations, setGymLocations, cCurrent, setCCurrent, cNew, setCNew,
    setCurrentUser, setLoggedIn, currentUser} = useSettings();
  const { colorMode, setColorMode, textScale, setTextScale } =
    useAccessibility();
  const [activeMealPicker, setActiveMealPicker] =
    useState<MealTimeField | null>(null);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const router = useRouter();
  const { isImperial, setIsImperial } = useUnits();

  const pickerDate = useMemo(() => {
    if (!activeMealPicker) return new Date();
    return dateFromStoredTime(notificationPrefs[activeMealPicker]);
  }, [activeMealPicker, notificationPrefs]);

  const gymLocationOptions = useMemo(
    () =>
      gymLocations.map((location) => ({
        label: location,
        value: location,
      })),
    [gymLocations],
  );

  useEffect(() => {
    refreshMe();
    refreshNotificationPrefs();
    refreshGymLocations();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: "Back",
          headerTitle: "Settings",
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DeleteAccountBanner
          visible={accountDeleted}
          onFinished={() => router.replace("/auth/loginScreen")}
        />

        <View style={styles.container}>
          <StatusBanner status={status} />
          <Text style={styles.pageTitle}>Settings</Text>

          <SectionHeader title="Appearance" />
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.modeRow}>
            <ModeButton
              label="System"
              selected={colorMode === "system"}
              onPress={() => setColorMode("system")}
            />
            <ModeButton
              label="Light"
              selected={colorMode === "light"}
              onPress={() => setColorMode("light")}
            />
            <ModeButton
              label="Dark"
              selected={colorMode === "dark"}
              onPress={() => setColorMode("dark")}
            />
          </View>

          <Text style={styles.sectionTitle}>Text Size</Text>
          <Text style={styles.helper}>
            Adjust the slider to scale text across the app.
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={1.0}
            maximumValue={1.4}
            step={0.05}
            value={textScale}
            onValueChange={(v) => setTextScale(v)}
            minimumTrackTintColor="#2f80ed"
          />

          <View style={styles.previewCard}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>Preview</Text>
            <Text style={{ marginTop: 8 }}>
              This is how your text will look with the current setting.
            </Text>
          </View>

          <Text style={styles.footerNote}>
            Settings are saved automatically and will persist after restarting
            the app.
          </Text>
          <SectionHeader title="Preferences" />
          {notificationLoading && (
            <ActivityIndicator style={{ marginVertical: 8 }} color="#2f80ed" />
          )}
          <Text style={styles.sectionTitle}>App notifications</Text>
          <Text style={styles.helper}>
            Enable reminders for workouts on the calendar and recurring meal
            reminders.
          </Text>
          <View style={styles.modeRow}>
            <ModeButton
              label="Enabled"
              selected={notificationPrefs.notificationsEnabled}
              onPress={() => updateNotificationsEnabled(true)}
            />
            <ModeButton
              label="Disabled"
              selected={!notificationPrefs.notificationsEnabled}
              onPress={() => updateNotificationsEnabled(false)}
            />
          </View>

          <Text style={[styles.helper, { marginTop: 10 }]}>
            {notificationPrefs.notificationsEnabled
              ? "Reminders are currently on."
              : "Reminders are currently off."}
          </Text>

          {notificationPrefs.notificationsEnabled && (
            <>
              <Text style={styles.sectionTitle}>Workout reminders</Text>
              <Text style={styles.helper}>
                Workouts with a time on your calendar will send a reminder at
                the scheduled time.
              </Text>
              <View style={styles.modeRow}>
                <ModeButton
                  label="On"
                  selected={notificationPrefs.workoutRemindersEnabled}
                  onPress={() =>
                    updateNotificationToggle(
                      "workoutRemindersEnabled",
                      true,
                      "Workout reminders",
                    )
                  }
                />
                <ModeButton
                  label="Off"
                  selected={!notificationPrefs.workoutRemindersEnabled}
                  onPress={() =>
                    updateNotificationToggle(
                      "workoutRemindersEnabled",
                      false,
                      "Workout reminders",
                    )
                  }
                />
              </View>

              <Text style={styles.sectionTitle}>Meal reminders</Text>
              <Text style={styles.helper}>
                Choose daily times for breakfast, lunch, and dinner reminders.
              </Text>
              <View style={styles.modeRow}>
                <ModeButton
                  label="On"
                  selected={notificationPrefs.mealRemindersEnabled}
                  onPress={() =>
                    updateNotificationToggle(
                      "mealRemindersEnabled",
                      true,
                      "Meal reminders",
                    )
                  }
                />
                <ModeButton
                  label="Off"
                  selected={!notificationPrefs.mealRemindersEnabled}
                  onPress={() =>
                    updateNotificationToggle(
                      "mealRemindersEnabled",
                      false,
                      "Meal reminders",
                    )
                  }
                />
              </View>

              {notificationPrefs.mealRemindersEnabled && (
                <View style={styles.notificationCard}>
                  {(
                    [
                      ["Breakfast", "breakfastTime"],
                      ["Lunch", "lunchTime"],
                      ["Dinner", "dinnerTime"],
                    ] as Array<[string, MealTimeField]>
                  ).map(([label, field]) => (
                    <View key={field} style={styles.timeRow}>
                      <View>
                        <Text style={styles.timeLabel}>{label}</Text>
                        <Text style={styles.timeValue}>
                          {formatStoredTime(notificationPrefs[field])}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.timeButton}
                        onPress={() => setActiveMealPicker(field)}
                      >
                        <Text style={styles.timeButtonText}>Change</Text>
                      </Pressable>
                    </View>
                  ))}

                  {activeMealPicker && (
                    <View style={styles.pickerCard}>
                      <Text style={styles.fieldLabel}>Select time</Text>
                      <DateTimePicker
                        value={pickerDate}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_, selectedValue) => {
                          if (!selectedValue) return;
                          updateMealTime(activeMealPicker, selectedValue);
                          if (Platform.OS !== "ios") {
                            setActiveMealPicker(null);
                          }
                        }}
                      />
                      <ActionButton
                        label="Done"
                        variant="secondary"
                        onPress={() => setActiveMealPicker(null)}
                      />
                    </View>
                  )}
                </View>
              )}
            </>
          )}
          {/* Conversions from Metric to Imperial Units in UI */}
          <Text style={styles.sectionTitle}>Measurement units</Text>
          <Text style={styles.helper}>
            Unit preferences will be applied across the app.
          </Text>
          <View style={styles.modeRow}>
            {/* When selected, units will be displayed in Metric (kg, cm, mL, L) */}
            <ModeButton
              label="Metric"
              selected={!isImperial}
              onPress={() => setIsImperial(false)}
            />
            {/* When selected, units will be displayed in Imperial (lbs, inches, fl oz, gallons) */}
            <ModeButton
              label="Imperial"
              selected={isImperial}
              onPress={() => setIsImperial(true)}
            />
          </View>
          <SectionHeader title="Account" />
          <View style={styles.accountNested}>
            {loading && (
              <ActivityIndicator
                style={{ marginVertical: 8 }}
                color="#2f80ed"
              />
            )}
            <Text style={[styles.helper, { marginBottom: 12 }]}>
              {currentUser
                ? `Signed in as ${currentUser.username ?? "User"} (${currentUser.email})`
                : user
                  ? `Signed in as ${user.username} (${user.email})`
                  : ""}
            </Text>

            <View style={styles.accountSubsection}>
              <Text style={styles.accountSubsectionTitle}>Profile</Text>
              <Field
                label="Username"
                value={pUsername}
                onChangeText={setPUsername}
                placeholder="New username"
              />
              <Field
                label="Bio"
                value={pBio}
                onChangeText={setPBio}
                placeholder="Bio (≤280 chars)"
                multiline
              />
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Gym Location</Text>
                <Dropdown
                  style={styles.dropdown}
                  data={gymLocationOptions}
                  labelField="label"
                  valueField="value"
                  value={pGymLocation}
                  placeholder="Unknown Location"
                  onChange={(item) => setPGymLocation(item.value)}
                />
              </View>
          
              <ActionButton
                label="Save Profile"
                onPress={doUpdateProfile}
                disabled={loading}
              />
            </View>

            <View style={styles.accountSubsection}>
              <Text style={styles.accountSubsectionTitle}>Change Password</Text>
              <Field
                label="Current password"
                value={cCurrent}
                onChangeText={setCCurrent}
                secureTextEntry
              />
              <Field
                label="New password"
                value={cNew}
                onChangeText={setCNew}
                secureTextEntry
              />
              <ActionButton
                label="Change Password"
                onPress={doChangePassword}
                disabled={loading || !cCurrent || !cNew}
                variant="secondary"
              />
            </View>

            {user && (
              <View style={styles.accountSubsection}>
                <Text style={styles.accountSubsectionTitle}>Danger Zone</Text>
                <DeleteAccountButton
                  userId={user.profile_id}
                  onDeleted={() => {
                    setToken(null);
                    setUser(null);
                    setCurrentUser(null);
                    setLoggedIn(false);
                    setAccountDeleted(true);
                    setStatus({ type: "ok", msg: "Account deleted." });
                  }}
                />
              </View>
            )}
          </View>

            <View style={styles.accountSubsection}>
              <SectionHeader title="Session" />
              <Text style={[styles.helper, { marginBottom: 10 }]}>
                Log out of this account and return to the login screen.
              </Text>
              <ActionButton
                label="Log Out"
                onPress={doLogout}
                disabled={loading}
                variant="secondary"
              />
            </View>
        </View>
      </ScrollView>
    </>
  );
}
