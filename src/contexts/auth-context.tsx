'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth as useFirebaseAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'saude-vida-auth';
const CORRECT_PASSWORD = 'coxinha123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [localLoading, setLocalLoading] = useState<boolean>(true);

  const firebaseAuth = useFirebaseAuth();
  const { user, isUserLoading: isFirebaseUserLoading } = useUser();

  useEffect(() => {
    // This effect syncs local storage auth with Firebase's auth state.
    const syncAuth = async () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_KEY);
        // If we have a stored session, we assume authenticated.
        if (storedAuth && JSON.parse(storedAuth)) {
          setIsAuthenticated(true);
          // If we think we are logged in, but Firebase doesn't have a user,
          // we attempt to sign in anonymously to sync the states.
          if (!user && !isFirebaseUserLoading && firebaseAuth) {
            await signInAnonymously(firebaseAuth);
          }
        }
      } catch (error) {
        console.error('Failed to parse auth state from localStorage', error);
      } finally {
        setLocalLoading(false);
      }
    };
    syncAuth();
  }, [user, isFirebaseUserLoading, firebaseAuth]);

  const login = async (password: string): Promise<boolean> => {
    if (password === CORRECT_PASSWORD) {
      if (firebaseAuth) {
        try {
          // CRITICAL: Wait for Firebase anonymous sign-in to complete
          await signInAnonymously(firebaseAuth);
          // Only after successful Firebase auth, set local state
          localStorage.setItem(AUTH_KEY, JSON.stringify(true));
          setIsAuthenticated(true);
          return true;
        } catch (error) {
          console.error("Anonymous sign-in failed on login:", error);
          return false;
        }
      }
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    // We don't sign out the anonymous Firebase user. This keeps the logic simple
    // and avoids re-triggering Firestore rules issues on rapid logout/login cycles.
    // The user will be re-authenticated on the next login.
  };

  // The overall loading state depends on both the local storage check and the Firebase user check.
  const loading = localLoading || isFirebaseUserLoading;

  const value = { isAuthenticated, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
