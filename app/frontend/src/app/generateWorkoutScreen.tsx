import React from 'react';
import { View, Text } from  '@/components/Themed';
import ForgeButton from '@/components/ForgeButton';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { api } from '@/core/api';
import { ActivityIndicator } from 'react-native';

  export default function GenerateWorkoutScreen() {
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
            setError((e instanceof Error) ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Which Workout Would You Like?</Text>
      {loading
      ? <ActivityIndicator />
      : <ForgeButton text="Generate Generic Quick Workout" onPress={() => handleGenerateQuickWorkout()} />
      }
      <ForgeButton text="Generate Workout for Muscle" onPress={() => router.push('/GenerateWorkoutforMuscle')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});