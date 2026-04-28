import { SessionExerciseLog } from "@/core/api";

export type LoggedWorkout = {
  id: string;
  workoutId: number;
  title: string;
  splitName: string;
  loggedAt: string;
  duration: number;
  exercises: SessionExerciseLog[];
};

export type ExerciseDraft = {
  exercise_id: number;
  machine_id: number;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

export type SplitGroup = {
  splitName: string;
  date: string;
  sessions: LoggedWorkout[];
};