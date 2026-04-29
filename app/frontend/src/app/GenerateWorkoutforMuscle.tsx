import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";

import { Text, View, useScheme } from "@/components/Themed";
import ForgeButton from "@/components/ForgeButton";
import { api, WorkoutLookup } from "@/core/api";

export default function GenerateWorkoutforMuscle() {
    const router = useRouter();
    const [workouts, setWorkouts] = useState<WorkoutLookup[]>([]);
    const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const s = useScheme();

    useEffect(() => {
        async function loadWorkouts() {
            try {
                const workoutRows = await api.getWorkouts();
                setWorkouts(workoutRows);
            } catch {
                setWorkouts([]);
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
      setError("Please select a muscle group");
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
        <View style={styles.container}>
          <Text style={styles.title}>Generate Workout for Muscle</Text>
          <View style={styles.divider}>
                      <Text style={styles.description}>Select up to 4 muscle groups (or full body) to generate a workout specifically targeting the muscle groups that are explicitly stated</Text>
            <Text style={styles.sectionTitle}>Muscle group</Text>

                    <View style={styles.rowWrap}>
                      {workouts.map((w) => (
                        <ForgeButton
                          key={w.workout_id}
                          text={w.name}
                          compact
            color={
              selectedWorkoutIds.includes(w.workout_id)
                ? s.buttonBg
                : s.neutralColor
            }
                          onPress={() => handleSelect(w.workout_id)}
                          style={styles.muscleBtn}
                        />
                      ))}
                </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <ForgeButton
          text="Generate Quick Workout"
          onPress={handleGenerateWorkoutForMuscle}
          style = {{width: 300, alignContent: "center", marginLeft: 65}}
        />
      )}
        <ForgeButton
          text = "Back"
          onPress = {() => router.push("/GenerateWorkoutScreen")}
          style = {{width: 100, marginTop:375, marginLeft: 20}}
        />
        </View>
        </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
    marginTop: 30,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    },
    sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center"
    },
    description: {
      fontSize: 16,
      textAlign: "center",
      marginTop: 10,
    },
    muscleBtn: {
    minWidth: 92,
    },
    rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  divider: {
    height: 3,
    backgroundColor: "#ccc",
    marginTop: 5, 
    marginBottom: 5,
  },
});
