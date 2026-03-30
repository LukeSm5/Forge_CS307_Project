
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
  console.log("AUTH TOKEN:", token);

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

export const api = {
  deleteAccount: (userId: number) => del(`/accounts/${userId}`),

  deleteWorkoutLog: async (sessionId: number) =>
    del(`/sessions/${sessionId}`),

  getWorkoutHistory: async (): Promise<SessionLog[]> => {
    return get<SessionLog[]>('/sessions');
  },

  addWorkoutLog: async (payload: CreateSessionRequest): Promise<SessionLog> => {
    return post<SessionLog>('/sessions', payload);
  },
  

  me: async (): Promise<User | undefined> => {
    return get<User>('/auth/me');
  },
  register: async (e: { email: string; username: string; password: string; bio?: string }) => {
    const result = await post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    }>('/auth/create_account', e);

    setToken(result.access_token);

    return await api.me();
  },
  login: async (e: { email: string; password: string }) => {
    const result = await post<{
      access_token: string;
      refresh_token: string;
    }>('/auth/login', e);

    setToken(result.access_token);

    return {
      access_token: result.access_token,
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
    const me = await api.me();
    if (!me) throw new Error("User not signed in.");

    const res = await post<{ ok: boolean }>(`/profiles/${me.profile_id}`, {
      age: e.age,
      gender: e.genderIndex === 0 ? 'Male' : 'Female',
      height_in: e.height,
      weight: e.weight,
      health_goals: e.goals,
      health_status: e.previousExperience,
      calorie_goal: e.calorie_goal,
      accepted_terms: e.acceptedTerms,
    });

    return res.ok;
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
  generateQuickWorkout: async (payload: GenerateQuickWorkoutRequest): Promise<GeneratedQuickWorkout> => {
    return post<GeneratedQuickWorkout>('/ai/quick-workout', payload);
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

  getAllMenuMeals: async (): Promise<MenuMeal[]> => {
    return get<MenuMeal[]>('/meals');
  },

  getLoggedMenuMeals: async (): Promise<LoggedMenuMeal[]> => {
    return get<LoggedMenuMeal[]>('/session-menu-meals');
  },

  deleteLoggedMenuMeal: async (sessionId: number): Promise<void> => {
    return del(`/session-menu-meals/${sessionId}`);
  },

  logMenuMeal: async (
    menuMealId: number,
    mealType: MealType
  ): Promise<LoggedMenuMeal> => {
    return post<LoggedMenuMeal>('/session-menu-meals', {
      menu_meal_id: menuMealId,
      meal_type: mealType,
    });
  },

  genericPrompt: async (e: GenericPromptEvent): Promise<GenericPromptResponse> => {
    return { text: 'Placeholder response' }
  },

  mePrompt: async (e: GenericPromptEvent): Promise<GenericPromptResponse> => {
    const usr = await api.me();
    if (typeof usr === "undefined")
      throw new Error("User not signed in.");

    const prompt = `
You are part of FORGE, an AI powered fitness coaching app. You are going to be providing information for users in the
form of JSON objects, which will be parsed to be displayed on the app. Please ONLY respond with JSON objects in whatever
format is provided to you. Cater your responses to the current user, whose information will be provided below. If any fields
are missing, they will have N/A. Do not worry about N/A fields, just generify your answers in that case.

Age: ${usr.age ? usr.age : 'N/A'}
Height (inches): ${usr.height ? usr.height : 'N/A'}
Weight (pounds): ${usr.weight ? usr.weight : 'N/A'}}
Personal Goals: ${usr.goals ? `<GOAL START>${usr.goals}<GOAL END/>` : 'N/A'}
Gender: ${usr.gender ? usr.gender : 'N/A'}

Now, a prompt will be provided. Please respond with a JSON object to the best of your ability.
If there is an error, format and return this object:
{
  error: true,
  errorMsg: <<Insert Error Reasoning Here>>
}

${e.prompt}
`

    return api.genericPrompt({ prompt });
  },

  getWeightProgression: async (exerciseId: string): Promise<WeightProgression> => {
    return {
      time: [1774552003, 1774638403, 1774724803],
      weight: [150, 175, 245],
    };
  },

  promptWeightProgression: async (exerciseId: string): Promise<WeightProgression[]> => {
    const present = await api.getWeightProgression(exerciseId);
    // TODO: uncomment after prompting is implemented
//     const future = JSON.parse((await api.mePrompt({ prompt: `
// This user would like to see some future data points on weight progression.
// This information will be used to generate a graph of their previous weight progression
// alongside their future weight progression, which you will provide as a JSON object.

// The ID of the exercise in question is ${exerciseId}.
// Their previous progression is provided in the following object:
// {
//   time: [${present.time.map(x => `${x}`).join(", ")}],
//   weight: [${present.weight.map(x => `${x}`).join(", ")}]
// }

// The time is provided as epoch timestamps, and each time corresponds to the
// weight at the same index.

// Please return a similar JSON object of the following format:
// {
//   time: [ epoch timestamp, epoch timestamp, epoch timestamp, ... ]
//   weight: [ pounds, pounds, pounds, ... ]
// }

// for example:
// {
//   time: [100, 200, 300],
//   weight: [400, 500, 600]
// }

// This should correspond a reasonable weight progression in the future that would
// look pleasing on a graph.
//     ` })).text);
    const future = {
      time: [1774813005, 1774899405, 1774985805],
      weight: [255, 275, 305]
    }
    return [present, future];
  },

  getWorkouts: async (): Promise<WorkoutLookup[]> => {
    return get<WorkoutLookup[]>('/workouts/list');
  },

  addSession: async (payload: CreateSessionRequest): Promise<SessionLog> => {
    return post<SessionLog>('/sessions', payload);
  },

  getTailoredExercise: async (payload: TailorExerciseRequest): Promise<TailoredExercise> => {
    return post<TailoredExercise>('/tailor-exercise', payload);
  },

  recalibrateCalories: async (payload: RecalibrateCaloriesRequest): Promise<RecalibrateCaloriesResponse> => {
    return post<RecalibrateCaloriesResponse>('/recalibrate-calories', payload);
  },
};

export type User = {
  profile_id: number,
  email: string,
  username: string,
  bio: string,
  age?: number,
  height?: number,
  weight?: number,
  goals?: string,
  gender?: string,
  calorie_goal?: number,
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
  age: number,

  /** The user's description of their height. */
  height: number,

  /** The user's description of their weight. */
  weight: number,

  genderIndex: number,    
  activityIndex: number,
  calorie_goal: number,
  acceptedTerms: boolean,
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

export type GeneratedWorkoutExercise = {
  exercise_id: number;
  exercise_name: string;
  machine_id?: number | null;
  machine_name?: string | null;
  sets: number;
  reps: number;
  weight?: number | null;
  notes?: string | null;
};

export type GeneratedVectorMatch = {
  doc_id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
};

export type GenerateQuickWorkoutRequest = {
  profile_id: number;
  focus?: string | null;
  top_k?: number;
};

export type GeneratedQuickWorkout = {
  profile_id: number;
  workout_name: string;
  profile_context: string;
  profile_matches: GeneratedVectorMatch[];
  prompt: string;
  source_matches: GeneratedVectorMatch[];
  exercises: GeneratedWorkoutExercise[];
};

export type MenuMeal = {
  id: number;
  restaurant: string;
  category: string;
  product: string;
  serving_size?: number;
  energy_kcal?: number;
  carbohydrates_g?: number;
  protein_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  total_fat_g?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  sodium_mg?: number;
  chicken?: boolean;
  beef?: boolean;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type LoggedMenuMeal = {
  session_id: number;
  profile_id: number;
  menu_meal_id: number;
  date: string;
  meal_type: MealType;

  restaurant: string;
  category?: string | null;
  product: string;
  serving_size?: number | null;
  energy_kcal?: number | null;
  carbohydrates_g?: number | null;
  protein_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  total_fat_g?: number | null;
  saturated_fat_g?: number | null;
  trans_fat_g?: number | null;
  cholesterol_mg?: number | null;
  sodium_mg?: number | null;
};

export type GenericPromptEvent = {
  prompt: string
}

export type GenericPromptResponse = {
  text: string
}

export type WeightProgression = {
  time: number[],
  weight: number[]
}

export type WorkoutLookup = {
  workout_id: number;
  name: string;
};

export type CreateSessionRequest = {
  workout_id: number;
  duration?: number | null;
  date?: string | null; // YYYY-MM-DD
  split_name: string;
  exercises: {
    exercise_id: number;
    machine_id: number;
    sets: number;
    reps: number;
    weight?: number | null;
  }[];
};

export type SessionLog = {
  session_id: number;
  workout_id: number;
  workout_name: string;
  split_name: string | null;
  date: string;
  duration: number;
  exercises: SessionExerciseLog[];
};

export type SessionExerciseLog = {
  exercise_id: number;
  exercise_name: string;
  machine_id: number;
  set_number: number;
  reps: number;
  weight?: number | null;
};

export type TailoredExercise = {
  weight: number;
  sets: number;
  reps: number;
};

export type TailorExerciseRequest = {
  date: string;
  split_name: string;
  workout_name: string;
  exercise_name: string;
  machine_name: string;
};

export type RecalibrateCaloriesRequest = {
  current_calorie_goal?: number | null;
  consumed_calories: number;
  remaining_calories?: number | null;
};

export type RecalibrateCaloriesResponse = {
  calorie_goal: number;
};

