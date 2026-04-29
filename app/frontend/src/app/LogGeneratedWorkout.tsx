import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Text, View, useScheme } from "@/components/Themed";
import ForgeButton from "@/components/ForgeButton";
import AltMachButton from "@/components/machineAlternatives/AltMachButton";
import ExerciseHelpInterface from "@/components/exerciseHelp/ExerciseHelpInterface";
import { api, QuickWorkoutResponse } from "@/core/api";
import { AppModal } from "@/components/AppModal";

function normalizeExerciseName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const exerciseToMuscle: Record<string, string> = {
  "pull up": "back",
  "lateral pull down": "back",
  row: "back",
  "face pull": "back",
  "bicep curl": "bicep",
  "preacher curl": "bicep",
  "hammer curl": "bicep",
  "straight bar curl": "bicep",
  "bench press": "chest",
  "incline bench press": "chest",
  "cable fly": "chest",
  "high low cable fly": "chest",
  "low high cable fly": "chest",
  "skull crusher": "tricep",
  "tricep push down": "tricep",
  "shoulder press": "shoulder",
  "shoulder raise": "shoulder",
  shrug: "shoulder",
  "bulgarian split squat": "quad",
  "romanian deadlift": "hamstring",
  "power clean": "full body",
  burpee: "full body",
  "sled push": "full body",
  "sled pull": "full body",
  "russian twist": "ab",
  "box jump": "quad",
  cardio: "cardio",
};

const exerciseAliases: Record<string, string> = {
  pullups: "pull up",
  "pull ups": "pull up",
  "lat pulldown": "lateral pull down",
  "lat pull down": "lateral pull down",
  "lateral pulldown": "lateral pull down",
  "tricep pushdown": "tricep push down",
};

const machineAliases: Record<string, string> = {
  bodyweight: "body weight",
  "bodyweight exercise": "body weight",
  stairmaster: "stair master",
  "stair climber": "stair master",
  "rowing machine": "row",
  "exercise bike": "bike",
  "stationary bike": "bike",
};

export default function LogGeneratedWorkout() {
  const router = useRouter();
  const s = useScheme();
  const [postSaveModalVisible, setPostSaveModalVisible] = useState(false);
  const { workout_name, exercises: exercisesJson } = useLocalSearchParams<{
    workout_name: string;
    exercises: string;
  }>();

  const exercises: QuickWorkoutResponse["exercises"] = exercisesJson
    ? JSON.parse(exercisesJson)
    : [];

  const [exerciseList, setExerciseList] = useState(exercises);
  const [exerciseMap, setExerciseMap] = useState<Record<string, number>>({});
  const [exerciseMapLoading, setExerciseMapLoading] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [machineMap, setMachineMap] = useState<Record<string, number>>({});
  const [workoutMap, setWorkoutMap] = useState<Record<string, number>>({});
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null,
  );
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{
    index: number;
    sets: { weight: string; reps: string }[];
  } | null>(null);
  const [savedLogId, setSavedLogId] = useState<number | null>(null);
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [postingSavedWorkout, setPostingSavedWorkout] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadExercises() {
      try {
        setExerciseMapLoading(true);
        const [lookup, machineRows, workoutRows] = await Promise.all([
          api.getExercises(),
          api.getMachines(),
          api.getWorkouts(),
        ]);
        if (isMounted) {
          setExerciseMap(lookup);
        }
        const machineMap: Record<string, number> = {};
        machineRows.forEach((machine) => {
          machineMap[machine.name] = machine.machine_id;
        });
        setMachineMap(machineMap);
        const workoutMap: Record<string, number> = {};
        workoutRows.forEach((workout) => {
          workoutMap[workout.name.toLowerCase()] = workout.workout_id;
        });
        setWorkoutMap(workoutMap);
      } catch {
        if (isMounted) {
          setExerciseMap({});
        }
      } finally {
        if (isMounted) {
          setExerciseMapLoading(false);
        }
      }
    }

    loadExercises();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDarkMode = s.background === "#000";
  const helpButtonBackground = isDarkMode ? "#2f95dc" : s.tint;
  const cardBorderColor = isDarkMode
    ? "rgba(255,255,255,0.12)"
    : "rgba(0,0,0,0.10)";
  const cardBackgroundColor = isDarkMode ? s.secondaryBackground : "#f8f8f8";

  const normalizedExerciseMap = useMemo(() => {
    const map: Record<string, number> = {};

    Object.entries(exerciseMap).forEach(([name, id]) => {
      map[normalizeExerciseName(name)] = Number(id);
    });

    return map;
  }, [exerciseMap]);

  const normalizedMachineMap = useMemo(() => {
    const map: Record<string, number> = {};

    Object.entries(machineMap).forEach(([name, id]) => {
      map[normalizeExerciseName(name)] = Number(id);
    });

    return map;
  }, [machineMap]);

  function openExerciseHelp(exerciseName: string) {
    const directId = exerciseMap[exerciseName];
    const normalizedId =
      normalizedExerciseMap[normalizeExerciseName(exerciseName)];
    const exerciseId = directId ?? normalizedId ?? null;

    if (!exerciseId) {
      Alert.alert(
        "Instructions unavailable",
        `We could not find saved instructions for ${exerciseName} yet.`,
      );
      return;
    }

    setSelectedExerciseId(exerciseId);
    setSelectedExerciseName(exerciseName);
    setHelpVisible(true);
  }

  function handleSaveEdit() {
    if (!editingExercise) {
      return;
    }
    const updatedExercises = [...exerciseList];
    updatedExercises[editingExercise.index] = {
      ...updatedExercises[editingExercise.index],
      sets: editingExercise.sets.length,
      reps: Number(editingExercise.sets[0].reps),
      weight: Number(editingExercise.sets[0].weight),
    };
    setExerciseList(updatedExercises);
    setEditModalVisible(false);
  }
  function getWorkoutID(): number {
    const muscleGroups = new Set(
      exerciseList.map((ex) => {
        const normalized = normalizeExerciseName(ex.exercise);
        return exerciseToMuscle[exerciseAliases[normalized] ?? normalized];
      }),
    );
    muscleGroups.delete(undefined as any);

    if (muscleGroups.size > 1) {
      return workoutMap["full body"] ?? 0;
    }

    const singleMuscle = [...muscleGroups][0];
    return workoutMap[singleMuscle] ?? workoutMap["full body"] ?? 0;
  }

  function getExerciseID(exerciseName: string): number | undefined {
    const normalizedName = normalizeExerciseName(exerciseName);
    const aliasedName = exerciseAliases[normalizedName];

    return (
      exerciseMap[exerciseName] ??
      normalizedExerciseMap[normalizedName] ??
      (aliasedName ? normalizedExerciseMap[aliasedName] : undefined)
    );
  }

  function getMachineID(machineName: string): number | undefined {
    const normalizedName = normalizeExerciseName(machineName);
    const aliasedName = machineAliases[normalizedName];

    return (
      machineMap[machineName] ??
      machineMap[machineName.toLowerCase()] ??
      normalizedMachineMap[normalizedName] ??
      (aliasedName ? normalizedMachineMap[aliasedName] : undefined)
    );
  }

  function closePostSaveModal() {
    setPostSaveModalVisible(false);
    router.replace("/(tabs)/workout");
  }

  async function handleLogWorkout() {
    if (loggingWorkout) return;

    if (savedLogId) {
      setPostSaveModalVisible(true);
      return;
    }

    const workoutId = getWorkoutID();
    if (!workoutId) {
      Alert.alert(
        "Workout did not log",
        "Could not match this generated workout to a saved workout category.",
      );
      return;
    }

    const unresolvedExercise = exerciseList.find(
      (ex) => !getExerciseID(ex.exercise),
    );
    if (unresolvedExercise) {
      Alert.alert(
        "Workout did not log",
        `Could not find the exercise "${unresolvedExercise.exercise}" in the database.`,
      );
      return;
    }

    const unresolvedMachine = exerciseList.find(
      (ex) => !getMachineID(ex.machine),
    );
    if (unresolvedMachine) {
      Alert.alert(
        "Workout did not log",
        `Could not find the machine "${unresolvedMachine.machine}" in the database.`,
      );
      return;
    }

    setLoggingWorkout(true);
    try {
      const result = await api.addWorkoutLog({
        workout_id: workoutId,
        split_name: workout_name || "Generated Workout",
        duration: 0,
        date: new Date().toISOString().split("T")[0],
        exercises: exerciseList.map((ex) => ({
          exercise_id: getExerciseID(ex.exercise)!,
          machine_id: getMachineID(ex.machine)!,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
        })),
      });

      setSavedLogId(result.session_id);
      setPostSaveModalVisible(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save generated workout.";
      Alert.alert("Workout did not log", message);
    } finally {
      setLoggingWorkout(false);
    }
  }

  async function handleUploadPost() {
    if (!savedLogId || postingSavedWorkout) return;

    setPostingSavedWorkout(true);
    try {
      const result = await api.createWorkoutPost(savedLogId);
      setPostSaveModalVisible(false);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{workout_name}</Text>
      <Text style={[styles.subtitle, { color: s.secondaryText }]}>
        Generated exercises
      </Text>
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Exercise</Text>
            <ScrollView
              style={styles.modalSets}
              contentContainerStyle={styles.modalSetsContent}
              showsVerticalScrollIndicator={false}
            >
              {editingExercise?.sets.map((setValue, set_idx) => (
                <RNView key={set_idx} style={styles.modalSetCard}>
                  <Text style={styles.modalSetTitle}>Set {set_idx + 1}</Text>
                  <RNView style={styles.modalInputRow}>
                    <RNView style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Weight</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={String(setValue.weight)}
                        onChangeText={(text) => {
                          const updated = [...editingExercise.sets];
                          updated[set_idx] = {
                            ...updated[set_idx],
                            weight: text,
                          };
                          setEditingExercise({
                            ...editingExercise,
                            sets: updated,
                          });
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#777"
                      />
                    </RNView>

                    <RNView style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Reps</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={String(setValue.reps)}
                        onChangeText={(text) => {
                          const updated = [...editingExercise.sets];
                          updated[set_idx] = {
                            ...updated[set_idx],
                            reps: text,
                          };
                          setEditingExercise({
                            ...editingExercise,
                            sets: updated,
                          });
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#777"
                      />
                    </RNView>
                  </RNView>
                </RNView>
              ))}
            </ScrollView>
            <ForgeButton text="Save" onPress={handleSaveEdit} />
            <ForgeButton
              text="Close"
              onPress={() => setEditModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exerciseList.map((ex, i) => (
          <View
            key={`${ex.exercise}-${i}`}
            style={[
              styles.exerciseCard,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorderColor,
              },
            ]}
          >
            <Text style={styles.exerciseName}>{ex.exercise}</Text>

            <Text style={[styles.exerciseStats, { color: s.secondaryText }]}>
              {ex.sets} sets x {ex.reps} reps @ {ex.weight} lbs
            </Text>

            <RNView style={styles.exerciseActions}>
              <ForgeButton
                text="Edit"
                onPress={() => {
                  setEditingExercise({
                    index: i,
                    sets: Array.from({ length: ex.sets }, () => ({
                      weight: String(ex.weight),
                      reps: String(ex.reps),
                    })),
                  });
                  setEditModalVisible(true);
                }}
              />
              <TouchableOpacity
                style={[
                  styles.helpButton,
                  {
                    backgroundColor: helpButtonBackground,
                    borderWidth: isDarkMode ? 1 : 0,
                    borderColor: isDarkMode
                      ? "rgba(255,255,255,0.18)"
                      : "transparent",
                  },
                  exerciseMapLoading && styles.helpButtonDisabled,
                ]}
                onPress={() => openExerciseHelp(ex.exercise)}
                disabled={exerciseMapLoading}
              >
                {exerciseMapLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.helpButtonText}>?</Text>
                )}
              </TouchableOpacity>

              <RNView style={styles.alternativesWrapper}>
                <AltMachButton exercise={ex.exercise} />
              </RNView>
            </RNView>
          </View>
        ))}
      </ScrollView>

      <RNView style={styles.footerButtons}>
        <ForgeButton
          text={loggingWorkout ? "Logging..." : "Log Generated Workout"}
          onPress={() => {
            void handleLogWorkout();
          }}
          disabled={loggingWorkout}
        />
        <ForgeButton
          text="Cancel"
          onPress={() => router.push("/(tabs)/workout")}
        />
      </RNView>
      <AppModal
        visible={postSaveModalVisible}
        onClose={closePostSaveModal}
        title={"Post Workout"}
        actions={
          <>
            <ForgeButton
              text={postingSavedWorkout ? "Uploading..." : "Upload"}
              onPress={() => {
                void handleUploadPost();
              }}
              color={s.buttonBg}
              disabled={postingSavedWorkout || savedLogId == null}
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

      <ExerciseHelpInterface
        visible={helpVisible}
        setVisible={setHelpVisible}
        exerciseId={selectedExerciseId}
        exerciseName={selectedExerciseName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 18,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 14,
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: 10,
  },
  exerciseStats: {
    fontSize: 16,
    lineHeight: 22,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
    backgroundColor: "transparent",
  },
  helpButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  helpButtonDisabled: {
    opacity: 0.75,
  },
  helpButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 26,
  },
  alternativesWrapper: {
    backgroundColor: "transparent",
  },
  footerButtons: {
    marginTop: 4,
    backgroundColor: "transparent",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalTitle: {
    color: "#111",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#fff",
  },
  modalSets: {
    maxHeight: 430,
    marginTop: 10,
    marginBottom: 8,
  },
  modalSetsContent: {
    gap: 12,
    paddingBottom: 4,
  },
  modalSetCard: {
    backgroundColor: "transparent",
  },
  modalSetTitle: {
    color: "#111",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalInputRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "transparent",
  },
  modalInputGroup: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "transparent",
  },
  modalInputLabel: {
    color: "#111",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#fff",
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});
