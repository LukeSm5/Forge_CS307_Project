import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export type ExerciseItem = {
  id: string;
  name: string;
  sets: string;
  reps: string;
};

export type CalendarItem = {
  id: string;
  title: string;
  time?: string;
  exercises?: ExerciseItem[];
};

export type CalendarEventsByDate = Record<string, CalendarItem[]>;

export type NotificationPreferences = {
  notificationsEnabled: boolean;
  workoutRemindersEnabled: boolean;
  mealRemindersEnabled: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
};

const STORAGE_KEYS = {
  preferences: "forge.notifications.preferences",
  calendarEvents: "forge.calendar.events",
} as const;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notificationsEnabled: false,
  workoutRemindersEnabled: true,
  mealRemindersEnabled: true,
  breakfastTime: "08:00",
  lunchTime: "12:30",
  dinnerTime: "18:30",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function loadNotificationPreferencesAsync(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.preferences);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function saveNotificationPreferencesAsync(
  preferences: NotificationPreferences
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}

export async function loadCalendarEventsAsync(): Promise<CalendarEventsByDate | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.calendarEvents);
    if (!raw) return null;
    return JSON.parse(raw) as CalendarEventsByDate;
  } catch {
    return null;
  }
}

export async function saveCalendarEventsAsync(
  eventsByDate: CalendarEventsByDate
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.calendarEvents, JSON.stringify(eventsByDate));
}

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;

  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("forge-reminders", {
      name: "Forge reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return true;
}

function parseClockTime(time: string): { hour: number; minute: number } {
  const [hourPart = "0", minutePart = "0"] = time.split(":");
  const hour = Math.max(0, Math.min(23, Number.parseInt(hourPart, 10) || 0));
  const minute = Math.max(0, Math.min(59, Number.parseInt(minutePart, 10) || 0));
  return { hour, minute };
}

export function timeStringFromDate(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function dateFromStoredTime(time: string): Date {
  const now = new Date();
  const { hour, minute } = parseClockTime(time);
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function parseCalendarDateTime(dateString: string, time?: string): Date | null {
  if (!time) return null;

  const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const triggerDate = new Date(`${dateString}T00:00:00`);
  triggerDate.setHours(hours, minutes, 0, 0);
  return Number.isNaN(triggerDate.getTime()) ? null : triggerDate;
}

async function scheduleDailyMealReminderAsync(
  mealName: string,
  storedTime: string
): Promise<void> {
  const { hour, minute } = parseClockTime(storedTime);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${mealName} reminder`,
      body: `It's time for ${mealName.toLowerCase()}.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "forge-reminders",
    } as any,
  });
}

async function scheduleWorkoutReminderAsync(
  dateString: string,
  workout: CalendarItem
): Promise<void> {
  const triggerDate = parseCalendarDateTime(dateString, workout.time);
  if (!triggerDate) return;
  if (triggerDate.getTime() <= Date.now()) return;

  const exerciseCount = workout.exercises?.length ?? 0;
  const exerciseText =
    exerciseCount > 0
      ? ` You have ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"} planned.`
      : "";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Workout reminder",
      body: `${workout.title} starts at ${workout.time}.${exerciseText}`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: "forge-reminders",
    } as any,
  });
}

export async function rescheduleAppNotificationsAsync(
  eventsByDate: CalendarEventsByDate,
  preferences?: NotificationPreferences
): Promise<void> {
  if (Platform.OS === "web") return;

  const prefs = preferences ?? (await loadNotificationPreferencesAsync());

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!prefs.notificationsEnabled) return;

  const granted = await requestNotificationPermissionsAsync();
  if (!granted) return;

  if (prefs.mealRemindersEnabled) {
    await scheduleDailyMealReminderAsync("Breakfast", prefs.breakfastTime);
    await scheduleDailyMealReminderAsync("Lunch", prefs.lunchTime);
    await scheduleDailyMealReminderAsync("Dinner", prefs.dinnerTime);
  }

  if (prefs.workoutRemindersEnabled) {
    const dateKeys = Object.keys(eventsByDate);
    for (const dateKey of dateKeys) {
      const workouts = eventsByDate[dateKey] ?? [];
      for (const workout of workouts) {
        if (workout.time) {
          await scheduleWorkoutReminderAsync(dateKey, workout);
        }
      }
    }
  }
}

export async function loadCalendarAndRescheduleNotificationsAsync(
  preferences?: NotificationPreferences
): Promise<void> {
  const events = (await loadCalendarEventsAsync()) ?? {};
  await rescheduleAppNotificationsAsync(events, preferences);
}