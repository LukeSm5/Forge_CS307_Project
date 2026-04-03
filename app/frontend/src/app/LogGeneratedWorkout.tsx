import React from 'react';
import { View, Text } from '@/components/Themed';
import ForgeButton from '@/components/ForgeButton';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { QuickWorkoutResponse } from '@/core/api';
import AltMachButton from '@/components/machineAlternatives/AltMachButton';

export default function LogGeneratedWorkout() {
    const router = useRouter();
    const { workout_name, exercises: exercisesJson } = useLocalSearchParams<{
        workout_name: string;
        exercises: string;
    }>();

    const exercises: QuickWorkoutResponse['exercises'] = exercisesJson 
        ? JSON.parse(exercisesJson) 
        : [];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{workout_name}</Text>
            <ScrollView>
                {exercises.map((ex, i) => (
                    <View key={i} style={styles.exercise}>
                        <View style={styles.exerciseRow}>
                            <Text style={styles.exerciseName}>{ex.exercise}</Text>
                            <AltMachButton exercise={ex.exercise} />
                        </View>
                        <Text>{ex.sets} sets x {ex.reps} reps @ {ex.weight} lbs</Text>
                    </View>
                ))}
            </ScrollView>
            <ForgeButton text="Log Generated Workout" onPress={() => router.push('/(tabs)/workout')} />
            <ForgeButton text="Cancel" onPress={() => router.push('/(tabs)/workout')} />
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
        fontWeight: 'bold',
        marginBottom: 16,
    },
    exercise: {
        marginBottom: 12,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: '600',
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});