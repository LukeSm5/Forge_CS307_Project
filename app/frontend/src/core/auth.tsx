import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken } from '@/core/api';

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
  isLoadingAuth: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const savedRefreshToken = await AsyncStorage.getItem('refresh_token');

        if (!savedRefreshToken) return;

        const res = await fetch('http://localhost:8000/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: savedRefreshToken }),
        });


        if (!res.ok) {
          await AsyncStorage.removeItem('refresh_token');
          return;
        }

        const data = await res.json();
        setToken(data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);

        const meRes = await fetch('http://localhost:8000/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });


        if (meRes.ok) {
          const me = await meRes.json();
          setCurrentUser({ profile_id: me.profile_id, email: me.email, username: me.username });
          setIsLoggedIn(true);
        }
      } catch (e) {
      } finally {
        setIsLoadingAuth(false);
      }
    };

    tryRefresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isLoggedIn, setLoggedIn: setIsLoggedIn, currentUser, setCurrentUser, isLoadingAuth }),
    [isLoggedIn, currentUser, isLoadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}