import React from 'react';
import { View, Text, } from '@/components/Themed';
import ForgeButton from '@/components/ForgeButton';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/core/api';
import { ActivityIndicator } from 'react-native';

export default function GenerateQuickWorkout() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    async function handleGenerateQuickWorkout() {
        setLoading(true);
        setError(null);
        try {
            const workout = await api.quickWorkout();
            router.push({ pathname: '/LogGeneratedWorkout', 
                params: { workout_name: workout.workout, 
                    exercises: JSON.stringify(workout.exercises) 
                } 
                
            });
        } catch (e) {
            setError(e.message ?? 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }
    return (
        <View style={styles.container}>
            {error && <Text style={styles.error}>{error}</Text>}
            {loading
            ? <ActivityIndicator />
            : <ForgeButton text="Generate Quick Workout" onPress={handleGenerateQuickWorkout} />
            }
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
});