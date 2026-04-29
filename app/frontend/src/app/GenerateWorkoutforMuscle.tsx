import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import ForgeButton from "@/components/ForgeButton";
import { Text, View, useScheme } from "@/components/Themed";
import { api, WorkoutLookup } from "@/core/api";

export default function GenerateWorkoutforMuscle() {
  const router = useRouter();
  const s = useScheme();
  const [workouts, setWorkouts] = useState<WorkoutLookup[]>([]);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkouts() {
      setLoadingWorkouts(true);
      setError(null);

      try {
        const workoutRows = await api.getWorkouts();
        setWorkouts(workoutRows);
      } catch (e) {
        setWorkouts([]);
        setError(
          e instanceof Error ? e.message : "Could not load muscle groups",
        );
      } finally {
        setLoadingWorkouts(false);
      }
    }

    loadWorkouts();
  }, []);

  function handleSelect(workoutId: number) {
    const selectedWorkout = workouts.find((w) => w.workout_id === workoutId);
    const isFullBody = selectedWorkout?.name
      .toLowerCase()
      .includes("full body");

    setSelectedWorkoutIds((prev) => {
      const alreadySelected = prev.includes(workoutId);

      if (alreadySelected) {
        setError(null);
        return prev.filter((id) => id !== workoutId);
      }

      if (isFullBody) {
        setError(null);
        return [workoutId];
      }

      const fullBodyWorkout = workouts.find((w) =>
        w.name.toLowerCase().includes("full body"),
      );
      const fullBodySelected =
        fullBodyWorkout && prev.includes(fullBodyWorkout.workout_id);

      if (fullBodySelected) {
        setError(null);
        return [workoutId];
      }

      if (prev.length >= 4) {
        setError("You can only select up to 4 muscle groups");
        return prev;
      }

      setError(null);
      return [...prev, workoutId];
    });
  }

  async function handleGenerateWorkoutForMuscle() {
    if (selectedWorkoutIds.length === 0) {
      setError("Please select at least one muscle group");
      return;
    }

    const selectedMuscles = workouts
      .filter((w) => selectedWorkoutIds.includes(w.workout_id))
      .map((w) => w.name.toLowerCase());

    setLoading(true);
    setError(null);

    try {
      const workout = await api.quickMuscleWorkout({
        muscles: selectedMuscles,
      });

      router.push({
        pathname: "./LogGeneratedWorkout",
        params: {
          workout_name: workout.workout,
          exercises: JSON.stringify(workout.exercises),
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: "Back",
          headerShown: false,
        }}
      />

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: s.background }]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Generate Workout for Muscle</Text>

          <View
            style={[styles.card, { backgroundColor: s.secondaryBackground }]}
          >
            <Text style={styles.sectionTitle}>Choose Muscle Groups</Text>
            <Text style={[styles.description, { color: s.secondaryText }]}>
              Select up to 4 muscle groups, or choose full body, to generate a
              targeted workout.
            </Text>

            {loadingWorkouts ? (
              <View
                style={[
                  styles.loadingBox,
                  { backgroundColor: s.secondaryBackground },
                ]}
              >
                <ActivityIndicator />
                <Text style={[styles.loadingText, { color: s.secondaryText }]}>
                  Loading muscle groups...
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.rowWrap,
                  { backgroundColor: s.secondaryBackground },
                ]}
              >
                {workouts.map((w) => {
                  const selected = selectedWorkoutIds.includes(w.workout_id);

                  return (
                    <ForgeButton
                      key={w.workout_id}
                      text={w.name}
                      compact
                      color={selected ? s.buttonBg : s.neutralColor}
                      onPress={() => handleSelect(w.workout_id)}
                      style={styles.muscleButton}
                    />
                  );
                })}
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loading ? (
              <View
                style={[
                  styles.loadingBox,
                  { backgroundColor: s.secondaryBackground },
                ]}
              >
                <ActivityIndicator />
                <Text style={[styles.loadingText, { color: s.secondaryText }]}>
                  Generating workout...
                </Text>
              </View>
            ) : (
              <ForgeButton
                text="Generate Workout"
                onPress={handleGenerateWorkoutForMuscle}
                disabled={loadingWorkouts}
                style={styles.primaryButton}
              />
            )}
          </View>

          <ForgeButton
            text="Back"
            onPress={() => router.push("/GenerateWorkoutScreen")}
            style={styles.backButton}
            color={s.neutralColor}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  muscleButton: {
    minWidth: 96,
    maxWidth: 150,
    flexGrow: 1,
  },
  primaryButton: {
    width: "100%",
    alignSelf: "center",
    marginTop: 4,
  },
  backButton: {
    width: 140,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },
  error: {
    color: "red",
    fontSize: 15,
    textAlign: "center",
  },
});
