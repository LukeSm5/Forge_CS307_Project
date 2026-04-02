import { useEffect, useMemo, useState, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';

import ForgeButton from '@/components/ForgeButton';
import { Text, View } from '@/components/Themed';
import { api, MachineLookupRow, WorkoutLookup, SessionLog } from '@/core/api';
import { useUnits } from '@/core/conversions';

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

  const [splitName, setSplitName] = useState('');
  const [workouts, setWorkouts] = useState<WorkoutLookup[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);

  const [exerciseMapping, setExerciseMapping] = useState<Record<string, number>>({});
  const [machines, setMachines] = useState<MachineLookupRow[]>([]);

  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const [exerciseList, setExerciseList] = useState<SingleExercise[]>([]);
  const [saving, setSaving] = useState(false);

  const [sessionDate, setSessionDate] = useState(formatToday());
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('0');
  const [allSessions, setAllSessions] = useState<SessionLog[]>([]);
  const [showSplitSuggestions, setShowSplitSuggestions] = useState(false);
  const { isImperial } = useUnits();

  // moving timer from workout
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const baseElapsedRef = useRef<number>(0);


  useEffect(() => {
    async function loadLookupData() {
      try {
        const [exerciseRows, machineRows, workoutRows, sessionRows] = await Promise.all([
          api.getExercises(),
          api.getMachines(),
          api.getWorkouts(),
          api.getWorkoutHistory(),
        ]);

        setExerciseMapping(exerciseRows);
        setMachines(machineRows);
        setWorkouts(workoutRows);
        setAllSessions(sessionRows);
      } catch {
        setExerciseMapping({});
        setMachines([]);
        setWorkouts([]);
        setAllSessions([]);
      }
    }

    void loadLookupData();
  }, []);

  // moving timer from workout.tsx
  useEffect(() => {
    if (!timerRunning || !startedAtMs) return;

    const intervalId = setInterval(() => {
      const delta = Math.floor((Date.now() - startedAtMs) / 1000);
      setElapsedSeconds(baseElapsedRef.current + delta);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerRunning, startedAtMs]);


  const exerciseOptions = useMemo(
    () =>
      Object.keys(exerciseMapping).map((key) => ({
        label: key,
        value: key,
      })),
    [exerciseMapping]
  );

  const splitSuggestions = useMemo(() => {
    const normalizedSplit = splitName.trim().toLowerCase();
    const selectedDate = sessionDate.trim();

    return allSessions.filter((session) => {
      const sameDate = isoToDisplayDate(session.date) === selectedDate;
      if (!sameDate) return false;

      if (!normalizedSplit) return true;

      const split = (session.split_name ?? '').toLowerCase();
      const workout = session.workout_name.toLowerCase();

      return split.includes(normalizedSplit) || workout.includes(normalizedSplit);
    });
  }, [allSessions, sessionDate, splitName]);

  function addExercise() {
    if (!selectedExerciseName || selectedMachineId == null || !sets || !reps) {
      Alert.alert('Missing info', 'Fill exercise, machine, sets, and reps.');
      return;
    }

    const parsedWeight = weight ? (isImperial ? Number(weight) : Math.round(Number(weight) * 2.20462)): 0;
    const parsedSets = Number(sets);
    const parsedReps = Number(reps);

    if (!Number.isFinite(parsedSets) || !Number.isFinite(parsedReps)) {
      Alert.alert('Invalid values', 'Sets and reps must be numbers.');
      return;
    }

    const selectedMachine = machines.find((m) => m.machine_id === selectedMachineId);
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

    if (!splitName.trim()) {
      Alert.alert('Missing split name', 'Enter a split name.');
      return;
    }

    if (selectedWorkoutId == null) {
      Alert.alert('No muscle group', 'Select a muscle group.');
      return;
    }

    if (exerciseList.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before logging.');
      return;
    }

    setSaving(true);
    try {
      const apiDate = displayDateToApiDate(sessionDate.trim());
      if (!apiDate) {
        Alert.alert('Invalid date', 'Enter date as MM/DD/YYYY.');
        return;
      }

      const mins = Number(durationMinutes || '0');
      const secs = Number(durationSeconds || '0');
      const parsedDuration =
        durationMinutes.trim() === '' ? null : Math.round((mins * 60) + secs);

      if (parsedDuration != null && !Number.isFinite(parsedDuration)) {
        Alert.alert('Invalid duration', 'Duration must be a number of minutes.');
        return;
      }

      await api.addWorkoutLog({
        workout_id: selectedWorkoutId,
        duration: parsedDuration,
        date: apiDate,
        split_name: splitName.trim(),
        exercises: exerciseList.map((ex) => ({
          exercise_id: exerciseMapping[ex.name] ?? 1,
          machine_id: ex.machine_id,
          weight: ex.weight,
          sets: ex.sets,
          reps: ex.reps,
        })),
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

  function formatToday() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  function formatDateInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  // moving timer from workout.tsx
  function formatElapsed(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function isoToDisplayDate(iso: string) {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  function displayDateToApiDate(value: string) {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, mm, dd, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  // moving timer handleStartWorkout handleEndWorkout from workout.tsx 
  function handleToggleTimer() {
    if (timerRunning) {
      if (startedAtMs != null) {
        baseElapsedRef.current += Math.floor((Date.now() - startedAtMs) / 1000);
      }
      setStartedAtMs(null);
      setTimerRunning(false);
    } else {
      setStartedAtMs(Date.now());
      setTimerRunning(true);
    }
  }

  function handleSaveTimerToDuration() {
    const totalMins = Math.floor(elapsedSeconds / 60);
    const remainingSecs = elapsedSeconds % 60;
    setDurationMinutes(String(totalMins));
    setDurationSeconds(String(remainingSecs));
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Log Workout</Text>

        <Text style={styles.label}>Date and split</Text>
          <View style={styles.row}>
            <View style={styles.dateBox}>
              <TextInput
                style={styles.input}
                value={sessionDate}
                onChangeText={(value) => setSessionDate(formatDateInput(value))}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.splitBox}>
              <TextInput
                style={styles.input}
                value={splitName}
                onChangeText={(value) => {
                  setSplitName(value);
                  setShowSplitSuggestions(true);
                }}
                onFocus={() => setShowSplitSuggestions(true)}
                placeholder="e.g. Pull Day"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {showSplitSuggestions && splitSuggestions.length > 0 && (
            <View style={styles.suggestionCard}>
              {splitSuggestions.map((session) => (
                <Pressable
                  key={session.session_id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSplitName(session.split_name ?? '');
                    setSessionDate(isoToDisplayDate(session.date));
                    setShowSplitSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionTitle}>
                    {session.split_name ?? 'Unknown Split'}
                  </Text>
                  <Text style={styles.suggestionSubtitle}>
                    {isoToDisplayDate(session.date)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

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
            <Text style={styles.label}>Weight (optional)</Text>
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
              <Text>{`${ex.sets} x ${ex.reps}${ex.weight ? ` @ ${ex.weight} lbs` : ''} (${ex.machine_name})`}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Duration</Text>

          <View style={styles.timerCard}>
            <Text style={styles.timerDisplay}>{formatElapsed(elapsedSeconds)}</Text>
            <View style={styles.timerButtonRow}>
              <ForgeButton
                text={timerRunning ? 'Stop Timer' : (elapsedSeconds > 0 ? 'Resume Timer' : 'Start Timer')}
                theme={timerRunning ? 'danger' : 'primary'}
                compact
                style={styles.timerToggleBtn}
                onPress={handleToggleTimer}
              />
              <ForgeButton
                text="Save to Duration"
                theme="success"
                compact
                style={styles.timerToggleBtn}
                onPress={handleSaveTimerToDuration}
                disabled={elapsedSeconds === 0}
              />
            </View>
          </View>

          <Text style={styles.label}>Or enter manually</Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Minutes</Text>
                <TextInput
                  style={styles.input}
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                  keyboardType="number-pad"
                  placeholder="45"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Seconds</Text>
                <TextInput
                  style={styles.input}
                  value={durationSeconds}
                  onChangeText={setDurationSeconds}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

        <ForgeButton
          text={saving ? 'Saving...' : 'Log Workout'}
          onPress={() => { void handleSave(); }}
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
  muscleBtn: {
    minWidth: 92,
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

  dateBox: {
    flex: 1,
  },
  splitBox: {
    flex: 1.4,
  },
  suggestionCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  timerCard: {
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  timerDisplay: {
    fontSize: 44,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 2,
  },
  timerButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timerToggleBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
});
