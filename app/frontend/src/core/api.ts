
import Constants from 'expo-constants';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const fallbackBaseUrl = expoHost ? `http://${expoHost}:8000` : 'http://localhost:8000';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl;

// If you use auth tokens, wire this up later:
let token: string | null = null;
export function setToken(t: string | null) {
  token = t;
}

function headers() {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: headers(),
  });

  if (res.ok) return (await res.json()) as T;

  const data = await res.json().catch(() => ({}));
  throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (res.ok) return;

  const data = await res.json().catch(() => ({}));
  throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (res.ok) return (await res.json()) as T;

  const data = await res.json().catch(() => ({}));
  throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (res.ok) return (await res.json()) as T;

  const data = await res.json().catch(() => ({}));
  throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
}

const TEST_USER: User = {
  profile_id: 1,
  email: 'tester@forge307.dev',
  username: 'Testing',
  bio: 'I love testing forge307'
};

export const api = {
  deleteAccount: (userId: number) => del(`/accounts/${userId}`),
  deleteWorkoutLog: (profileId: number, workoutId: number) =>
    del(`/workouts/${profileId}/${workoutId}`),
  getWorkoutHistory: async (profileId: number): Promise<WorkoutLog[]> => {
    return get<WorkoutLog[]>(`/workouts/${profileId}`);
  },
  addWorkoutLog: async (payload: CreateWorkoutLogRequest): Promise<CreateWorkoutLogResponse> => {
    return post<CreateWorkoutLogResponse>('/workouts', payload);
  },
  me: async (): Promise<User | undefined> => {
    return get<User>('/auth/me');
  },
  register: async (e: ApiEvent): Promise<User | undefined> => {
    return TEST_USER;
  },
  login: async (e: ApiEvent): Promise<{ access_token: string | undefined }> => {
    return {
      access_token: 'API.LOGIN DEMO TOKEN'
    };
  },
  updateMe: async (e: { username?: string; bio?: string }): Promise<User | undefined> => {
    const me = await api.me();
    if (!me) throw new Error("User not signed in.");

    const updated = await patch<{ user_id: number; email: string; username: string }>(
      `/accounts/${me.profile_id}/profile`,
      e
    );

    return {
      profile_id: updated.user_id,
      email: updated.email,
      username: updated.username,
      bio: e.bio ?? me.bio ?? "",
    };
  },
  changePassword: async (e: { current_password: string; new_password: string }): Promise<User | undefined> => {
    const me = await api.me();
    if (!me) throw new Error("User not signed in.");

    await post<{ ok: boolean; message?: string }>(`/accounts/${me.profile_id}/change_password`, e);
    return me;
  },
  submitOnboarding: async (e: SubmitOnboardingEvent): Promise<boolean> => {
    return true;
  },
  getExercises: async (): Promise<Record<string, number>> => {
    const rows = await get<ExerciseLookupRow[]>('/exercises');
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.name] = row.exercise_id;
      return acc;
    }, {});
  },
  getMachines: async (): Promise<MachineLookupRow[]> => {
    return get<MachineLookupRow[]>('/machines');
  },
  searchCardioMachine: async (e: SearchCardioMachineEvent): Promise<SearchCardioMachineResponse[]> => {
    // Prompt LLM with user object goals and cardio machie description
    // LLM returns a list of SearchCardioMachineResponse[]
    const usr = await api.me();
    if (typeof usr === "undefined")
      throw new Error("User not signed in.");
    
    // Fetch logged in user to get goals and bio
    // TODO: LLM call
    return [
      {
        name: 'Treadmill',
        desc: 'Useful for basic stamina training and calorie burn'
      },
      {
        name: 'Stairmaster',
        desc: 'A more advanced and difficult cardio machine, burns a lot of calories fast'
      },
      {
        name: 'Elliptical Machine',
        desc: 'It\'s fun idk man'
      }
    ]
  },

  searchByRestaurant: async (restaurant: string): Promise<MenuMeal[]> => {
    return get<MenuMeal[]>(`/meals/restaurant/${encodeURIComponent(restaurant)}`);
  },

  searchByProtein: async (protein: string): Promise<MenuMeal[]> => {
    return get<MenuMeal[]>(`/meals/protein/${encodeURIComponent(protein)}`);
  },
};

export type User = {
  profile_id: number,
  email: string,
  username: string,
  bio: string
};

export type ApiEvent = any;

export type SubmitOnboardingEvent = {
  /** The user's health score on a scale of [0, 100] */
  healthScore: number,

  /** The user's response to what their fitness goals are, used for prompting. */
  goals: string,
  
  /** The user's response about their previous lifting experience, used for prompting. */
  previousExperience: string,

  /** The user's preferred bio for their profile. */
  bio: string,

  /** The user's description of their age. */
  age: string,

  /** The user's description of their height. */
  height: string,

  /** The user's description of their weight. */
  weight: string
};

export type SearchCardioMachineResponse = {
  name: string,
  desc: string,
};

export type SearchCardioMachineEvent = {
  desc: string
};

export type ExerciseLookupRow = {
  exercise_id: number;
  name: string;
};

export type MachineLookupRow = {
  machine_id: number;
  name: string;
};

export type WorkoutExerciseLog = {
  exercise_id: number;
  exercise_name: string;
  machine_id: number;
  sets: number;
  reps: number;
  weight?: number | null;
  notes?: string | null;
};

export type WorkoutLog = {
  workout_id: number;
  workout_name: string;
  exercises: WorkoutExerciseLog[];
};

export type CreateWorkoutLogExercise = {
  exercise_id: number;
  machine_id: number;
  sets: number;
  reps: number;
  weight?: number | null;
  notes?: string | null;
};

export type CreateWorkoutLogRequest = {
  profile_id: number;
  workout_name: string;
  exercises: CreateWorkoutLogExercise[];
};

export type CreateWorkoutLogResponse = {
  workout_id: number;
  workout_name: string;
  inserted_sets: number;
};

export type MenuMeal = {
  id: number;
  restaurant: string;
  category: string;
  product: string;
  energy_kcal?: number;
  chicken?: boolean;
};
