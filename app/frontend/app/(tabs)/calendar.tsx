import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Text } from "../../components/Themed";

type CalendarItem = {
  id: string;
  title: string;
  time?: string;
};

const INITIAL_DATA: Record<string, CalendarItem[]> = {
  "2026-02-22": [{ id: "1", title: "Push workout", time: "6:00 PM" }],
  "2026-02-23": [{ id: "3", title: "Legs workout", time: "5:30 PM" }],
};

const SUGGESTED_WORKOUTS = [
  "Push workout",
  "Pull workout",
  "Legs workout",
  "Upper body",
  "Lower body",
  "Cardio",
  "Rest day",
];

export default function CalendarScreen() {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);

  const [eventsByDate, setEventsByDate] =
    useState<Record<string, CalendarItem[]>>(INITIAL_DATA);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  const itemsForDay = eventsByDate[selectedDate] ?? [];

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(eventsByDate).forEach((d) => {
      if ((eventsByDate[d] ?? []).length > 0) {
        marks[d] = { marked: true };
      }
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: "#2f80ed",
    };

    return marks;
  }, [eventsByDate, selectedDate]);

  function openAdd() {
    setNewTitle("");
    setNewTime("");
    setIsAddOpen(true);
  }

  function closeAdd() {
    setIsAddOpen(false);
  }

  function addWorkout() {
    const title = newTitle.trim();
    const time = newTime.trim();

    if (!title) {
      Alert.alert("Missing workout name", "Please enter a workout name.");
      return;
    }

    const item: CalendarItem = {
      id: `${Date.now()}`,
      title,
      time: time || undefined,
    };

    setEventsByDate((prev) => {
      const existing = prev[selectedDate] ?? [];
      return {
        ...prev,
        [selectedDate]: [item, ...existing],
      };
    });

    closeAdd();
  }

  function deleteItem(itemId: string) {
    setEventsByDate((prev) => {
      const existing = prev[selectedDate] ?? [];
      const next = existing.filter((x) => x.id !== itemId);

      const copy = { ...prev };
      if (next.length === 0) {
        delete copy[selectedDate];
      } else {
        copy[selectedDate] = next;
      }
      return copy;
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Calendar</Text>

      <Calendar
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        enableSwipeMonths
      />

      <View style={styles.rowBetween}>
        <Text style={styles.listHeaderText}>Scheduled for {selectedDate}</Text>

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Add workout</Text>
        </Pressable>
      </View>

      <FlatList
        data={itemsForDay}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workouts scheduled.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() =>
              Alert.alert("Delete", "Remove this workout from the calendar?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteItem(item.id) },
              ])
            }
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!!item.time && <Text style={styles.cardTime}>{item.time}</Text>}
              <Text style={styles.hint}>Long-press to delete</Text>
            </View>
          </Pressable>
        )}
      />

      {/* Add Workout Modal */}
      <Modal visible={isAddOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add workout</Text>

            <Text style={styles.label}>Workout name</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g., Push workout"
              autoCapitalize="sentences"
            />

            <View style={styles.suggestionsRow}>
              {SUGGESTED_WORKOUTS.slice(0, 4).map((w) => (
                <Pressable
                  key={w}
                  style={styles.suggestionChip}
                  onPress={() => setNewTitle(w)}
                >
                  <Text style={styles.suggestionText}>{w}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Time (optional)</Text>
            <TextInput
              style={styles.input}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="e.g., 6:00 PM"
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={closeAdd}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={addWorkout}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },

  rowBetween: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  listHeaderText: { fontSize: 16, fontWeight: "600", flexShrink: 1 },

  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#2f80ed",
  },
  addButtonText: { color: "white", fontWeight: "700" },

  emptyText: { marginTop: 10, opacity: 0.7 },

  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.15)",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardTime: { marginTop: 4, opacity: 0.7 },
  hint: { marginTop: 8, opacity: 0.5, fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 14,
    padding: 16,
    backgroundColor: "white",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  label: { fontSize: 14, fontWeight: "600", marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  suggestionText: { fontSize: 12, fontWeight: "600" },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  cancelBtn: { backgroundColor: "rgba(0,0,0,0.08)" },
  saveBtn: { backgroundColor: "#2f80ed" },
  cancelText: { fontWeight: "700" },
  saveText: { color: "white", fontWeight: "700" },
});