import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Text, View, useScheme } from "@/components/Themed";
import ForgeButton from "@/components/ForgeButton";
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {exercises.map((ex, i) => (
          <View key={`${ex.exercise}-${i}`} style={styles.exercise}>
            <View style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.exercise}</Text>

              <RNView style={styles.exerciseActions}>
                <TouchableOpacity
                  style={[
                    styles.helpButton,
                    { backgroundColor: s.tint },
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

                <AltMachButton exercise={ex.exercise} />
              </RNView>
            </View>

            <Text style={styles.exerciseStats}>
              {ex.sets} sets x {ex.reps} reps @ {ex.weight} lbs
            </Text>
          </View>
        ))}
      </ScrollView>

      <ForgeButton
        text="Log Generated Workout"
        onPress={() => router.push("/(tabs)/workout")}
      />
      <ForgeButton
        text="Cancel"
        onPress={() => router.push("/(tabs)/workout")}
      />

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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  exercise: {
    marginBottom: 18,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  exerciseName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    paddingTop: 6,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  helpButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  helpButtonDisabled: {
    opacity: 0.75,
  },
  helpButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 24,
  },
  exerciseStats: {
    fontSize: 16,
    marginTop: 8,
  },
});
