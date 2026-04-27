import { useCallback, useEffect, useState, useMemo } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import ForgeButton from "@/components/ForgeButton";
import { Text, View } from "@/components/Themed";
import { api, SessionExerciseLog } from "@/core/api";
import { useRouter } from "expo-router";
import CardioButton from "@/components/cardioSearch/CardioButton";
import { AppModal } from "@/components/AppModal";

import { useUnits } from "@/core/conversions";
import { useAppColorScheme } from "@/core/accessibility";
import ProgressionButton from "@/components/workoutProgression/ProgressButton";

type LoggedWorkout = {
  id: string;
  workoutId: number;
  title: string;
  splitName: string;
  loggedAt: string;
  duration: number;
  exercises: SessionExerciseLog[];
};

type ExerciseDraft = {
  exercise_id: number;
  machine_id: number;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

type SplitGroup = {
  splitName: string;
  date: string;
  sessions: LoggedWorkout[];
};

export default function WorkoutTabScreen() {
  const [workoutHistory, setWorkoutHistory] = useState<LoggedWorkout[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [savingLogId, setSavingLogId] = useState<string | null>(null);
  const [postingLogId, setPostingLogId] = useState<string | null>(null);
  const [removingPostLogId, setRemovingPostLogId] = useState<string | null>(
    null,
  );
  const [postedSessionIds, setPostedSessionIds] = useState<Set<number>>(
    new Set(),
  );
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [deleteConfirmLog, setDeleteConfirmLog] =
    useState<LoggedWorkout | null>(null);
  const [editingLog, setEditingLog] = useState<LoggedWorkout | null>(null);
  const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { isImperial } = useUnits();
  const scheme = useAppColorScheme() ?? "light";
  const isDark = scheme === "dark";
  const palette = {
    background: isDark ? "#0b0f14" : "#ffffff",
    surface: isDark ? "#131922" : "#f8fafc",
    surfaceAlt: isDark ? "#111827" : "#ffffff",
    border: isDark ? "#243041" : "#dbe3f0",
    mutedBorder: isDark ? "#334155" : "#cbd5e1",
    text: isDark ? "#f8fafc" : "#0f172a",
    mutedText: isDark ? "#94a3b8" : "#64748b",
    splitSurface: isDark ? "#0f172a" : "#eff6ff",
    splitBorder: isDark ? "#1d4ed8" : "#93c5fd",
  };

  const router = useRouter();

  useEffect(() => {
    void loadWorkoutHistory();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWorkoutHistory();
    }, []),
  );

  async function loadWorkoutHistory() {
    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const logsFromApi = await api.getWorkoutHistory();
      const mapped = logsFromApi.map((s) => ({
        id: String(s.session_id),
        workoutId: s.workout_id,
        title: s.workout_name,
        splitName: s.split_name ?? "Unknown Split",
        loggedAt: s.date,
        duration: s.duration,
        exercises: s.exercises,
      }));
      setWorkoutHistory(mapped);

      try {
        const postedIds = await api.getMyWorkoutPostedSessionIds();
        setPostedSessionIds(new Set(postedIds));
      } catch (postError) {
        console.warn("Failed to load posted workout ids", postError);
        setPostedSessionIds(new Set());
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load workout history.";
      setHistoryError(message);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function createWorkoutPost(log: LoggedWorkout) {
    if (postingLogId || removingPostLogId) return;

    setPostingLogId(log.id);
    try {
      const result = await api.createWorkoutPost(Number(log.id));
      setPostedSessionIds((prev) => new Set([...prev, Number(log.id)]));
      const wasCreated = result.created !== false;
      Alert.alert(
        wasCreated ? "Workout posted" : "Already posted",
        wasCreated
          ? "Your workout was saved as a post."
          : "This workout has already been posted.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to post workout.";
      Alert.alert("Post failed", message);
    } finally {
      setPostingLogId(null);
    }
  }

  function handlePostWorkout(log: LoggedWorkout) {
    if (postingLogId || removingPostLogId) return;

    if (!postedSessionIds.has(Number(log.id))) {
      void createWorkoutPost(log);
      return;
    }

    Alert.alert(
      "Remove post?",
      "This workout has already been posted. Do you want to delete the post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Post",
          style: "destructive",
          onPress: () => {
            void removeWorkoutPost(log);
          },
        },
      ],
    );
  }

  async function removeWorkoutPost(log: LoggedWorkout) {
    if (postingLogId || removingPostLogId) return;

    setRemovingPostLogId(log.id);
    try {
      await api.deleteWorkoutPost(Number(log.id));
      setPostedSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(Number(log.id));
        return next;
      });
      Alert.alert("Post removed", "Your workout post was deleted.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to remove workout post.";
      Alert.alert("Remove failed", message);
    } finally {
      setRemovingPostLogId(null);
    }
  }

  function handleLogWorkout() {
    router.push("./AddWorkoutScreen");
  }

  function handleGenerateWorkout() {
    router.push("./GenerateWorkoutScreen");
  }

  async function handleAddToLog(log: LoggedWorkout) {
    if (savingLogId) return;
    setSavingLogId(log.id);
    try {
      const elapsed = 0;
      const seen = new Set<number>();
      const exercises = log.exercises
        .filter((ex) => {
          if (seen.has(ex.exercise_id)) return false;
          seen.add(ex.exercise_id);
          return true;
        })
        .map((ex) => ({
          exercise_id: ex.exercise_id,
          machine_id: ex.machine_id,
          sets: log.exercises.filter((e) => e.exercise_id === ex.exercise_id)
            .length,
          reps: ex.reps,
          weight: ex.weight,
        }));

      await api.addWorkoutLog({
        workout_id: log.workoutId,
        duration: elapsed,
        split_name: log.splitName,
        exercises,
      });

      Alert.alert("Added to log", "Session saved!");
      await loadWorkoutHistory();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add workout log.";
      Alert.alert("Add to log failed", message);
    } finally {
      setSavingLogId(null);
    }
  }

  function handleEditAndAdd(log: LoggedWorkout) {
    const uniqueExercises = log.exercises.filter(
      (exercise, index, arr) =>
        arr.findIndex((e) => e.exercise_id === exercise.exercise_id) === index,
    );

    setEditingLog(log);
    setExerciseDrafts(
      uniqueExercises.map((exercise) => ({
        exercise_id: exercise.exercise_id,
        machine_id: exercise.machine_id,
        exercise_name: exercise.exercise_name,
        sets: String(
          log.exercises.filter((e) => e.exercise_id === exercise.exercise_id)
            .length,
        ),
        reps: String(exercise.reps),
        weight: exercise.weight != null ? String(exercise.weight) : "",
        notes: "",
      })),
    );
  }

  function updateDraft(index: number, patch: Partial<ExerciseDraft>) {
    setExerciseDrafts((prev) =>
      prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  async function submitEditedWorkout() {
    if (!editingLog) return;
    if (savingLogId) return;

    for (const exercise of exerciseDrafts) {
      const sets = Number(exercise.sets);
      const reps = Number(exercise.reps);
      if (
        !Number.isFinite(sets) ||
        sets < 1 ||
        !Number.isFinite(reps) ||
        reps < 1
      ) {
        Alert.alert(
          "Invalid values",
          "Sets and reps must be numbers greater than 0.",
        );
        return;
      }
    }

    setSavingLogId(editingLog.id);
    try {
      const exercises = exerciseDrafts.map((exercise) => ({
        exercise_id: exercise.exercise_id,
        machine_id: exercise.machine_id,
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weight: exercise.weight.trim() ? Number(exercise.weight) : null,
      }));

      await api.addWorkoutLog({
        workout_id: editingLog.workoutId,
        duration: 0,
        split_name: editingLog.splitName,
        exercises,
      });

      setEditingLog(null);
      setExerciseDrafts([]);
      Alert.alert("Added to log", "Session saved!");
      await loadWorkoutHistory();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add workout log.";
      Alert.alert("Add failed", message);
    } finally {
      setSavingLogId(null);
    }
  }

  function handleDeleteWorkout(log: LoggedWorkout) {
    if (deletingLogId) return;
    setDeleteConfirmLog(log);
  }

  async function confirmDeleteWorkout() {
    if (!deleteConfirmLog) return;
    const log = deleteConfirmLog;

    setDeletingLogId(log.id);
    try {
      await api.deleteWorkoutLog(Number(log.id));
      if (expandedLogId === log.id) setExpandedLogId(null);
      setDeleteConfirmLog(null);
      await loadWorkoutHistory();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete workout.";
      Alert.alert("Delete failed", message);
    } finally {
      setDeletingLogId(null);
    }
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredWorkoutHistory = workoutHistory.filter((log) => {
    if (!normalizedSearchQuery) return true;
    const matchesTitle = log.title
      .toLowerCase()
      .includes(normalizedSearchQuery);
    const matchesExercise = log.exercises.some((exercise) =>
      exercise.exercise_name.toLowerCase().includes(normalizedSearchQuery),
    );
    return matchesTitle || matchesExercise;
  });

  const groupedWorkouts = useMemo(() => {
    const groups = new Map<string, SplitGroup>();
    for (const log of filteredWorkoutHistory) {
      const dateOnly = formatDisplayDate(log.loggedAt);
      const key = `${log.splitName}-${dateOnly}`;
      if (!groups.has(key)) {
        groups.set(key, {
          splitName: log.splitName,
          date: dateOnly,
          sessions: [],
        });
      }
      groups.get(key)!.sessions.push(log);
    }
    return Array.from(groups.values());
  }, [filteredWorkoutHistory]);

  function formatDisplayDate(iso: string): string {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Workouts</Text>
      </View>

      <View
        style={[
          styles.searchContainer,
          { borderColor: palette.border, backgroundColor: palette.surfaceAlt },
        ]}
      >
        <FontAwesome name="search" size={14} color={palette.mutedText} />
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search workouts"
          placeholderTextColor={palette.mutedText}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {loadingHistory && (
          <Text style={styles.statusText}>Loading workout history...</Text>
        )}

        {!loadingHistory && historyError && (
          <Text style={styles.errorText}>
            Could not load workouts: {historyError}
          </Text>
        )}

        {!loadingHistory && !historyError && workoutHistory.length === 0 && (
          <Text style={styles.statusText}>No workouts added</Text>
        )}

        {!loadingHistory &&
          !historyError &&
          workoutHistory.length > 0 &&
          filteredWorkoutHistory.length === 0 && (
            <Text style={styles.statusText}>
              No workouts match "{searchQuery.trim()}".
            </Text>
        )}

        {!loadingHistory &&
          !historyError &&
          groupedWorkouts.map((group) => (
            <View
              key={`${group.splitName}-${group.date}`}
              style={[
                styles.splitCard,
                {
                  borderColor: palette.splitBorder,
                  backgroundColor: palette.splitSurface,
                },
              ]}
            >
              <Text style={[styles.splitTitle, { color: palette.text }]}>
                {group.splitName}
              </Text>
              <Text style={[styles.splitDate, { color: palette.mutedText }]}>
                {group.date}
              </Text>

            {group.sessions.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                  <View
                    key={log.id}
                    style={[
                      styles.logCard,
                      {
                        borderColor: palette.border,
                        backgroundColor: palette.surface,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.logHeaderRow}
                      onPress={() =>
                        setExpandedLogId(isExpanded ? null : log.id)
                      }
                    >
                    <View>
                        <Text
                          style={[styles.logTitle, { color: palette.text }]}
                        >
                          {log.title}
                        </Text>
                        <Text
                          style={[styles.logDate, { color: palette.mutedText }]}
                        >{`${Math.floor(log.duration / 60)}m ${log.duration % 60}s`}</Text>
                    </View>
                      <FontAwesome
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={palette.mutedText}
                      />
                  </Pressable>

                  {isExpanded && (
                      <View
                        style={[
                          styles.exerciseList,
                          { borderTopColor: palette.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseHeading,
                            { color: palette.text },
                          ]}
                        >
                          Exercises in this log
                        </Text>
                        {log.exercises.map((exercise, idx) => (
                          <View
                            key={`${exercise.exercise_id}-${exercise.machine_id}-${idx}`}
                            style={styles.exerciseRow}
                          >
                        <Text
                          key={`${log.id}-${exercise.exercise_id}-${exercise.machine_id}-${exercise.set_number}`}
                              style={[
                                styles.exerciseItem,
                                { color: palette.text },
                              ]}
                        >
                          - {formatExercise(exercise, isImperial)}
                        </Text>
                            <ProgressionButton
                              exerciseId={exercise.exercise_name}
                            />
                          </View>
                        ))}
                      <View style={styles.timerRow}>
                        <ForgeButton
                            text={
                              removingPostLogId === log.id
                                ? "Removing..."
                                : postingLogId === log.id
                                  ? "Posting..."
                                  : postedSessionIds.has(Number(log.id))
                                    ? "Posted"
                                    : "Post"
                            }
                            compact
                            style={styles.postButton}
                            color={
                              postedSessionIds.has(Number(log.id))
                                ? "#16a34a"
                                : "#2563eb"
                            }
                            onPress={() => void handlePostWorkout(log)}
                            disabled={
                              postingLogId === log.id ||
                              removingPostLogId === log.id
                            }
                        />
                        <ForgeButton
                            text={
                              deletingLogId === log.id
                                ? "Deleting..."
                                : "Delete"
                            }
                          compact
                          style={styles.deleteButton}
                            color={"#ef4444"}
                          onPress={() => void handleDeleteWorkout(log)}
                          disabled={deletingLogId === log.id}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionsRow}>
        <ForgeButton
          text="Log Workout"
          style={styles.actionButton}
          onPress={handleLogWorkout}
        />
        <ForgeButton
          text="Generate Workout"
          style={styles.actionButton}
          onPress={handleGenerateWorkout}
        />
      </View>
      <View style={styles.actionsRow}>
        <CardioButton />
      </View>
      <AppModal 
        visible={!!editingLog}
        scrollStyle={{ maxHeight: 420 }}
        onClose={() => setEditingLog(null)}
        title={editingLog?.title ?? ""}
        animationType="slide"
        actions={
          <>
            <ForgeButton
              text="Cancel"
              style={styles.modalButton}
              onPress={() => setEditingLog(null)}
            />
            <ForgeButton
              text={savingLogId ? "Saving..." : "Add"}
              style={styles.modalButton}
              onPress={submitEditedWorkout}
              disabled={!!savingLogId}
            />
          </>
        }
      >
        <Text style={[styles.modalSubtitle, { color: palette.mutedText }]}>
          Edit exercises, then add this workout log.
        </Text>
        {exerciseDrafts.map((draft, index) => (
          <View
            key={`${draft.exercise_id}-${draft.machine_id}-${index}`}
            style={[
              styles.modalExerciseCard,
              { borderColor: palette.border, backgroundColor: palette.surface },
            ]}
          >
            <Text style={[styles.exerciseCardTitle, { color: palette.text }]}>
              {draft.exercise_name}
            </Text>

            <View style={styles.twoCols}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: palette.mutedBorder,
                    color: palette.text,
                    backgroundColor: palette.background,
                  },
                ]}
                keyboardType="number-pad"
                value={draft.sets}
                onChangeText={(value) => updateDraft(index, { sets: value })}
                placeholder="Sets"
                placeholderTextColor={palette.mutedText}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: palette.mutedBorder,
                    color: palette.text,
                    backgroundColor: palette.background,
                  },
                ]}
                keyboardType="number-pad"
                value={draft.reps}
                onChangeText={(value) => updateDraft(index, { reps: value })}
                placeholder="Reps"
                placeholderTextColor={palette.mutedText}
              />
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: palette.mutedBorder,
                  color: palette.text,
                  backgroundColor: palette.background,
                },
              ]}
              keyboardType="numeric"
              value={draft.weight}
              onChangeText={(value) => updateDraft(index, { weight: value })}
              placeholder="Weight (optional)"
              placeholderTextColor={palette.mutedText}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: palette.mutedBorder,
                  color: palette.text,
                  backgroundColor: palette.background,
                },
              ]}
              value={draft.notes}
              onChangeText={(value) => updateDraft(index, { notes: value })}
              placeholder="Notes (optional)"
              placeholderTextColor={palette.mutedText}
            />
          </View>
        ))}
      </AppModal>

      <Modal visible={!!deleteConfirmLog} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.confirmCard,
              { backgroundColor: palette.surfaceAlt },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: palette.text }]}>
              Delete workout?
            </Text>
            <Text style={[styles.confirmText, { color: palette.mutedText }]}>
              {deleteConfirmLog
                ? `Delete "${deleteConfirmLog.title}" from your workout history?`
                : "Delete this workout from your workout history?"}
            </Text>
            <View style={styles.modalActions}>
              <ForgeButton
                text="Cancel"
                style={styles.modalButton}
                onPress={() => setDeleteConfirmLog(null)}
                disabled={!!deletingLogId}
              />
              <ForgeButton
                text={deletingLogId ? "Deleting..." : "Delete"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  searchContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#d5dee9",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 0,
  },
  listContainer: {
    marginTop: 18,
    maxHeight: 360,
  },
  statusText: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#b91c1c",
    marginBottom: 8,
  },
  logCard: {
    borderWidth: 1,
    borderColor: "#dbe3f0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  logDate: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748b",
  },
  exerciseList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  exerciseHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  exerciseItem: {
    fontSize: 15,
    marginBottom: 3,
  },
  timerRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logButton: {
    backgroundColor: "#2563eb",
  },
  generateButton: {
    backgroundColor: "#0f766e",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  modalSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: "#64748b",
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalExerciseCard: {
    borderWidth: 1,
    borderColor: "#dbe3f0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  twoCols: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    flex: 1,
  },
  modalActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#64748b",
  },
  modalAddButton: {
    backgroundColor: "#16a34a",
  },
  deleteConfirmButton: {
    backgroundColor: "#dc2626",
  },
  modalButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  confirmCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  confirmText: {
    marginTop: 8,
    marginBottom: 14,
    color: "#334155",
  },
  splitCard: {
    borderWidth: 1,
    borderColor: "#93c5fd",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#eff6ff",
  },
  splitTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e3a5f",
  },
  splitDate: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 26,
  }
});

function formatExercise(
  exercise: SessionExerciseLog,
  isImperial: boolean,
): string {
  const weight =
    exercise.weight != null
      ? isImperial
      ? `${exercise.weight} lb`
      : `${(exercise.weight * 0.453592).toFixed(0)} kg`
    : null;
  const parts = [
    exercise.exercise_name,
    `Set ${exercise.set_number} · ${exercise.reps} reps`,
    weight,
  ].filter(Boolean);
  return parts.join(" • ");
}
