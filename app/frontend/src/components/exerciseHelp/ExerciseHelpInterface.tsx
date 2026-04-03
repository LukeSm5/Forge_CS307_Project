import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet } from "react-native";

import ForgeButton from "@/components/ForgeButton";
import { Text, View } from "@/components/Themed";
import { api, ExerciseHelp } from "@/core/api";

type ExerciseHelpInterfaceProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  exerciseId: number | null;
  exerciseName: string;
};

export default function ExerciseHelpInterface({
  visible,
  setVisible,
  exerciseId,
  exerciseName,
}: ExerciseHelpInterfaceProps) {
  const [helpData, setHelpData] = useState<ExerciseHelp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || exerciseId === null) return;

    let isMounted = true;

    async function loadHelp() {
      try {
        setLoading(true);
        setError(null);
        setHelpData(null);

        const result = await api.getExerciseHelp(exerciseId);

        if (isMounted) {
          setHelpData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError("Unable to load exercise help right now.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHelp();

    return () => {
      isMounted = false;
    };
  }, [visible, exerciseId]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{exerciseName}</Text>
        <Text style={styles.subtitle}>Step-by-step exercise help</Text>

        <View
          style={styles.separator}
          lightColor="#eee"
          darkColor="rgba(255,255,255,0.1)"
        />

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <Text style={styles.statusText}>Loading instructions...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.statusText}>{error}</Text>
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
                <Text style={styles.fullAdviceTitle}>Full instructions</Text>
                <Text style={styles.fullAdviceText}>{helpData.advice}</Text>
              </View>
            )}
          </ScrollView>
        )}

        <ForgeButton
          text="Back to Exercises"
          onPress={() => setVisible(false)}
          style={styles.closeButton}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
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
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
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
