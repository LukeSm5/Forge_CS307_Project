import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

let token: string | null = null;

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const fallbackBaseUrl = expoHost ? `http://${expoHost}:8000` : 'http://localhost:8000';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl;

const TOKEN_KEY = 'access_token';

export async function loadToken() {
  if (Platform.OS === 'web') {
    token = localStorage.getItem(TOKEN_KEY);
  } else {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  }
}

export function setToken(t: string | null) {
  token = t;
  if (Platform.OS === 'web') {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } else {
    if (t) SecureStore.setItemAsync(TOKEN_KEY, t);
    else SecureStore.deleteItemAsync(TOKEN_KEY);
  }
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
  updateMe: async (e: { username?: string; bio?: string; gym_location?: string }): Promise<User | undefined> => {
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
      gym_location: e.gym_location ?? me.gym_location ?? "Unknown Location"
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

    if (!res.ok) return false;

    if (e.bio) {
      await patch<{ ok: boolean }>(`/accounts/${me.profile_id}/profile`, {
        bio: e.bio,
      });
    }

    return true;
  },
  getExercises: async (): Promise<Record<string, number>> => {
    const rows = await get<ExerciseLookupRow[]>('/exercises');
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.name] = row.exercise_id;
      return acc;
    }, {});
  },
  getExerciseHelp: async (exerciseId: number): Promise<ExerciseHelp> => {
    return get<ExerciseHelp>(`/exercises/${exerciseId}/help`);
  },
  getMachines: async (): Promise<MachineLookupRow[]> => {
    return get<MachineLookupRow[]>('/machines');
  },
  generateQuickWorkout: async (payload: GenerateQuickWorkoutRequest): Promise<GeneratedQuickWorkout> => {
    return post<GeneratedQuickWorkout>('/ai/quick-workout', payload);
  },
  generateRecipe: async (payload: GenerateRecipeRequest): Promise<GeneratedRecipe> => {
    return post<GeneratedRecipe>('/ai/generate-recipe', payload);
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

  getLoggedAtHomeMeals: async (): Promise<LoggedAtHomeMeal[]> => {
    return get<LoggedAtHomeMeal[]>('/session-meals');
  },

  deleteLoggedMenuMeal: async (sessionId: number): Promise<void> => {
    return del(`/session-menu-meals/${sessionId}`);
  },
  
  machineAlternative: async (e: AltMachEvent): Promise<AltMachResponse[]> => {
    // Prompt LLM with user object goals and exercise name
    // LLM returns a list of AltMachResponse[]
    const usr = await api.me();
    if (typeof usr === "undefined")
      throw new Error("User not signed in.");
    
    const res = await api.mePrompt({ prompt: `
The user is requesting a list of alternatives for the exercise ${e.exercise}. This includes
machines, free weight exercises, bodyweight exercises, etc. Please return an array of JSON objects
formatted as follows:
{
  name: string, // The name of the alternative exercise
  desc: string, // A brief description of the alternative exercise and how it compares to the original exercise
}

For example, if the user wants a dumbell bicep curls alternative, you may return
[
      {
        name: "Barbell Bicep Curls",
        desc: "A similar exercise that also targets the biceps, but allows for heavier weight and more stability. Performed using a barbell and curling, similar to dumbbells."
      },
      {
        name: "Cable Bicep Curls",
        desc: "This exercise also targets the biceps and provides constant tension throughout the movement, which can lead to increased muscle activation. Performed on a cable stack with a straight handle."
      }
]

Be sure to include a BRIEF, but precise description of how the alternative exercise compares to the original exercise and how to perform it. The user will use this information to decide which alternative to do, so it should be informative and helpful.
Return a maximum of 5 exercises, and at least 2.
Since the user is requesting an alternative, assume they are not looking for something highly difficult, so avoid exercises with high risks
of injury or technical difficulty, i.e. deadlift, clean and jerk, snatch, etc.
      `});
    const responses = JSON.parse(res.text);
    return responses;
  },

  quickWorkout: async (): Promise<QuickWorkoutResponse> => {
    // Prompt LLM with user object goals and exercise name
    // LLM returns a QuickWorkoutResponse object
    const usr = await api.me();
    if (typeof usr === "undefined")
      throw new Error("User not signed in.");
    
    const res = await api.mePrompt({ prompt: `
The user is requesting a quick workout that they can do. It should be tailored to a user's goals and profile, so use the user's information to cater the workout to them. The workout should be formatted as a JSON object as follows:
{
  workout: string, // The name of the workout
  exercises: { machine: string, exercise: string; sets: number; reps: number; weight: number }[], // A list of exercises in the workout
}

For example, if the user wants a quick workout, you may return objects like the following:

{
  workout: "Back Day",
  exercises: [
    {
      machine: "cable",
      exercise: "lateral pull down",
      sets: 3,
      reps: 10,
      weight: 100
    }
    { machine: "dumbbell",
      exercise: "row",
      sets: 3,
      reps: 10,
      weight: 80
    }
  ]
}

{
  workout: "bicep",
  exercises: [
    {
      machine: "dumbbell",
      exercise: "bicep curl",
      sets: 3,
      reps: 10,
      weight: 50
    }
  ]
}
When choosing a workout, only choose from these categories: back, bicep, chest, tricep, shoulder, quad, ab, cardio, forearm, oblique, lower back, hamstring, glute, calf, hip flexor, full body

When choosing an exercise for a workout, only choose from these exercises: pull up, lateral pull down, row, face pull, bicep curl, preacher curl, hammer curl, straight-bar curl, bench press
incline bench press, cable fly, high low cable fly, low high cable fly, skull crusher, tricep push down, shoulder press
shoulder raise, shrug, bulgarian split squat, romanian deadlift, power clean, burpee, sled push, russian twist
sled pull, box jump, cardio.

When choosing an exercise, please explicitly name the machine used out of this list, and this list only:
dumbbell, barbell, body weight, cable, treadmill, stair master, elliptical, bike, row.

      `});
    const responses = JSON.parse(res.text);
    return responses;
  },

  quickMuscleWorkout: async (e: quickMuscleEvent): Promise<QuickWorkoutResponse> => {
    // Prompt LLM with user object goals and exercise name
    // LLM returns a QuickWorkoutResponse object
    const usr = await api.me();
    if (typeof usr === "undefined")
      throw new Error("User not signed in.");
    let muscle = "";
    for (let i = 0; i < e.muscles.length; i++) {
      muscle += e.muscles[i].trim().toLowerCase();
      if (i !== e.muscles.length - 1) {
        muscle += ", ";
      }
    }
    const res = await api.mePrompt({ prompt: `
The user is requesting a quick workout that they can do for ${muscle}. It should be tailored to a user's goals and profile, so use the user's information to cater the workout to them. The workout should be formatted as a JSON object as follows:
{
  workout: string, // The name of the workout
  exercises: { machine: string, exercise: string; sets: number; reps: number; weight: number }[], // A list of exercises in the workout
}

For example, if the user wants a workout for back, as in the first example, or a bicep, for the second example, you may return objects like the following:

{
  workout: "Back Day",
  exercises: [
    {
      machine: "cable",
      exercise: "lateral pull down",
      sets: 3,
      reps: 10,
      weight: 100
    }
    { machine: "barbell",
      exercise: "row",
      sets: 3,
      reps: 10,
      weight: 80
    }
  ]
}

{
  workout: "bicep",
  exercises: [
    {
      machine: "dumbbell",
      exercise: "bicep curl",
      sets: 3,
      reps: 10,
      weight: 50
    }
  ]
}
When choosing a workout, only include the listed muscle group. No other muscles should be involved in the workout.

When choosing an exercise for a workout, only choose from these exercises: pull up, lateral pull down, row, face pull, bicep curl, preacher curl, hammer curl, straight-bar curl, bench press
incline bench press, cable fly, high low cable fly, low high cable fly, skull crusher, tricep push down, shoulder press
shoulder raise, shrug, bulgarian split squat, romanian deadlift, power clean, burpee, sled push, russian twist
sled pull, box jump, cardio

When choosing an exercise, please explicitly name the machine used out of this list, and this list only:
dumbbell, barbell, body weight, cable, treadmill, stair master, elliptical, bike, row


      `});
    const raw = res.text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

    const responses = JSON.parse(raw);  
    return responses;
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

  logRecommendedMenuMeal: async (
    restaurant: string,
    order: string,
    mealType: MealType
  ): Promise<LoggedMenuMeal> => {
    return post<LoggedMenuMeal>('/session-menu-meals/recommended', {
      restaurant,
      order,
      meal_type: mealType,
    });
  },

  addGeneratedRecipeToLog: async (
    payload: AddGeneratedRecipeToLogRequest
  ): Promise<LoggedAtHomeMeal> => {
    return post<LoggedAtHomeMeal>('/session-meals/generated', payload);
  },

  genericPrompt: async (e: GenericPromptEvent): Promise<GenericPromptResponse> => {
    return post<GenericPromptResponse>('/generic-prompt', e);
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
    return get<WeightProgression>(`/exercise_progression_history/${exerciseId}`);
  },

  promptWeightProgression: async (exerciseId: string): Promise<WeightProgression[]> => {
    const present = await api.getWeightProgression(exerciseId);
    console.log(present);
    console.log("mega bummer");
    const res = await api.mePrompt({ prompt: `
This user would like to see some future data points on weight progression.
This information will be used to generate a graph of their previous weight progression
alongside their future weight progression, which you will provide as a JSON object.

The ID of the exercise in question is ${exerciseId}.
Their previous progression is provided in the following object:
{
  time: [${present.time.map(x => `${x}`).join(", ")}],
  weight: [${present.weight.map(x => `${x}`).join(", ")}]
}

The time is provided as epoch timestamps, and each time corresponds to the
weight at the same index.

Please return a similar JSON object of the following format:
{
  time: [ epoch timestamp, epoch timestamp, epoch timestamp, ... ]
  weight: [ pounds, pounds, pounds, ... ]
}

for example:
{
  time: [100, 200, 300],
  weight: [400, 500, 600]
}

This should correspond a reasonable weight progression in the future that would
look pleasing on a graph.
    ` });
    console.log(res);
    const aiFuture = JSON.parse(res.text);
    return [present, aiFuture];
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

  getGymLocations: async (): Promise<string[]> => {
    return get<string[]>('/gym-locations');
  },
  getWeeklyReport: async (): Promise<ReportData> => {
    return get<ReportData>('/weeklyReport');
  }, 

  getMonthlyReport: async (): Promise<ReportData> => {
    return get<ReportData>('/monthlyReport');
  }, 
  
  searchProfiles: async (username: string): Promise<ProfileSearchResult[]> => {
    return get<ProfileSearchResult[]>(
      `/profiles/search?username=${encodeURIComponent(username)}`
    )
  },

  getProfileStreak: async (profileId: number): Promise<ProfileStreak> => {
    return get<ProfileStreak>(`/profiles/${profileId}/streak`);
  },

  checkFriendship: async (addresseeId: number): Promise<FriendshipStatus> => {
    const res = await get<FriendshipStatusResponse>(
      `/friends/status?addressee_id=${addresseeId}`
    );
    return res.status;
  },

  sendFriendRequest: async (addresseeId: number): Promise<void> => {
    await post<{ ok: boolean }>('/friends/request', { addressee_id: addresseeId });
  },

  removeFriend: async (otherUserId: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/friends`, {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({ addressee_id: otherUserId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
    }
  },

  getNotifications: async (): Promise<Notification[]> => {
    const notifications = [];
    const rawNotifications = await get<UnformattedNotification[]>('/inbox');
    for (const notif of rawNotifications) {
      const notifType: NotificationType = notif.data.type as NotificationType || 'generic';
      const data: Record<string, unknown> = {};

      switch (notifType) {
        case 'friend_request':
          data.requesterId = (notif.data as any).requesterId;
          data.requesterUsername = (notif.data as any).requesterUsername;
          break;
        case 'view_post':
          data.postId = (notif.data as any).postId;
          data.posterUsername = (notif.data as any).posterUsername;
          break;
      }

      notifications.push({
        id: notif.id,
        type: notifType,
        message: notif.message,
        timestamp: notif.timestamp,
        data,
      });
    }

    return notifications;
  },



  getChats: async (): Promise<ChatListItem[]> => {
    return get<ChatListItem[]>('/chats');
  },

  checkBlock: async (otherId: number): Promise<BlockStatus> => {
    return get<BlockStatus>(`/blocks/status?other_id=${otherId}`);
  },

  blockUser: async (blockedId: number): Promise<void> => {
    await post<{ ok: boolean }>('/blocks', { blocked_id: blockedId });
  },

  unblockUser: async (blockedId: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/blocks`, {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({ blocked_id: blockedId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
    }
  },

  getPostInfo: async (postId: number, isMeal: boolean): Promise<PostInfo> => {
    const likes = await post<{ likes: { user_id: number, username: string}[] }>('/posts/likes', { post_id: postId, is_meal: isMeal });
    const comments = await post<{ comments: { user_id: number, username: string, text: string, timestamp: number }[] }>('/posts/comments', { post_id: postId, is_meal: isMeal });
    const reactions = await post<{ reactions: { user_id: number, username: string, reaction: string }[] }>('/posts/reactions', { post_id: postId, is_meal: isMeal });
    return { likes: likes.likes, comments: comments.comments, reactions: reactions.reactions };
  },

  likePost: async (postId: number, isMeal: boolean): Promise<void> => {
    await post<{ ok: boolean }>('/feed/likePost', { post_id: postId, is_meal: isMeal });
  },

  unlikePost: async (postId: number, isMeal: boolean): Promise<void> => {
    await post<{ ok: boolean }>('/feed/unlikePost', { post_id: postId, is_meal: isMeal });
  },

  reactToPost: async (postId: number, isMeal: boolean, reaction: string): Promise<void> => {
    await post<{ ok: boolean }>('/feed/reactPost', { post_id: postId, is_meal: isMeal, text: reaction });
  },

  unreactToPost: async (postId: number, isMeal: boolean): Promise<void> => {
    await post<{ ok: boolean }>('/feed/unreactPost', { post_id: postId, is_meal: isMeal });
  },

  commentOnPost: async (postId: number, isMeal: boolean, text: string): Promise<void> => {
    await post<{ ok: boolean }>('/feed/commentPost', { post_id: postId, is_meal: isMeal, text });
  },

  reportUser: async (reportedId: number, description: string): Promise<void> => {
    await post<{ ok: boolean }>('/reports', {
      reported_id: reportedId,
      description,
    });
  },

  publishMealPost: async (payload: PublishMealPostRequest): Promise<MealPost> => {
    return post<MealPost>('/feed/posts', payload);
  },

  getFeed: async (limit = 50, offset = 0): Promise<MealPost[]> => {
    return get<MealPost[]>(`/feed/posts?limit=${limit}&offset=${offset}`);
  },

  deleteMealPost: async (postId: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/feed/posts/${postId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
    }
  },

  saveMealFromFeed: async (postId: number): Promise<SavedMealPost> => {
    return post<SavedMealPost>(`/feed/posts/${postId}/save`, {});
  },

  unsaveMealPost: async (saveId: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/feed/saved/${saveId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
    }
  },

  getSavedFeedMeals: async (): Promise<SavedMealPost[]> => {
    return get<SavedMealPost[]>('/feed/saved');
  },

  getGymWorkoutFeed: async (): Promise<WorkoutFeedPost[]> => {
    return get<WorkoutFeedPost[]>('/feed/workouts/gym');
  },

  getFriendsWorkoutFeed: async (): Promise<WorkoutFeedPost[]> => {
    return get<WorkoutFeedPost[]>('/feed/workouts/friends');
  },

  createWorkoutPost: async (sessionId: number): Promise<{ ok: boolean; created: boolean; detail?: string; post_id?: number }> => {
    return post<{ ok: boolean; created: boolean; detail?: string; post_id?: number }>(`/posts/workouts/create`, { session_id: sessionId });
  },

  deleteWorkoutPost: async (sessionId: number): Promise<void> => {
    return del(`/posts/workouts/${sessionId}`);
  },

  getMyWorkoutPostedSessionIds: async (): Promise<number[]> => {
    return get<number[]>('/posts/workouts/mine');
  },


  acceptFriendRequest: async (requesterId: number): Promise<void> => {
    await post<{ ok: boolean }>('/friends/accept', { requester_id: requesterId });
  },

  dismissNotification: async (notificationId: number): Promise<void> => {
    await post<{ ok: boolean }>('/inbox/dismiss', { notification_id: notificationId });
  },

  getNearbyGyms: async (lat: number, lng: number, radius = 3000): Promise<{ results: { name: string; lat: number; lng: number; vicinity: string; place_id: string }[] }> => {
    return get(`/gyms?lat=${lat}&lng=${lng}&radius=${radius}`);
  },

  /* ── Group Goals ── */

  getGroupGoals: async (): Promise<GroupGoal[]> => {
    return get<GroupGoal[]>('/group-goals');
  },

  createGroupGoal: async (payload: CreateGroupGoalRequest): Promise<GroupGoal> => {
    return post<GroupGoal>('/group-goals', payload);
  },

  logGoalProgress: async (goalId: string, amount: number): Promise<GroupGoal> => {
    return post<GroupGoal>(`/group-goals/${goalId}/progress`, { amount });
  },

  leaveGroupGoal: async (goalId: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/group-goals/${goalId}/members`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
    }
  },
};

export type User = {
  profile_id: number,
  email: string,
  username: string,
  bio: string,
  gym_location?: string,
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

export type AltMachResponse = {
  name: string,
  desc: string,
};

export type AltMachEvent = {
  exercise: string
};

export type ExerciseLookupRow = {
  exercise_id: number;
  name: string;
};

export type ExerciseHelp = {
  exercise_id: number;
  name: string;
  advice: string;
  steps: string[];
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

export type GeneratedRecipe = {
  mode: 'recipe' | 'restaurant';
  title: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  based_on_meals: string[];
  based_on_workouts: string[];
  restaurant_suggestions?: RestaurantSuggestion[];
  prompt: string;
};

export type GenerateRecipeRequest = {
  meal_type?: string;
  goal?: string;
  cravings?: string;
  constraints?: string;
  no_cook?: boolean;
};

export type AddGeneratedRecipeToLogRequest = {
  title: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  meal_type?: string;
};

export type RestaurantSuggestion = {
  restaurant: string;
  order: string;
  reason: string;
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

export type LoggedAtHomeMeal = {
  session_meal_id: number;
  profile_id: number;
  meal_id: number;
  meal_name: string;
  date: string;
  servings?: number | null;
  notes?: string | null;
  ingredients: string[];
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  sodium?: number | null;
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

export type WorkoutFeedExercise = {
  exercise_id: number;
  exercise_name: string;
  machine_id?: number | null;
  machine_name?: string | null;
  sets: number;
  reps: number;
  weight?: number | null;
};

export type WorkoutFeedPost = {
  post_id: number;
  session_id: number;
  profile_id: number;
  username: string;
  gym_location?: string | null;
  workout_id: number;
  workout_name: string;
  split_name?: string | null;
  date: string;
  duration: number;
  exercises: WorkoutFeedExercise[];
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

export type QuickWorkoutResponse = {
  workout: string;
  exercises: { machine: string, exercise: string; sets: number; reps: number; weight: number}[];
};

export type quickMuscleEvent = {
  muscles: string[];
}


export type ChatListItem = {
  thread_id: number;
  friend_id: number;
  friend_username: string;
  friend_bio?: string | null;
  friend_gym_location?: string | null;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
};

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export type FriendshipStatusResponse = {
  status: FriendshipStatus;
};

export type ProfileSearchResult = {
  id: number;
  username: string;
  bio: string | null;
  gym_location: string | null;
  workout_streak_weeks?: number;
};

export type ProfileStreak = {
  profile_id: number;
  workout_streak_weeks: number;
  current_week_active: boolean;
  last_workout_date: string | null;
};

export type UnformattedNotification = {
  id: number;
  message: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export type Notification = {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

export type NotificationType = 
  'generic'           // just a message
  | 'friend_request'  // accept/deny friend request
  | 'view_post'       // links to a post, like someone liked your post, friend posted, etc.

export type FriendRequestNotificationData = {
  requesterId: number;
  requesterUsername: string;
};

export type ViewPostNotificationData = {
  postId: number;
  postType: 'workout' | 'meal';
  actorId: number;
  actorUsername: string;
};

export type BlockStatus = {
  i_blocked_them: boolean;
  they_blocked_me: boolean;
};

export type MealPostSource = 'tagged' | 'restaurant';

export type MealPost = {
  post_id: number;
  profile_id: number;
  username: string;
  source: MealPostSource;
  name: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  cuisine?: string | null;
  goal?: string | null;
  complexity?: string | null;
  spice_level?: string | null;
  dietary?: string[];
  restaurant?: string | null;
  category?: string | null;
  meal_type?: string | null;
  created_at: string;
};

export type PublishMealPostRequest = {
  source: MealPostSource;
  name: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  cuisine?: string | null;
  goal?: string | null;
  complexity?: string | null;
  spice_level?: string | null;
  dietary?: string[];
  restaurant?: string | null;
  category?: string | null;
  meal_type?: string | null;
};

export type SavedMealPost = {
  save_id: number;
  post_id: number;
  name: string;
  source: MealPostSource;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  cuisine?: string | null;
  goal?: string | null;
  complexity?: string | null;
  spice_level?: string | null;
  dietary?: string[];
  restaurant?: string | null;
  category?: string | null;
  meal_type?: string | null;
  saved_at: string;
};

export type PostInfo = {
  likes: { user_id: number; username: string }[];
  comments: { user_id: number; username: string; text: string; timestamp: number }[];
  reactions: { user_id: number; username: string; reaction: string }[];
};

export type GoalUnit = 'kg' | 'lbs' | 'km' | 'miles' | 'sessions' | 'calories' | 'steps' | 'minutes';

export type GroupGoalMember = {
  profileId: number;
  username: string;
  progress: number;
  joinedAt: string;
};

export type GroupGoal = {
  goalId: string;
  title: string;
  description: string;
  targetValue: number;
  unit: GoalUnit;
  createdAt: string;
  createdBy: string;
  members: GroupGoalMember[];
  completedAt?: string | null;
};

export type CreateGroupGoalRequest = {
  title: string;
  description: string;
  targetValue: number;
  unit: GoalUnit;
};

export type ReportData = {
  workout_num: number
  top_muscle: string
  bottom_muscle: string
  total_volume: number
  bench_max: number
};
