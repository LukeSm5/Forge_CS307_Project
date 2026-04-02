import React from 'react';
import { View, Text, } from '@/components/Themed';
import ForgeButton from '@/components/ForgeButton';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function GenerateQuickWorkout() {
    const router = useRouter();
    function handleGenerateQuickWorkout() {
        
    }
    return (
        <View style={styles.container}>
            <ForgeButton text="Log Generated Workout" onPress={() => router.push('/(tabs)/workout')} />
            <ForgeButton text="Cancel" onPress={() => router.push('/(tabs)/workout')} />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});