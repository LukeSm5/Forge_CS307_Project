import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api, WorkoutLookup } from '@/core/api';
import ForgeButton from '@/components/ForgeButton';

export default function GenerateWorkoutScreen() {
  const [workouts, setWorkouts] = useState<WorkoutLookup[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);

  useEffect(() => {
    api.getWorkouts().then(setWorkouts).catch(() => setWorkouts([]));
  }, []);

  return (
    <View>
        <Text style={styles.sectionTitle}>Muscle group</Text>
            <View style={styles.rowWrap}>
                {workouts.map((w) => (
                    <ForgeButton
                        key={w.workout_id}
                        text={w.name}
                        compact
                        theme={selectedWorkoutId === w.workout_id ? 'primary' : 'neutral'}
                        onPress={() => setSelectedWorkoutId(w.workout_id)}
                        style={styles.muscleBtn}
                    />
                ))}
            </View>
    </View>
    );
    }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  muscleBtn: {
    minWidth: 92,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
   rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});