import { useCallback, useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ForgeButton from '@/components/ForgeButton';
import { Text, View } from '@/components/Themed';
import { api, CreateWorkoutLogExercise, WorkoutExerciseLog, WorkoutLog } from '@/core/api';
import { useRouter } from 'expo-router';
import CardioButton from '@/components/cardioSearch/CardioButton';

type LoggedWorkout = {
  id: string;
  title: string;
  loggedAt: string;
  exercises: WorkoutExerciseLog[];
};

type SessionState = 'idle' | 'running' | 'ended';
type ExerciseDraft = {
  exercise_id: number;
  machine_id: number;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

export default function WorkoutTabScreen() {
  const profileId = Number(process.env.EXPO_PUBLIC_PROFILE_ID ?? '1');
  const [workoutHistory, setWorkoutHistory] = useState<LoggedWorkout[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [runningLogId, setRunningLogId] = useState<string | null>(null);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedByLogSeconds, setElapsedByLogSeconds] = useState<Record<string, number>>({});
  const [sessionStateByLog, setSessionStateByLog] = useState<Record<string, SessionState>>({});
  const [savingLogId, setSavingLogId] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [deleteConfirmLog, setDeleteConfirmLog] = useState<LoggedWorkout | null>(null);
  const [editingLog, setEditingLog] = useState<LoggedWorkout | null>(null);
  const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadWorkoutHistory();
  }, [profileId]);

  useFocusEffect(
    useCallback(() => {
      void loadWorkoutHistory();
    }, [profileId])
  );

  async function loadWorkoutHistory() {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const logsFromApi = await api.getWorkoutHistory(profileId);
      const mapped = logsFromApi.map(mapWorkoutLogToCard);
      setWorkoutHistory(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load workout history.';
      setHistoryError(message);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleLogWorkout() {
    router.push("/AddWorkoutScreen");
  }

  function handleGenerateWorkout() {
    Alert.alert('Generate Workout', 'Workout generation flow will be added in a later stage.');
  }

  function handleStartWorkout(logId: string) {
    if (runningLogId && runningLogId !== logId) {
      Alert.alert('Workout in progress', 'Please end the current workout before starting another.');
      return;
    }

    setRunningLogId(logId);
    setStartedAtMs(Date.now());
    setElapsedByLogSeconds((prev) => ({ ...prev, [logId]: 0 }));
    setSessionStateByLog((prev) => ({ ...prev, [logId]: 'running' }));
  }

  function handleEndWorkout(logId: string) {
    if (runningLogId !== logId) return;
    setRunningLogId(null);
    setStartedAtMs(null);
    setSessionStateByLog((prev) => ({ ...prev, [logId]: 'ended' }));
  }

  async function handleAddToLog(log: LoggedWorkout) {
    if (savingLogId) return;

    setSavingLogId(log.id);
    try {
      const payloadExercises: CreateWorkoutLogExercise[] = log.exercises.map((exercise) => ({
        exercise_id: exercise.exercise_id,
        machine_id: exercise.machine_id,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight ?? null,
        notes: exercise.notes ?? null,
      }));

      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const result = await api.addWorkoutLog({
        profile_id: profileId,
        workout_name: `${log.title} ${timestamp}`,
        exercises: payloadExercises,
      });

      setSessionStateByLog((prev) => ({ ...prev, [log.id]: 'idle' }));
      setElapsedByLogSeconds((prev) => ({ ...prev, [log.id]: 0 }));
      Alert.alert('Added to log', `Saved as "${result.workout_name}"`);
      await loadWorkoutHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add workout log.';
      Alert.alert('Add to log failed', message);
    } finally {
      setSavingLogId(null);
    }
  }

  function handleEditAndAdd(log: LoggedWorkout) {
    setEditingLog(log);
    setExerciseDrafts(
      log.exercises.map((exercise) => ({
        exercise_id: exercise.exercise_id,
        machine_id: exercise.machine_id,
        exercise_name: exercise.exercise_name,
        sets: String(exercise.sets),
        reps: String(exercise.reps),
        weight: exercise.weight != null ? String(exercise.weight) : '',
        notes: exercise.notes ?? '',
      }))
    );
  }

  function updateDraft(index: number, patch: Partial<ExerciseDraft>) {
    setExerciseDrafts((prev) => prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
  }

  async function submitEditedWorkout() {
    if (!editingLog) return;
    if (savingLogId) return;

    for (const exercise of exerciseDrafts) {
      const sets = Number(exercise.sets);
      const reps = Number(exercise.reps);
      if (!Number.isFinite(sets) || sets < 1 || !Number.isFinite(reps) || reps < 1) {
        Alert.alert('Invalid values', 'Sets and reps must be numbers greater than 0.');
        return;
      }
    }

    setSavingLogId(editingLog.id);
    try {
      const payloadExercises: CreateWorkoutLogExercise[] = exerciseDrafts.map((exercise) => ({
        exercise_id: exercise.exercise_id,
        machine_id: exercise.machine_id,
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weight: exercise.weight.trim() ? Number(exercise.weight) : null,
        notes: exercise.notes.trim() || null,
      }));

      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const result = await api.addWorkoutLog({
        profile_id: profileId,
        workout_name: `${editingLog.title} (Edited) ${timestamp}`,
        exercises: payloadExercises,
      });

      setSessionStateByLog((prev) => ({ ...prev, [editingLog.id]: 'idle' }));
      setElapsedByLogSeconds((prev) => ({ ...prev, [editingLog.id]: 0 }));
      setEditingLog(null);
      setExerciseDrafts([]);
      Alert.alert('Added to log', `Saved as "${result.workout_name}"`);
      await loadWorkoutHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add workout log.';
      Alert.alert('Add failed', message);
    } finally {
      setSavingLogId(null);
    }
  }

  function handleDeleteWorkout(log: LoggedWorkout) {
    if (runningLogId === log.id) {
      Alert.alert('Cannot delete', 'Please end the active workout before deleting it.');
      return;
    }
    if (deletingLogId) return;
    setDeleteConfirmLog(log);
  }

  async function confirmDeleteWorkout() {
    if (!deleteConfirmLog) return;
    const log = deleteConfirmLog;

    setDeletingLogId(log.id);
    try {
      await api.deleteWorkoutLog(profileId, Number(log.id));
      if (expandedLogId === log.id) setExpandedLogId(null);
      setDeleteConfirmLog(null);
      await loadWorkoutHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete workout.';
      Alert.alert('Delete failed', message);
    } finally {
      setDeletingLogId(null);
    }
  }

  useEffect(() => {
    if (!runningLogId || !startedAtMs) return;

    const intervalId = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
      setElapsedByLogSeconds((prev) => ({ ...prev, [runningLogId]: elapsedSeconds }));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [runningLogId, startedAtMs]);

  function formatDuration(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredWorkoutHistory = workoutHistory.filter((log) => {
    if (!normalizedSearchQuery) return true;
    const matchesTitle = log.title.toLowerCase().includes(normalizedSearchQuery);
    const matchesExercise = log.exercises.some((exercise) =>
      exercise.exercise_name.toLowerCase().includes(normalizedSearchQuery)
    );
    return matchesTitle || matchesExercise;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Workouts</Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={14} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search workouts"
          placeholderTextColor="#94a3b8"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loadingHistory && <Text style={styles.statusText}>Loading workout history...</Text>}

        {!loadingHistory && historyError && (
          <Text style={styles.errorText}>Could not load workouts: {historyError}</Text>
        )}

        {!loadingHistory && !historyError && workoutHistory.length === 0 && (
          <Text style={styles.statusText}>No workouts added</Text>
        )}

        {!loadingHistory && !historyError && workoutHistory.length > 0 && filteredWorkoutHistory.length === 0 && (
          <Text style={styles.statusText}>No workouts match "{searchQuery.trim()}".</Text>
        )}

        {!loadingHistory && !historyError && filteredWorkoutHistory.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const isRunning = runningLogId === log.id;
          const elapsed = elapsedByLogSeconds[log.id] ?? 0;
          const sessionState = sessionStateByLog[log.id] ?? 'idle';
          return (
            <View key={log.id} style={styles.logCard}>
              <Pressable style={styles.logHeaderRow} onPress={() => setExpandedLogId(isExpanded ? null : log.id)}>
                <View>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={styles.logDate}>{log.loggedAt}</Text>
                </View>
                <FontAwesome name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#64748b" />
              </Pressable>

              {isExpanded && (
                <View style={styles.exerciseList}>
                  <Text style={styles.exerciseHeading}>Exercises in this log</Text>
                  {log.exercises.map((exercise) => (
                    <Text key={`${log.id}-${exercise.exercise_id}-${exercise.machine_id}`} style={styles.exerciseItem}>
                      - {formatExercise(exercise)}
                    </Text>
                  ))}

                  <View style={styles.timerRow}>
                    <View style={styles.leftTimerRow}>
                      <Text style={styles.timerText}>Timer: {formatDuration(elapsed)}</Text>
                      <ForgeButton
                        text={deletingLogId === log.id ? 'Deleting...' : 'Delete'}
                        theme="danger"
                        compact
                        style={styles.deleteButton}
                        onPress={() => {
                          void handleDeleteWorkout(log);
                        }}
                        disabled={deletingLogId === log.id}
                      />
                    </View>
                    {isRunning ? (
                      <ForgeButton
                        text="End"
                        theme="danger"
                        compact
                        style={styles.sessionButton}
                        onPress={() => handleEndWorkout(log.id)}
                      />
                    ) : sessionState === 'ended' ? (
                      <View style={styles.postActionsRow}>
                        <ForgeButton
                          text={savingLogId === log.id ? 'Saving...' : 'Add'}
                          theme="success"
                          compact
                          style={styles.sessionButton}
                          onPress={() => handleAddToLog(log)}
                          disabled={savingLogId === log.id}
                        />
                        <ForgeButton
                          text="Edit & Add"
                          theme="secondary"
                          compact
                          style={styles.sessionButton}
                          onPress={() => handleEditAndAdd(log)}
                        />
                      </View>
                    ) : (
                      <ForgeButton
                        text="Start"
                        theme="primary"
                        compact
                        style={styles.sessionButton}
                        onPress={() => handleStartWorkout(log.id)}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.actionsRow}>
        <ForgeButton text="Log Workout" theme="primary" style={styles.actionButton} onPress={handleLogWorkout} />
        <ForgeButton text="Generate Workout" theme="teal" style={styles.actionButton} onPress={handleGenerateWorkout} />
      </View>
      <View style={styles.actionsRow}>
        <CardioButton />
      </View>

      <Modal visible={!!editingLog} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingLog?.title}</Text>
            <Text style={styles.modalSubtitle}>Edit exercises, then add this workout log.</Text>

            <ScrollView style={styles.modalScroll}>
              {exerciseDrafts.map((draft, index) => (
                <View key={`${draft.exercise_id}-${draft.machine_id}-${index}`} style={styles.modalExerciseCard}>
                  <Text style={styles.exerciseCardTitle}>{draft.exercise_name}</Text>

                  <View style={styles.twoCols}>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={draft.sets}
                      onChangeText={(value) => updateDraft(index, { sets: value })}
                      placeholder="Sets"
                    />
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={draft.reps}
                      onChangeText={(value) => updateDraft(index, { reps: value })}
                      placeholder="Reps"
                    />
                  </View>

                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={draft.weight}
                    onChangeText={(value) => updateDraft(index, { weight: value })}
                    placeholder="Weight (optional)"
                  />
                  <TextInput
                    style={styles.input}
                    value={draft.notes}
                    onChangeText={(value) => updateDraft(index, { notes: value })}
                    placeholder="Notes (optional)"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <ForgeButton text="Cancel" theme="neutral" style={styles.modalButton} onPress={() => setEditingLog(null)} />
              <ForgeButton
                text={savingLogId ? 'Saving...' : 'Add'}
                theme="success"
                style={styles.modalButton}
                onPress={submitEditedWorkout}
                disabled={!!savingLogId}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!deleteConfirmLog} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete workout?</Text>
            <Text style={styles.confirmText}>
              {deleteConfirmLog
                ? `Delete "${deleteConfirmLog.title}" from your workout history?`
                : 'Delete this workout from your workout history?'}
            </Text>
            <View style={styles.modalActions}>
              <ForgeButton
                text="Cancel"
                theme="neutral"
                style={styles.modalButton}
                onPress={() => setDeleteConfirmLog(null)}
                disabled={!!deletingLogId}
              />
              <ForgeButton
                text={deletingLogId ? 'Deleting...' : 'Delete'}
                theme="danger"
                style={styles.modalButton}
                onPress={confirmDeleteWorkout}
                disabled={!!deletingLogId}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  searchContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d5dee9',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 0,
  },
  listContainer: {
    marginTop: 18,
    maxHeight: 360,
  },
  statusText: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#b91c1c',
    marginBottom: 8,
  },
  logCard: {
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logDate: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748b',
  },
  exerciseList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  exerciseHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  exerciseItem: {
    fontSize: 15,
    marginBottom: 3,
  },
  timerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sessionButton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  startSessionButton: {
    backgroundColor: '#2563eb',
  },
  endSessionButton: {
    backgroundColor: '#dc2626',
  },
  sessionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  postActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  addToLogButton: {
    backgroundColor: '#16a34a',
  },
  editButton: {
    backgroundColor: '#334155',
  },
  disabledButton: {
    opacity: 0.65,
  },
  actionsRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logButton: {
    backgroundColor: '#2563eb',
  },
  generateButton: {
    backgroundColor: '#0f766e',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: '#64748b',
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalExerciseCard: {
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    flex: 1,
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#64748b',
  },
  modalAddButton: {
    backgroundColor: '#16a34a',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc2626',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  confirmCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  confirmText: {
    marginTop: 8,
    marginBottom: 14,
    color: '#334155',
  },
});

function mapWorkoutLogToCard(log: WorkoutLog): LoggedWorkout {
  return {
    id: String(log.workout_id),
    title: log.workout_name,
    loggedAt: `Workout #${log.workout_id}`,
    exercises: log.exercises,
  };
}

function formatExercise(exercise: WorkoutExerciseLog): string {
  const parts = [
    `${exercise.exercise_name}`,
    `${exercise.sets}x${exercise.reps}`,
    exercise.weight != null ? `${exercise.weight} lb` : null,
  ].filter(Boolean);

  return parts.join(' • ');
}
