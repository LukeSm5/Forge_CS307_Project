

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (res.ok) return;

  const data = await res.json().catch(() => ({}));
  throw new Error(data.detail ?? data.message ?? `HTTP ${res.status}`);
}

const TEST_USER: User = {
  email: 'tester@forge307.dev',
  username: 'Testing',
  bio: 'I love testing forge307'
};

export const api = {
  deleteAccount: (userId: number) => del(`/accounts/${userId}`),
  me: async (): Promise<User | undefined> => { 
    return TEST_USER;
  },
  register: async (e: ApiEvent): Promise<User | undefined> => {
    return TEST_USER;
  },
  login: async (e: ApiEvent): Promise<{ access_token: string | undefined }> => {
    return {
      access_token: 'API.LOGIN DEMO TOKEN'
    };
  },
  updateMe: async (e: ApiEvent): Promise<User | undefined> => {
    return TEST_USER;
  },
  changePassword: async (e: ApiEvent): Promise<User | undefined> => {
    return TEST_USER;
  },
  submitOnboarding: async (e: SubmitOnboardingEvent): Promise<boolean> => {
    return true;
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
};

export type User = {
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
  bio: string
};

export type SearchCardioMachineResponse = {
  name: string,
  desc: string,
};

export type SearchCardioMachineEvent = {
  desc: string
};

