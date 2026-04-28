import { useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Modal,
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";

import ForgeButton from "@/components/ForgeButton";
import { useScheme, Text, View } from "@/components/Themed";
import {
  api,
  MachineLookupRow,
  WorkoutLookup,
  SessionLog,
  TailoredExercise,
} from "@/core/api";
import { useUnits } from "@/core/conversions";
import { stylesProvider } from "./workout/AddWorkout.Styles";
import { AppModal } from "@/components/AppModal";

type SingleExercise = {
  name: string;
  machine_id: number;
  machine_name: string;
  weight: number;
  sets: number;
  reps: number;
};

const PREFERRED_MUSCLE_GROUP_ORDER = [
  "ab",
  "back",
  "bicep",
  "calf",
  "cardio",
  "chest",
  "forearm",
  "full body",
  "glute",
  "hamstring",
  "hip flexor",
  "lower back",
  "oblique",
  "quad",
  "shoulder",
  "tricep",
];

const PREFERRED_MACHINE_ORDER = [
  "dumbbell",
  "barbell",
  "body weight",
  "cable",
  "treadmill",
  "stair master",
  "elliptical",
  "bike",
  "row",
];

export default function AddWorkoutScreen() {
  const router = useRouter();

  const [splitName, setSplitName] = useState("");
  const [workouts, setWorkouts] = useState<WorkoutLookup[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null,
  );

  const [exerciseMapping, setExerciseMapping] = useState<
    Record<string, number>
  >({});
  const [machines, setMachines] = useState<MachineLookupRow[]>([]);

  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    null,
  );
  const [weight, setWeight] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  const [exerciseList, setExerciseList] = useState<SingleExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [tailorModalVisible, setTailorModalVisible] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailoredExercise | null>(
    null,
  );

  const [sessionDate, setSessionDate] = useState(formatToday());
  const [durationMinutes, setDurationMinutes] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [allSessions, setAllSessions] = useState<SessionLog[]>([]);
  const [showSplitSuggestions, setShowSplitSuggestions] = useState(false);
  const { isImperial } = useUnits();
  const [postSaveModalVisible, setPostSaveModalVisible] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null);
  const [postingSavedWorkout, setPostingSavedWorkout] = useState(false);

  // moving timer from workout
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const baseElapsedRef = useRef<number>(0);

  useEffect(() => {
    async function loadLookupData() {
      try {
        const [exerciseRows, machineRows, workoutRows, sessionRows] =
          await Promise.all([
            api.getExercises(),
            api.getMachines(),
            api.getWorkouts(),
            api.getWorkoutHistory(),
          ]);

        setExerciseMapping(exerciseRows);
        setMachines(machineRows);
        setWorkouts(workoutRows);
        setAllSessions(sessionRows);
      } catch {
        setExerciseMapping({});
        setMachines([]);
        setWorkouts([]);
        setAllSessions([]);
      }
    }

    void loadLookupData();
  }, []);

  // moving timer from workout.tsx
  useEffect(() => {
    if (!timerRunning || !startedAtMs) return;

    const intervalId = setInterval(() => {
      const delta = Math.floor((Date.now() - startedAtMs) / 1000);
      setElapsedSeconds(baseElapsedRef.current + delta);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerRunning, startedAtMs]);

  const exerciseOptions = useMemo(
    () =>
      Object.keys(exerciseMapping).map((key) => ({
        label: key,
        value: key,
      })),
    [exerciseMapping],
  );

  const workoutOptions = useMemo(() => {
    return [...workouts]
      .sort((a, b) => {
        const aIndex = PREFERRED_MUSCLE_GROUP_ORDER.indexOf(
          a.name.toLowerCase(),
        );
        const bIndex = PREFERRED_MUSCLE_GROUP_ORDER.indexOf(
          b.name.toLowerCase(),
        );

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((workout) => ({
        label: workout.name,
        value: workout.workout_id,
      }));
  }, [workouts]);

  const machineOptions = useMemo(() => {
    return [...machines]
      .sort((a, b) => {
        const aIndex = PREFERRED_MACHINE_ORDER.indexOf(a.name.toLowerCase());
        const bIndex = PREFERRED_MACHINE_ORDER.indexOf(b.name.toLowerCase());

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((machine) => ({
        label: machine.name,
        value: machine.machine_id,
      }));
  }, [machines]);

  const splitSuggestions = useMemo(() => {
    const normalizedSplit = splitName.trim().toLowerCase();
    const selectedDate = sessionDate.trim();

    return allSessions.filter((session) => {
      const sameDate = isoToDisplayDate(session.date) === selectedDate;
      if (!sameDate) return false;

      if (!normalizedSplit) return true;

      const split = (session.split_name ?? "").toLowerCase();
      const workout = session.workout_name.toLowerCase();

      return (
        split.includes(normalizedSplit) || workout.includes(normalizedSplit)
      );
    });
  }, [allSessions, sessionDate, splitName]);

  function addExercise() {
    if (!selectedExerciseName || selectedMachineId == null || !sets || !reps) {
      Alert.alert("Missing info", "Fill exercise, machine, sets, and reps.");
      return;
    }

    const parsedWeight = weight
      ? isImperial
        ? Number(weight)
        : Math.round(Number(weight) * 2.20462)
      : 0;
    const parsedSets = Number(sets);
    const parsedReps = Number(reps);

    if (!Number.isFinite(parsedSets) || !Number.isFinite(parsedReps)) {
      Alert.alert("Invalid values", "Sets and reps must be numbers.");
      return;
    }

    const selectedMachine = machines.find(
      (m) => m.machine_id === selectedMachineId,
    );
    if (!selectedMachine) {
      Alert.alert("Invalid machine", "Please select a valid machine.");
      return;
    }

    setExerciseList((prev) => [
      ...prev,
      {
        name: selectedExerciseName,
        machine_id: selectedMachine.machine_id,
        machine_name: selectedMachine.name,
        weight: parsedWeight,
        sets: parsedSets,
        reps: parsedReps,
      },
    ]);

    setSelectedExerciseName("");
    setSelectedMachineId(null);
    setWeight("");
    setSets("");
    setReps("");
  }

  async function handleTailor() {
    if (!selectedExerciseName) {
      Alert.alert(
        "No exercise selected",
        "Please select an exercise before tailoring.",
      );
      return;
    }

    if (selectedMachineId == null) {
      Alert.alert(
        "No machine selected",
        "Please select a machine before tailoring.",
      );
      return;
    }

    if (selectedWorkoutId == null) {
      Alert.alert("No muscle group", "Select a muscle group before tailoring.");
      return;
    }

    if (!splitName.trim()) {
      Alert.alert("Missing split name", "Enter a split name before tailoring.");
      return;
    }

    const apiDate = displayDateToApiDate(sessionDate.trim());
    if (!apiDate) {
      Alert.alert("Invalid date", "Enter date as MM/DD/YYYY.");
      return;
    }

    const selectedMachine = machines.find(
      (m) => m.machine_id === selectedMachineId,
    );
    if (!selectedMachine) {
      Alert.alert("Invalid machine", "Please select a valid machine.");
      return;
    }

    const selectedWorkout = workouts.find(
      (w) => w.workout_id === selectedWorkoutId,
    );
    if (!selectedWorkout) {
      Alert.alert(
        "Invalid muscle group",
        "Please select a valid muscle group.",
      );
      return;
    }

    setTailorModalVisible(true);

    try {
      const result = await api.getTailoredExercise({
        date: apiDate,
        split_name: splitName.trim(),
        workout_name: selectedWorkout.name,
        exercise_name: selectedExerciseName,
        machine_name: selectedMachine.name,
      });

      setWeight(String(result.weight));
      setSets(String(result.sets));
      setReps(String(result.reps));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to tailor exercise.";
      Alert.alert("Tailor failed", message);
    } finally {
      setTailorModalVisible(false);
    }
  }

  async function handleSave() {
    if (saving) return;

    if (!splitName.trim()) {
      Alert.alert("Missing split name", "Enter a split name.");
      return;
    }

    if (selectedWorkoutId == null) {
      Alert.alert("No muscle group", "Select a muscle group.");
      return;
    }

    if (exerciseList.length === 0) {
      Alert.alert("No exercises", "Add at least one exercise before logging.");
      return;
    }

    setSaving(true);
    try {
      const apiDate = displayDateToApiDate(sessionDate.trim());
      if (!apiDate) {
        Alert.alert("Invalid date", "Enter date as MM/DD/YYYY.");
        return;
      }

      const mins = Number(durationMinutes || "0");
      const secs = Number(durationSeconds || "0");
      const parsedDuration =
        durationMinutes.trim() === "" ? null : Math.round(mins * 60 + secs);

      if (parsedDuration != null && !Number.isFinite(parsedDuration)) {
        Alert.alert(
          "Invalid duration",
          "Duration must be a number of minutes.",
        );
        return;
      }

      const savedSession = await api.addWorkoutLog({
        workout_id: selectedWorkoutId,
        duration: parsedDuration,
        date: apiDate,
        split_name: splitName.trim(),
        exercises: exerciseList.map((ex) => ({
          exercise_id: exerciseMapping[ex.name] ?? 1,
          machine_id: ex.machine_id,
          weight: ex.weight,
          sets: ex.sets,
          reps: ex.reps,
        })),
      });

      setSavedSessionId(savedSession.session_id);
      setPostSaveModalVisible(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save workout.";
      Alert.alert("Save failed", message);
    } finally {
      setSaving(false);
    }
  }

  function formatToday() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  function formatDateInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  // moving timer from workout.tsx
  function formatElapsed(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function isoToDisplayDate(iso: string) {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  function displayDateToApiDate(value: string) {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, mm, dd, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  // moving timer handleStartWorkout handleEndWorkout from workout.tsx
  function handleToggleTimer() {
    if (timerRunning) {
      if (startedAtMs != null) {
        baseElapsedRef.current += Math.floor((Date.now() - startedAtMs) / 1000);
      }
      setStartedAtMs(null);
      setTimerRunning(false);
    } else {
      setStartedAtMs(Date.now());
      setTimerRunning(true);
    }
  }

  function handleSaveTimerToDuration() {
    const totalMins = Math.floor(elapsedSeconds / 60);
    const remainingSecs = elapsedSeconds % 60;
    setDurationMinutes(String(totalMins));
    setDurationSeconds(String(remainingSecs));
  }

  function closePostSaveModal() {
    setPostSaveModalVisible(false);
    setSavedSessionId(null);
    router.replace("/(tabs)/workout");
  }

  async function handleUploadSavedWorkout() {
    if (!savedSessionId || postingSavedWorkout) return;

    setPostingSavedWorkout(true);
    try {
      const result = await api.createWorkoutPost(savedSessionId);
      setPostSaveModalVisible(false);
      setSavedSessionId(null);
      Alert.alert(
        result.created === false ? "Already posted" : "Workout posted",
        result.created === false
          ? "This workout has already been posted."
          : "Your workout was saved as a post.",
      );
      router.replace("/(tabs)/workout");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to post workout.";
      Alert.alert("Post failed", message);
    } finally {
      setPostingSavedWorkout(false);
    }
  }

  const s = useScheme();
  const styles = stylesProvider();

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: "Back",
          headerTitle: "Log Workout",
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Log Workout</Text>

          <Text style={styles.label}>Date and split</Text>
          <View style={styles.row}>
            <View style={styles.dateBox}>
              <TextInput
                style={styles.input}
                value={sessionDate}
                onChangeText={(value) => setSessionDate(formatDateInput(value))}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={s.secondaryText}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.splitBox}>
              <TextInput
                style={styles.input}
                value={splitName}
                onChangeText={(value) => {
                  setSplitName(value);
                  setShowSplitSuggestions(true);
                }}
                onFocus={() => setShowSplitSuggestions(true)}
                placeholder="e.g. Pull Day"
                placeholderTextColor={s.secondaryText}
              />
            </View>
          </View>

          {showSplitSuggestions && splitSuggestions.length > 0 && (
            <View style={styles.suggestionCard}>
              {splitSuggestions.map((session) => (
                <Pressable
                  key={session.session_id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSplitName(session.split_name ?? "");
                    setSessionDate(isoToDisplayDate(session.date));
                    setShowSplitSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionTitle}>
                    {session.split_name ?? "Unknown Split"}
                  </Text>
                  <Text style={styles.suggestionSubtitle}>
                    {isoToDisplayDate(session.date)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Muscle group</Text>
          <Dropdown
            style={styles.dropdown}
            data={workoutOptions}
            labelField="label"
            valueField="value"
            value={selectedWorkoutId}
            placeholder="Select muscle group"
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            containerStyle={styles.dropdownContainer}
            itemContainerStyle={styles.dropdownItemContainer}
            itemTextStyle={styles.dropdownItemText}
            onChange={(item) => setSelectedWorkoutId(item.value)}
            renderItem={(item) => {
              const isSelected = item.value === selectedWorkoutId;

              return (
                <View
                  style={[
                    styles.dropdownOption,
                    { backgroundColor: isSelected ? s.buttonBg : s.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: isSelected ? "#fff" : s.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            }}
          />

          <Text style={styles.sectionTitle}>Add exercise</Text>

          <Text style={styles.subsectionTitle}>Exercise</Text>
          <Dropdown
            style={styles.dropdown}
            data={exerciseOptions}
            labelField="label"
            valueField="value"
            value={selectedExerciseName}
            placeholder="Select exercise"
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            containerStyle={styles.dropdownContainer}
            itemContainerStyle={styles.dropdownItemContainer}
            itemTextStyle={styles.dropdownItemText}
            inputSearchStyle={styles.dropdownSearchInput}
            search
            searchPlaceholder="Search exercises"
            onChange={(item) => setSelectedExerciseName(item.value)}
            renderItem={(item) => {
              const isSelected = item.value === selectedExerciseName;

              return (
                <View
                  style={[
                    styles.dropdownOption,
                    { backgroundColor: isSelected ? s.buttonBg : s.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: isSelected ? "#fff" : s.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            }}
          />

          <Text style={styles.subsectionTitle}>Machine</Text>
          <Dropdown
            style={[styles.dropdown, styles.machineDropdown]}
            data={machineOptions}
            labelField="label"
            valueField="value"
            value={selectedMachineId}
            placeholder="Select machine"
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            containerStyle={styles.dropdownContainer}
            itemContainerStyle={styles.dropdownItemContainer}
            itemTextStyle={styles.dropdownItemText}
            onChange={(item) => setSelectedMachineId(item.value)}
            renderItem={(item) => {
              const isSelected = item.value === selectedMachineId;

              return (
                <View
                  style={[
                    styles.dropdownOption,
                    { backgroundColor: isSelected ? s.buttonBg : s.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: isSelected ? "#fff" : s.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            }}
          />

          <View style={styles.row}>
            <View style={styles.exerciseInputCol}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>Weight (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="25"
                    placeholderTextColor={s.secondaryText}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor={s.secondaryText}
                  />
                </View>
              </View>
              <View>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={s.secondaryText}
                />
              </View>
            </View>

            <View style={styles.tailorCol}>
              <ForgeButton
                text="Tailor"
                color={s.buttonBg}
                onPress={() => {
                  void handleTailor();
                }}
                style={styles.tailorBtn}
              />
            </View>
          </View>

          <ForgeButton
            text="Add Exercise"
            onPress={addExercise}
            color={s.buttonSecondaryBg}
          />

          <Text style={styles.sectionTitle}>Current exercises</Text>
          {exerciseList.length === 0 ? (
            <Text style={styles.empty}>No exercises added</Text>
          ) : (
            exerciseList.map((ex, idx) => (
              <View key={`${ex.name}-${idx}`} style={styles.card}>
                <Text style={styles.cardTitle}>{ex.name}</Text>
                <Text>{`${ex.sets} x ${ex.reps}${ex.weight ? ` @ ${ex.weight} lbs` : ""} (${ex.machine_name})`}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>Duration</Text>

          <View style={styles.timerCard}>
            <Text style={styles.timerDisplay}>
              {formatElapsed(elapsedSeconds)}
            </Text>
            <View style={styles.timerButtonRow}>
              <ForgeButton
                text={
                  timerRunning
                    ? "Stop Timer"
                    : elapsedSeconds > 0
                      ? "Resume Timer"
                      : "Start Timer"
                }
                color={timerRunning ? s.dangerColor : s.buttonBg}
                compact
                style={styles.timerToggleBtn}
                onPress={handleToggleTimer}
              />
              <ForgeButton
                text="Save to Duration"
                color={s.buttonSecondaryBg}
                compact
                style={styles.timerToggleBtn}
                onPress={handleSaveTimerToDuration}
                disabled={elapsedSeconds === 0}
              />
            </View>
          </View>

          <Text style={styles.label}>Or enter manually</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Minutes</Text>
              <TextInput
                style={styles.input}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                placeholder="45"
                placeholderTextColor={s.secondaryText}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Seconds</Text>
              <TextInput
                style={styles.input}
                value={durationSeconds}
                onChangeText={setDurationSeconds}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={s.secondaryText}
              />
            </View>
          </View>

          <ForgeButton
            text={saving ? "Saving..." : "Log Workout"}
            color={s.buttonBg}
            disabled={saving}
            onPress={() => {
              void handleSave();
            }}
          />
          <AppModal
            visible={postSaveModalVisible}
            onClose={closePostSaveModal}
            title={"Post Workout"}
            actions={
              <>
                <ForgeButton
                  text={postingSavedWorkout ? "Uploading..." : "Upload"}
                  onPress={() => {
                    void handleUploadSavedWorkout();
                  }}
                  color={s.buttonBg}
                  disabled={postingSavedWorkout || savedSessionId == null}
                />
                <ForgeButton
                  text="Not Now"
                  onPress={closePostSaveModal}
                  color={s.buttonBg}
                  disabled={postingSavedWorkout}
                />
              </>
            }
          >
            <Text style={styles.modalSubtitle}>
              {" "}
              Would you like to upload this workout?
            </Text>
          </AppModal>
          <ForgeButton
            text="Back"
            onPress={() => router.back()}
            color={s.neutralColor}
          />

          <Modal visible={tailorModalVisible} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <ActivityIndicator size="large" color={s.buttonBg} />
                <Text style={styles.modalTitle}>Tailoring your workout</Text>
                <Text style={styles.modalSubtitle}>
                  Finding the ideal weight, sets & reps for{"\n"}
                  {selectedExerciseName || "your exercise"}...
                </Text>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    </>
  );
}
