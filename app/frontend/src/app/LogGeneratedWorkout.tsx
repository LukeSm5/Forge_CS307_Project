import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  Modal
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";


import { Text, View, useScheme } from "@/components/Themed";
import ForgeButton from "@/components/ForgeButton";
import ForgeTextBox from "@/components/ForgeTextBox";
import AltMachButton from "@/components/machineAlternatives/AltMachButton";
import ExerciseHelpInterface from "@/components/exerciseHelp/ExerciseHelpInterface";
import { api, QuickWorkoutResponse } from "@/core/api";

function normalizeExerciseName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function LogGeneratedWorkout() {
  const router = useRouter();
  const s = useScheme();
  const { workout_name, exercises: exercisesJson } = useLocalSearchParams<{
        workout_name: string;
        exercises: string;
  }>();

  const exercises: QuickWorkoutResponse["exercises"] = exercisesJson
        ? JSON.parse(exercisesJson) 
        : [];

  const [exerciseMap, setExerciseMap] = useState<Record<string, number>>({});
  const [exerciseMapLoading, setExerciseMapLoading] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null,
  );
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{
    index: number;
    sets: {weight : Number, reps: number}[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadExercises() {
      try {
        setExerciseMapLoading(true);
        const lookup = await api.getExercises();
        if (isMounted) {
          setExerciseMap(lookup);
        }
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
            {editingExercise?.sets.map((_, set_idx) => (
                <RNView key={set_idx} style={{flexDirection: "row", gap: 12}}>
                  <Text style={{marginBottom: 6}}>Set {set_idx + 1}:</Text>
                  <RNView style = {{flexDirection: "row", gap: 12, flex: 1}}>
                    <ForgeTextBox
                        label = "Weight"
                        value={String(editingExercise.sets[set_idx].weight)}
                        onChangeText={(text) => {
                            const updated = [...editingExercise.sets];
                            updated[set_idx] = {...updated[set_idx], weight: Number(text)};
                            setEditingExercise({...editingExercise, sets: updated});
                        }}
                        placeholder = "Weight"
                    />
                    <ForgeTextBox
                        label = "Reps"
                        value={String(editingExercise.sets[set_idx].reps)}
                        onChangeText={(text) => {
                            const updated = [...editingExercise.sets];
                            updated[set_idx] = {...updated[set_idx], reps: Number(text)};
                            setEditingExercise({...editingExercise, sets: updated});
                        }}
                        placeholder = "Reps"
                    />
                  </RNView>
                </RNView>
            ))}
            <ForgeButton text="Save" onPress={() => setEditModalVisible(false)} />
            <ForgeButton text="Close" onPress={() => setEditModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
                {exercises.map((ex, i) => (
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
                    onPress = {() => {
                      setEditingExercise({
                        index: i,
                        sets: Array.from({ length: ex.sets }, () => ({weight: ex.weight, reps: ex.reps})),
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
          text="Log Generated Workout"
          onPress={() => router.push("/(tabs)/workout")}
        />
        <ForgeButton
          text="Cancel"
          onPress={() => router.push("/(tabs)/workout")}
        />
      </RNView>

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
        fontSize: 18,
        textAlign: "center",
    },
    modalCard: {
      width: "100%",
      maxWidth: 860,
      maxHeight: "90%",
      borderRadius: 14,
      padding: 16,
      backgroundColor: "#fff",
    },
});
