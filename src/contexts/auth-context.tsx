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
  login: (password: string) => boolean;
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
    try {
      const storedAuth = localStorage.getItem(AUTH_KEY);
      if (storedAuth && JSON.parse(storedAuth)) {
        setIsAuthenticated(true);
        // If there's a stored session, ensure we have a Firebase user
        if (!user && !isFirebaseUserLoading) {
          signInAnonymously(firebaseAuth).catch((error) => {
            console.error("Anonymous sign-in failed on session restore:", error);
          });
        }
      }
    } catch (error) {
      console.error('Failed to parse auth state from localStorage', error);
    } finally {
      setLocalLoading(false);
    }
  }, [user, isFirebaseUserLoading, firebaseAuth]);

  const login = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(true));
      setIsAuthenticated(true);
      // Also sign in to Firebase anonymously
      if (!user) {
        signInAnonymously(firebaseAuth).catch((error) => {
          console.error("Anonymous sign-in failed on login:", error);
        });
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    // Note: We are not signing out the anonymous Firebase user
    // to keep the session simple. A full implementation might require it.
  };
  
  // The overall loading state depends on both local storage check and Firebase auth check.
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
