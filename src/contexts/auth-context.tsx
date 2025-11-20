'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth as useFirebaseAuth, useUser } from '@/firebase';
import { 
  signInAnonymously,
  signOut,
  type UserCredential
} from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (instructorId: string, isAdmin?: boolean) => Promise<boolean>;
  logout: () => void;
  loggedInInstructorId: string | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'saude-vida-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loggedInInstructorId, setLoggedInInstructorId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [localLoading, setLocalLoading] = useState<boolean>(true);

  const firebaseAuth = useFirebaseAuth();
  const { user, isUserLoading: isFirebaseUserLoading } = useUser();

  useEffect(() => {
    const syncAuth = () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.instructorId) {
            setLoggedInInstructorId(authData.instructorId);
            setIsAdmin(authData.isAdmin || false);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Failed to parse auth state from localStorage', error);
      } finally {
        setLocalLoading(false);
      }
    };
    syncAuth();
  }, []);

  const login = async (instructorId: string, isAdminFlag = false): Promise<boolean> => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ instructorId, isAdmin: isAdminFlag }));
    setIsAuthenticated(true);
    setLoggedInInstructorId(instructorId);
    setIsAdmin(isAdminFlag);
    return true;
  };

  const logout = () => {
    if(firebaseAuth) {
      signOut(firebaseAuth);
    }
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setLoggedInInstructorId(null);
    setIsAdmin(false);
  };

  const loading = localLoading || isFirebaseUserLoading;

  const value = { isAuthenticated, loading, login, logout, loggedInInstructorId, isAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
