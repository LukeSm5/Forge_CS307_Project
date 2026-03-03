

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
  me: async () => { 
    return TEST_USER;
  },
  register: async (e: ApiEvent) => {
    return TEST_USER;
  },
  login: async (e: ApiEvent) => {
    return {
      access_token: 'API.LOGIN DEMO TOKEN'
    };
  },
  updateMe: async (e: ApiEvent) => {
    return TEST_USER;
  },
  changePassword: async (e: ApiEvent) => {
    return TEST_USER;
  },
};

export type User = {
  email: string,
  username: string,
  bio: string
};

export type ApiEvent = any;
