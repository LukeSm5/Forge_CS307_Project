import React from 'react';
import WorkoutTrackingButton from '@/components/workoutTracking/workoutTrackingButton';
import { StyleSheet, View, Text } from 'react-native';

const WorkoutTrackingScreen = () => {
    const [setSetCount, setNewSetCount] = React.useState('');
    const [setWeight, setNewWeight] = React.useState('');
    const [setReps, setNewReps] = React.useState('');
    const [setWorkout, setNewWorkout] = React.useState('');

    return (
        <View style = {styles.container}>
            <Text style={styles.title}>Workout Tracking Screen</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 30,
        fontWeight: 'bold',
    }
});

export default WorkoutTrackingScreen;