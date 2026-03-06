import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type AuthUser = {
  profile_id?: number;
  email: string;
  username?: string;
};

type AuthContextValue = {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      setLoggedIn: setIsLoggedIn,
      currentUser,
      setCurrentUser,
    }),
    [isLoggedIn, currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
