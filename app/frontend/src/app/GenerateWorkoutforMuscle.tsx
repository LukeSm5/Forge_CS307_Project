import React, { useEffect } from 'react';
import { View, Text, } from '@/components/Themed';
import ForgeButton from '@/components/ForgeButton';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api, WorkoutLookup } from '@/core/api';

export default function GenerateWorkoutforMuscle() {
    const router = useRouter();
    const [workouts, setWorkouts] = useState<WorkoutLookup[]>([]);
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
    /* function handleSelect(workoutId: number) {
        const selectedWorkout = workouts.find(w => w.workout_id === workoutId);
        const isFullBody = selectedWorkout?.name.toLowerCase().includes('full body');

        setSelectedWorkoutId(prev => {
        const alreadySelected = prev.includes(workoutId);
        if (alreadySelected) {
            return prev.filter(id => id !== workoutId);
        } 
        if (isFullBody) {
            return [workoutId];
        }
        const fullBodyWorkout = workouts.find(w => w.name.toLowerCase().includes('full body'));
        const fullBodySelected = fullBodyWorkout && prev.includes(fullBodyWorkout.workout_id);
        if (fullBodySelected) {
            return [workoutId];
        }
        if (prev.length >= 4) {
            return prev;
        }
        return [...prev, workoutId];

    });
        
    } */
        async function handleGenerateWorkoutForMuscle() {
            const selectedMuscle = workouts.find(w => w.workout_id === selectedWorkoutId)?.name.toLowerCase(); 
            if (!selectedMuscle) {
                setError('Please select a muscle group');
            }
            setLoading(true);
            setError(null);
            try {
                const workout = await api.quickMuscleWorkout({ muscle: selectedMuscle }); 
                alert(JSON.stringify(workout));
                router.push({ pathname: '/LogGeneratedWorkout', 
                    params: { workout_name: workout.workout, 
                        exercises: JSON.stringify(workout.exercises) 
                    } 
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Something went wrong');
            } finally {
                setLoading(false);
            }
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
            {error && <Text style={styles.error}>{error}</Text>}
            {loading ? 
            <ActivityIndicator /> :
            <ForgeButton text="Generate Quick Workout" onPress={handleGenerateWorkoutForMuscle} />
            }
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
  error: {
        color: 'red',
        marginBottom: 10,
  },
});