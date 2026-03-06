import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "@/components/Themed";

type ExerciseItem = {
  id: string;
  name: string;
  sets: string;
  reps: string;
};

type CalendarItem = {
  id: string;
  title: string;
  time?: string;
  exercises?: ExerciseItem[];
};

const INITIAL_DATA: Record<string, CalendarItem[]> = {
  "2026-02-22": [
    {
      id: "1",
      title: "Push workout",
      time: "6:00 PM",
      exercises: [
        { id: "e1", name: "Bench Press", sets: "3", reps: "10" },
      ],
    },
  ],
  "2026-02-23": [
    {
      id: "3",
      title: "Legs workout",
      time: "5:30 PM",
      exercises: [
        { id: "e2", name: "Squat", sets: "4", reps: "8" },
      ],
    },
  ],
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

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CalendarScreen() {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const [eventsByDate, setEventsByDate] =
    useState<Record<string, CalendarItem[]>>(INITIAL_DATA);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [includeTime, setIncludeTime] = useState(true);

  const [exerciseName, setExerciseName] = useState("");
  const [exerciseSets, setExerciseSets] = useState("");
  const [exerciseReps, setExerciseReps] = useState("");
  const [extraExercises, setExtraExercises] = useState<ExerciseItem[]>([]);

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
    setSelectedTime(new Date());
    setIncludeTime(true);
    setExerciseName("");
    setExerciseSets("");
    setExerciseReps("");
    setExtraExercises([]);
    setIsAddOpen(true);
  }

  function closeAdd() {
    setIsAddOpen(false);
  }

  function addExerciseField() {
    if (!exerciseName.trim() || !exerciseSets.trim() || !exerciseReps.trim()) {
      Alert.alert(
        "Missing exercise info",
        "Enter exercise name, sets, and reps before adding it."
      );
      return;
    }

    const newExercise: ExerciseItem = {
      id: `${Date.now()}`,
      name: exerciseName.trim(),
      sets: exerciseSets.trim(),
      reps: exerciseReps.trim(),
    };

    setExtraExercises((prev) => [...prev, newExercise]);
    setExerciseName("");
    setExerciseSets("");
    setExerciseReps("");
  }

  function removeExerciseField(id: string) {
    setExtraExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  }

  function addWorkout() {
    const title = newTitle.trim();

    if (!title) {
      Alert.alert("Missing workout name", "Please enter a workout name.");
      return;
    }

    const exercises: ExerciseItem[] = [...extraExercises];

    if (exerciseName.trim() || exerciseSets.trim() || exerciseReps.trim()) {
      if (!exerciseName.trim() || !exerciseSets.trim() || !exerciseReps.trim()) {
        Alert.alert(
          "Incomplete exercise",
          "Finish the current exercise or clear it before saving."
        );
        return;
      }

      exercises.push({
        id: `${Date.now()}-current`,
        name: exerciseName.trim(),
        sets: exerciseSets.trim(),
        reps: exerciseReps.trim(),
      });
    }

    const item: CalendarItem = {
      id: `${Date.now()}`,
      title,
      time: includeTime ? formatTime(selectedTime) : undefined,
      exercises,
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
        <Text style={styles.listHeaderText}>{`Scheduled for ${selectedDate}`}</Text>

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
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteItem(item.id),
                },
              ])
            }
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!!item.time && <Text style={styles.cardTime}>{item.time}</Text>}

              {!!item.exercises?.length && (
                <View style={styles.exerciseList}>
                  {item.exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.hint}>Long-press to delete</Text>
            </View>
          </Pressable>
        )}
      />

      <Modal visible={isAddOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
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

              <Text style={styles.label}>Time</Text>
              <Pressable
                style={[
                  styles.timeToggle,
                  includeTime ? styles.timeToggleActive : null,
                ]}
                onPress={() => setIncludeTime((prev) => !prev)}
              >
                <Text style={styles.timeToggleText}>
                  {includeTime
                    ? `Selected time: ${formatTime(selectedTime)}`
                    : "Tap to add a time"}
                </Text>
              </Pressable>

              {includeTime && (
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, pickedTime) => {
                      if (pickedTime) {
                        setSelectedTime(pickedTime);
                      }
                    }}
                  />
                </View>
              )}

              <Text style={styles.sectionHeader}>Exercises</Text>

              {!!extraExercises.length && (
                <View style={styles.savedExercisesWrap}>
                  {extraExercises.map((exercise) => (
                    <View key={exercise.id} style={styles.savedExerciseCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                      </View>

                      <Pressable
                        style={styles.removeExerciseBtn}
                        onPress={() => removeExerciseField(exercise.id)}
                      >
                        <Text style={styles.removeExerciseText}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Exercise name</Text>
              <TextInput
                style={styles.input}
                value={exerciseName}
                onChangeText={setExerciseName}
                placeholder="e.g., Bench Press"
                autoCapitalize="words"
              />

              <View style={styles.exerciseInputRow}>
                <View style={styles.exerciseInputCol}>
                  <Text style={styles.label}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    value={exerciseSets}
                    onChangeText={setExerciseSets}
                    placeholder="3"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.exerciseInputCol}>
                  <Text style={styles.label}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    value={exerciseReps}
                    onChangeText={setExerciseReps}
                    placeholder="10"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Pressable style={styles.addExerciseInlineButton} onPress={addExerciseField}>
                <Text style={styles.addButtonText}>+ Add exercise</Text>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={closeAdd}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, styles.saveBtn]}
                  onPress={addWorkout}
                >
                  <Text style={styles.saveText}>Save workout</Text>
                </Pressable>
              </View>
            </ScrollView>
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

  exerciseList: {
    marginTop: 10,
  },

  exerciseRow: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
  },

  exerciseMeta: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.7,
  },

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
    maxHeight: "90%",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "white",
  },

  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 6,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,
  },

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

  timeToggle: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
  },

  timeToggleActive: {
    borderColor: "#2f80ed",
    backgroundColor: "rgba(47,128,237,0.06)",
  },

  timeToggleText: {
    fontSize: 14,
  },

  pickerWrapper: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f7f7f7",
    alignItems: "center",
    justifyContent: "center",
  },

  savedExercisesWrap: {
    marginBottom: 8,
  },

  savedExerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  removeExerciseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  removeExerciseText: {
    fontSize: 12,
    fontWeight: "600",
  },

  exerciseInputRow: {
    flexDirection: "row",
    gap: 10,
  },

  exerciseInputCol: {
    flex: 1,
  },

  addExerciseInlineButton: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#27ae60",
    alignItems: "center",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
    marginBottom: 4,
  },

  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  cancelBtn: { backgroundColor: "rgba(0,0,0,0.08)" },
  saveBtn: { backgroundColor: "#2f80ed" },
  cancelText: { fontWeight: "700" },
  saveText: { color: "white", fontWeight: "700" },
});
