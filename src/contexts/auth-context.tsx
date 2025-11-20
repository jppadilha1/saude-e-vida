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
  signOut,
  type User
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
  
  // The source of truth for authentication is now the `user` from `useUser`.
  const isAuthenticated = !!user;
  const loggedInInstructorId = user ? user.uid : null;
  
  useEffect(() => {
    if (user) {
      // Check if the logged-in user is the admin
      setIsAdmin(user.email === 'Adm@gmail.com');
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!firebaseAuth) {
      console.error("Firebase auth service not available");
      return false;
    }
    try {
      if (!password) throw new Error("Password is required.");
      // Firebase handles the authentication.
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // onAuthStateChanged will handle setting the user state.
      return true;
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  };

  const logout = () => {
    if(firebaseAuth) {
      signOut(firebaseAuth);
    }
    // No need to manually clear state, onAuthStateChanged will do it.
  };

  const loading = isFirebaseUserLoading;

  const value = { user, isAuthenticated, loading, login, logout, loggedInInstructorId, isAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
