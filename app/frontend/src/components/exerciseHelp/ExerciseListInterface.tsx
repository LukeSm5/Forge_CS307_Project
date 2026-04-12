import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import ForgeButton from "@/components/ForgeButton";
import { Separator, Text, View } from "@/components/Themed";
import { api, ExerciseHelp } from "@/core/api";

type ExerciseListInterfaceProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

type ExerciseListItem = {
  id: number;
  name: string;
};

export default function ExerciseListInterface({
  visible,
  setVisible,
}: ExerciseListInterfaceProps) {
  const [exerciseMap, setExerciseMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseListItem | null>(null);
  const [helpData, setHelpData] = useState<ExerciseHelp | null>(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;

    async function loadExercises() {
      try {
        setLoading(true);
        setError(null);

        const exercises = await api.getExercises();

        if (isMounted) {
          setExerciseMap(exercises);
        }
      } catch (err) {
        if (isMounted) {
          setError("Unable to load exercises right now.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadExercises();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  const exercises = useMemo<ExerciseListItem[]>(() => {
    return Object.entries(exerciseMap)
      .map(([name, id]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exerciseMap]);

  async function openHelp(exercise: ExerciseListItem) {
    try {
      setSelectedExercise(exercise);
      setHelpLoading(true);
      setHelpError(null);
      setHelpData(null);

      const result = await api.getExerciseHelp(exercise.id);
      setHelpData(result);
    } catch (err) {
      setHelpError("Unable to load exercise help right now.");
    } finally {
      setHelpLoading(false);
    }
  }

  function closeAll() {
    setSelectedExercise(null);
    setHelpData(null);
    setHelpError(null);
    setVisible(false);
  }

  function backToList() {
    setSelectedExercise(null);
    setHelpData(null);
    setHelpError(null);
  }

  if (!visible) return null;

  const showingHelp = selectedExercise !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        if (showingHelp) {
          backToList();
        } else {
          closeAll();
        }
      }}
    >
      <View style={styles.container}>
        {!showingHelp ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Exercises</Text>
              <Text style={styles.subtitle}>
                Tap the question mark next to an exercise to view instructions.
              </Text>
            </View>

            <Separator />

            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" />
                <Text style={styles.statusText}>Loading exercises...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContent}>
                <Text style={styles.statusText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={exercises}
                keyExtractor={(item) => `${item.id}`}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{item.name}</Text>

                    <TouchableOpacity
                      style={styles.helpButton}
                      onPress={() => openHelp(item)}
                    >
                      <Text style={styles.helpButtonText}>?</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.centerContent}>
                    <Text style={styles.statusText}>
                      No exercises were found.
                    </Text>
                  </View>
                }
              />
            )}

            <ForgeButton
              text="Close Exercises"
              onPress={closeAll}
              style={styles.closeButton}
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>{selectedExercise.name}</Text>
            <Text style={styles.subtitle}>Step-by-step exercise help</Text>

            <Separator />

            {helpLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" />
                <Text style={styles.statusText}>Loading instructions...</Text>
              </View>
            ) : helpError ? (
              <View style={styles.centerContent}>
                <Text style={styles.statusText}>{helpError}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.scrollContent}>
                {helpData?.steps.map((step, index) => (
                  <View
                    key={`${helpData.exercise_id}-${index}`}
                    style={styles.stepCard}
                  >
                    <Text style={styles.stepNumber}>Step {index + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}

                {!!helpData?.advice && (
                  <View style={styles.fullAdviceCard}>
                    <Text style={styles.fullAdviceTitle}>
                      Full instructions
                    </Text>
                    <Text style={styles.fullAdviceText}>{helpData.advice}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <ForgeButton
              text="Back to Exercises"
              onPress={backToList}
              style={styles.closeButton}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: "100%",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.25)",
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  helpButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f80ed",
  },
  helpButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 12,
  },
  stepCard: {
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.25)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },
  stepText: {
    fontSize: 16,
    lineHeight: 22,
  },
  fullAdviceCard: {
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.25)",
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  fullAdviceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fullAdviceText: {
    fontSize: 15,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: 12,
  },
});
