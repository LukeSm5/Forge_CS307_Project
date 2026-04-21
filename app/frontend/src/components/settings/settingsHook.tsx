import { api, User, setToken} from "@/core/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_NOTIFICATION_PREFERENCES, 
    loadCalendarAndRescheduleNotificationsAsync, 
    loadNotificationPreferencesAsync, 
    NotificationPreferences, 
    saveNotificationPreferencesAsync, 
    requestNotificationPermissionsAsync,
    timeStringFromDate } from "@/core/notifications";
import { useState } from "react";
import { Status } from "./StatusBanner";
import { useRouter } from "expo-router";
import { useAuth } from "@/core/auth";

export type MealTimeField = "breakfastTime" | "lunchTime" | "dinnerTime";

export function useSettings() {

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pUsername, setPUsername] = useState("");
  const [pBio, setPBio] = useState("");
  const [pGymLocation, setPGymLocation] = useState("Unknown Location");
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [gymLocations, setGymLocations] = useState<string[]>(["Unknown Location"]);
  const [cCurrent, setCCurrent] = useState("");
  const [cNew, setCNew] = useState("");
  const router = useRouter();
  const { currentUser, setCurrentUser, setLoggedIn } = useAuth();
  
 async function refreshMe() {
    setLoading(true);
    setStatus(null);
    try {
      const me = await api.me();
      if (typeof me === "undefined") throw new Error("User not signed in.");
      setUser(me);
      setPUsername(me.username ?? "");
      setPBio(me.bio ?? "");
      setPGymLocation(me.gym_location ?? "Unknown Location");
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshNotificationPrefs() {
    setNotificationLoading(true);
    try {
      const prefs = await loadNotificationPreferencesAsync();
      setNotificationPrefs(prefs);
    } finally {
      setNotificationLoading(false);
    }
  }

   async function refreshGymLocations() {
    try {
      const locations = await api.getGymLocations();
      const withDefault = locations.includes("Unknown Location")
        ? locations
        : ["Unknown Location", ...locations];
      setGymLocations(withDefault);
    } catch {
      setGymLocations(["Unknown Location"]);
    }
  }
  async function persistNotificationPrefs(
      nextPrefs: NotificationPreferences,
      successMessage: string,
    ) {
      setNotificationLoading(true);
      setStatus(null);
  
      try {
        if (nextPrefs.notificationsEnabled) {
          const granted = await requestNotificationPermissionsAsync();
          if (!granted) {
            const reverted = { ...nextPrefs, notificationsEnabled: false };
            setNotificationPrefs(reverted);
            await saveNotificationPreferencesAsync(reverted);
            await loadCalendarAndRescheduleNotificationsAsync(reverted);
            setStatus({
              type: "err",
              msg: "Notification permission was not granted, so reminders remain off.",
            });
            return;
          }
        }
  
        setNotificationPrefs(nextPrefs);
        await saveNotificationPreferencesAsync(nextPrefs);
        await loadCalendarAndRescheduleNotificationsAsync(nextPrefs);
        setStatus({ type: "ok", msg: successMessage });
      } catch (e: any) {
        setStatus({
          type: "err",
          msg: e?.message ?? "Unable to update notification settings.",
        });
      } finally {
        setNotificationLoading(false);
      }
    }

  async function updateNotificationsEnabled(enabled: boolean) {
    await persistNotificationPrefs(
      {
        ...notificationPrefs,
        notificationsEnabled: enabled,
      },
      enabled ? "Notifications enabled." : "Notifications disabled.",
    );
  }
  async function updateNotificationToggle(
      key: "workoutRemindersEnabled" | "mealRemindersEnabled",
      enabled: boolean,
      label: string,
    ) {
      await persistNotificationPrefs(
        {
          ...notificationPrefs,
          [key]: enabled,
        },
        `${label} ${enabled ? "enabled" : "disabled"}.`,
      );
    }
  async function updateMealTime(field: MealTimeField, date: Date) {
    const nextPrefs = {
      ...notificationPrefs,
      [field]: timeStringFromDate(date),
    };

    await persistNotificationPrefs(nextPrefs, "Meal reminder time updated.");
  }

  async function doUpdateProfile() {
    setLoading(true);
    setStatus(null);
    try {
      const updated = await api.updateMe({
        username: pUsername || undefined,
        bio: pBio ?? "",
        gym_location: pGymLocation || "Unknown Location",
      });
      if (typeof updated === "undefined") throw new Error("User not signed in");
      setUser(updated);
      setStatus({ type: "ok", msg: "Profile updated." });
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function doChangePassword() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.changePassword({
        current_password: cCurrent,
        new_password: cNew,
      });
      if (typeof res === "undefined")
        throw new Error("Password change failed.");
      setCCurrent("");
      setCNew("");
      setStatus({ type: "ok", msg: "Password changed." });
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function doLogout() {
    setLoading(true);
    setStatus(null);
    try {
      await AsyncStorage.removeItem("refresh_token");
      setToken(null);
      setUser(null);
      setCurrentUser(null);
      setLoggedIn(false);
      router.replace("/loginScreen");
    } catch (e: any) {
      setStatus({ type: "err", msg: e?.message ?? "Unable to log out." });
    } finally {
      setLoading(false);
    }
  }
   return {
    loading, status, user, pUsername, setPUsername,
    pBio, setPBio, pGymLocation, setPGymLocation,
    notificationLoading, notificationPrefs,
    gymLocations, cCurrent, setCCurrent, cNew, setCNew,
    currentUser, setUser, setCurrentUser, setStatus,
    setGymLocations, setLoggedIn,
    refreshMe, refreshNotificationPrefs, refreshGymLocations,
    updateNotificationsEnabled, updateNotificationToggle,
    updateMealTime, doUpdateProfile, doChangePassword, doLogout,
  };
}