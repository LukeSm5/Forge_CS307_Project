import React from "react";
import { View, Text } from "@/components/Themed";
import ForgeButton from "@/components/ForgeButton";
import { useRouter, Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { api } from "@/core/api";
import { ActivityIndicator } from "react-native";

export default function GenerateWorkoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  async function handleGenerateQuickWorkout() {
    setLoading(true);
    setError(null);
    try {
      const workout = await api.quickWorkout();
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
        <Text style={styles.title}>Generate AI Workout</Text>
        <View style={styles.divider}>
        <Text style={styles.subHeader}> Generate Quick Workout</Text>
        <Text style={styles.subtitle}>Given your submitted onboarding details, have a quick workout generated for you if you are running low on time. </Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <ForgeButton
            text="Generate Generic Quick Workout"
            onPress={() => handleGenerateQuickWorkout()}
            style = {{width: 300, alignContent: "center", marginLeft: 65}}
          />
        )}
        <View style={styles.divider}>
          <Text style={styles.subHeader}>Generate Quick Muscle Workout</Text>
          <Text style={styles.subtitle}>Select muscle groups, or a full body workout, and have a workout generated for you to successfully hit those muscles</Text>
          <ForgeButton
          text="Generate Workout for Muscle"
          onPress={() => router.push("./GenerateWorkoutforMuscle")}
          style = {{width: 300, alignContent: "center", marginLeft: 65}}
        />
        <ForgeButton
          text = "Back"
          onPress = {() => router.push("./(tabs)/workout")}
          style = {{width: 100, marginTop:450, marginLeft: 20}}
          />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  divider: {
    height: 3,
    backgroundColor: "#ccc",
    marginTop: 5, 
    marginBottom: 5,
  },
  title: {
    marginTop: 30,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginLeft: 20,
    marginRight: 20,
    marginTop: 5,
  },
  subHeader: {
    fontSize: 21,
    textAlign: "center",
    fontWeight:"bold",
    marginTop: 5,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});
