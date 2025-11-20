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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  loggedInInstructorId: string | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseAuth = useFirebaseAuth();
  const { user, isUserLoading: isFirebaseUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const isAuthenticated = !!user;
  const loggedInInstructorId = user ? user.uid : null;

  useEffect(() => {
    if (user) {
      setIsAdmin(user.email === 'Adm@gmail.com');
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!firebaseAuth) {
      console.error('Firebase auth service not available');
      return false;
    }
    try {
      if (!password) throw new Error('Password is required.');
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return true;
    } catch (error: any) {
      // If user not found, create a new user
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          if (!password) throw new Error('Password is required for signup.');
          await createUserWithEmailAndPassword(firebaseAuth, email, password);
          return true;
        } catch (signUpError: any) {
          console.error('Authentication and signup failed:', signUpError);
          return false;
        }
      } else {
        console.error('Authentication failed:', error);
        return false;
      }
    }
  };

  const logout = () => {
    if (firebaseAuth) {
      signOut(firebaseAuth);
    }
  };

  const loading = isFirebaseUserLoading;

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    loggedInInstructorId,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
