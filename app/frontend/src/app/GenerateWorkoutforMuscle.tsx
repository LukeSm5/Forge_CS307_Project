import React, { useEffect } from 'react';
import { View, Text, } from '@/components/Themed';
import ForgeButton from '@/components/ForgeButton';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api, WorkoutLookup } from '@/core/api';

export default function GenerateQuickWorkout() {
    const router = useRouter();
    const [workouts, setWorkouts] = useState<WorkoutLookup[]>([]);
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);

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
    }), [];
    function handleGenerateQuickWorkout() {
        
    }
    return (
        <View style={styles.container}>
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
            <ForgeButton text="Generate Quick Workout" onPress={() => router.push('/LogGeneratedWorkout')} />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    },
    label: {
    fontSize: 13,
    color: '#475569',
    },
    muscleBtn: {
    minWidth: 92,
    },
    rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});