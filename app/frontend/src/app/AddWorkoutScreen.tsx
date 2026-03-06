import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';

import ForgeButton from '@/components/ForgeButton';
import { Text, View } from '@/components/Themed';
import { api, CreateWorkoutLogExercise, MachineLookupRow } from '@/core/api';

type SingleExercise = {
  name: string;
  machine_id: number;
  machine_name: string;
  weight: number;
  sets: number;
  reps: number;
};

export default function AddWorkoutScreen() {
  const router = useRouter();
  const profileId = Number(process.env.EXPO_PUBLIC_PROFILE_ID ?? '1');

  const [workoutName, setWorkoutName] = useState('');
  const [exerciseMapping, setExerciseMapping] = useState<Record<string, number>>({});
  const [machines, setMachines] = useState<MachineLookupRow[]>([]);

  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const [exerciseList, setExerciseList] = useState<SingleExercise[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadLookupData() {
      try {
        const [exerciseRows, machineRows] = await Promise.all([
          api.getExercises(),
          api.getMachines(),
        ]);
        setExerciseMapping(exerciseRows);
        setMachines(machineRows);
      } catch {
        setExerciseMapping({});
        setMachines([]);
      }
    }

    void loadLookupData();
  }, []);

  const exerciseOptions = useMemo(
    () =>
      Object.keys(exerciseMapping).map((key) => ({
        label: key,
        value: key,
      })),
    [exerciseMapping]
  );

  function addExercise() {
    if (!selectedExerciseName || selectedMachineId == null || !weight || !sets || !reps) {
      Alert.alert('Missing info', 'Fill exercise, machine, weight, sets, and reps.');
      return;
    }

    const parsedWeight = Number(weight);
    const parsedSets = Number(sets);
    const parsedReps = Number(reps);

    if (!Number.isFinite(parsedWeight) || !Number.isFinite(parsedSets) || !Number.isFinite(parsedReps)) {
      Alert.alert('Invalid values', 'Weight, sets, and reps must be numbers.');
      return;
    }

    const selectedMachine = machines.find((machine) => machine.machine_id === selectedMachineId);
    if (!selectedMachine) {
      Alert.alert('Invalid machine', 'Please select a valid machine.');
      return;
    }

    setExerciseList((prev) => [
      ...prev,
      {
        name: selectedExerciseName,
        machine_id: selectedMachine.machine_id,
        machine_name: selectedMachine.name,
        weight: parsedWeight,
        sets: parsedSets,
        reps: parsedReps,
      },
    ]);

    setSelectedExerciseName('');
    setSelectedMachineId(null);
    setWeight('');
    setSets('');
    setReps('');
  }

  async function handleSave() {
    if (saving) return;

    if (!workoutName.trim()) {
      Alert.alert('Missing workout name', 'Enter a workout name.');
      return;
    }

    if (exerciseList.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before logging.');
      return;
    }

    setSaving(true);
    try {
      const exercises: CreateWorkoutLogExercise[] = exerciseList.map((ex) => ({
        exercise_id: exerciseMapping[ex.name] ?? 1,
        machine_id: ex.machine_id,
        weight: ex.weight,
        sets: ex.sets,
        reps: ex.reps,
      }));

      await api.addWorkoutLog({
        profile_id: profileId,
        workout_name: workoutName.trim(),
        exercises,
      });

      Alert.alert('Workout logged', 'Workout saved successfully.');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save workout.';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Log Workout</Text>

        <Text style={styles.label}>Workout name</Text>
        <TextInput
          style={styles.input}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="e.g. Push Day"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.sectionTitle}>Add exercise</Text>

        <Text style={styles.label}>Exercise</Text>
        <Dropdown
          style={styles.dropdown}
          data={exerciseOptions}
          labelField="label"
          valueField="value"
          value={selectedExerciseName}
          placeholder="Select exercise"
          onChange={(item) => setSelectedExerciseName(item.value)}
        />

        <Text style={styles.label}>Machine</Text>
        <View style={styles.rowWrap}>
          {machines.map((machine) => (
            <ForgeButton
              key={machine.machine_id}
              text={machine.name}
              compact
              theme={selectedMachineId === machine.machine_id ? 'primary' : 'neutral'}
              onPress={() => setSelectedMachineId(machine.machine_id)}
              style={styles.machineBtn}
            />
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Sets</Text>
            <TextInput
              style={styles.input}
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <Text style={styles.label}>Reps</Text>
        <TextInput
          style={styles.input}
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          placeholder="10"
          placeholderTextColor="#94a3b8"
        />

        <ForgeButton text="Add Exercise" onPress={addExercise} theme="teal" />

        <Text style={styles.sectionTitle}>Current exercises</Text>
        {exerciseList.length === 0 ? (
          <Text style={styles.empty}>No exercises added</Text>
        ) : (
          exerciseList.map((ex, idx) => (
            <View key={`${ex.name}-${idx}`} style={styles.card}>
              <Text style={styles.cardTitle}>{ex.name}</Text>
              <Text>{`${ex.sets} x ${ex.reps} @ ${ex.weight} lbs (${ex.machine_name})`}</Text>
            </View>
          ))
        )}

        <ForgeButton
          text={saving ? 'Saving...' : 'Log Workout'}
          onPress={() => {
            void handleSave();
          }}
          theme="success"
          disabled={saving}
        />
        <ForgeButton text="Back" onPress={() => router.back()} theme="neutral" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
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
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  machineBtn: {
    minWidth: 92,
  },
  empty: {
    color: '#64748b',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
});
