'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth as useFirebaseAuth, useUser as useFirebaseUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loggedInInstructorId: string | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseAuth = useFirebaseAuth();
  const firestore = useFirestore();
  const { user, isUserLoading: isFirebaseUserLoading } = useFirebaseUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = !!userProfile?.isAdmin;
  const isAuthenticated = !!user && !!userProfile;
  const loggedInInstructorId = user ? user.uid : null;

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!firebaseAuth) {
      console.error('Firebase Auth service not available');
      throw new Error('Serviço de autenticação indisponível.');
    }
    if (!password) {
      throw new Error('A senha é obrigatória.');
    }

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // O sucesso do login fará com que o hook useUser e useDoc
      // atualizem os estados user e userProfile, acionando a lógica de redirecionamento
      // na UI.
      return true;
    } catch (error: any) {
      console.error('Authentication failed:', error);
      // Propaga o erro para ser tratado pela UI (ex: toast de erro na página de login)
      throw error;
    }
  };

  const logout = () => {
    if (firebaseAuth) {
      signOut(firebaseAuth);
    }
  };

  // The overall loading state depends on both Firebase Auth and Firestore profile loading.
  const loading = isFirebaseUserLoading || (!!user && isProfileLoading);

  const value = {
    user,
    userProfile,
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
