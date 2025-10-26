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
import { instructors } from '@/lib/instructors-data';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (instructorId: string) => Promise<boolean>;
  logout: () => void;
  loggedInInstructorId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'saude-vida-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loggedInInstructorId, setLoggedInInstructorId] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState<boolean>(true);

  const firebaseAuth = useFirebaseAuth();
  const { user, isUserLoading: isFirebaseUserLoading } = useUser();

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.instructorId) {
            setLoggedInInstructorId(authData.instructorId);
            setIsAuthenticated(true);
            if (!user && !isFirebaseUserLoading && firebaseAuth) {
              await signInAnonymously(firebaseAuth);
            }
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

  const login = async (instructorId: string): Promise<boolean> => {
    const isValidInstructor = instructors.some(i => i.id === instructorId);
    if (isValidInstructor && firebaseAuth) {
      try {
        await signInAnonymously(firebaseAuth);
        localStorage.setItem(AUTH_KEY, JSON.stringify({ instructorId }));
        setIsAuthenticated(true);
        setLoggedInInstructorId(instructorId);
        return true;
      } catch (error) {
        console.error("Anonymous sign-in failed on login:", error);
        return false;
      }
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setLoggedInInstructorId(null);
  };

  const loading = localLoading || isFirebaseUserLoading;

  const value = { isAuthenticated, loading, login, logout, loggedInInstructorId };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
