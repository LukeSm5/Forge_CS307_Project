import React from 'react';
import { View, Text } from  '@/components/Themed';
import ForgeButton from '@/components/ForgeButton';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function GenerateWorkoutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Which Workout Would You Like?</Text>
      <ForgeButton text="Generate Generic Quick Workout" onPress={() => router.push('/GenerateQuickWorkout')} />
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
});