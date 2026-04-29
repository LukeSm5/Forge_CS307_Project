import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import ForgeButton from "@/components/ForgeButton";
import { Text, View, useScheme } from "@/components/Themed";
import { api } from "@/core/api";

export default function GenerateWorkoutScreen() {
  const router = useRouter();
  const s = useScheme();
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

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: s.background }]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Generate Workout</Text>

          <View
            style={[styles.card, { backgroundColor: s.secondaryBackground }]}
          >
            <Text style={styles.subHeader}>Generate Quick Workout</Text>
            <Text style={[styles.subtitle, { color: s.secondaryText }]}>
              Given your submitted onboarding details, have a quick workout
              generated for you if you are running low on time.
            </Text>

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
                text="Generate Generic Quick Workout"
                onPress={handleGenerateQuickWorkout}
                style={styles.primaryButton}
              />
            )}
          </View>

          <View
            style={[styles.card, { backgroundColor: s.secondaryBackground }]}
          >
            <Text style={styles.subHeader}>Generate Quick Muscle Workout</Text>
            <Text style={[styles.subtitle, { color: s.secondaryText }]}>
              Select muscle groups, or a full body workout, and have a workout
              generated for you to successfully hit those muscles.
            </Text>

            <ForgeButton
              text="Generate Workout for Muscle"
              onPress={() => router.push("./GenerateWorkoutforMuscle")}
              style={styles.primaryButton}
            />
          </View>

          <ForgeButton
            text="Back"
            onPress={() => router.push("./(tabs)/workout")}
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
    gap: 10,
  },
  subHeader: {
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    marginTop: 8,
    alignSelf: "center",
  },
  backButton: {
    width: 140,
    alignSelf: "flex-start",
    marginTop: 8,
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
