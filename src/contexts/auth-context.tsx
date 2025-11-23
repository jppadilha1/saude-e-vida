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
    if (!firebaseAuth || !firestore) {
      console.error('Firebase services not available');
      return false;
    }
    try {
      if (!password) throw new Error('Password is required.');
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // After login, the useDoc hook will fetch the user profile
      return true;
    } catch (error: any) {
      // If the admin user does not exist, create it on the first login attempt.
      if (
        (error.code === 'auth/user-not-found' ||
          error.code === 'auth/invalid-credential') &&
        email.toLowerCase() === 'adm@gmail.com'
      ) {
        try {
          if (!password) throw new Error('Password is required for admin setup.');
          const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          const adminUser = userCredential.user;
          // Create the admin profile in Firestore
          const userDocRef = doc(firestore, 'users', adminUser.uid);
          const adminProfile: UserProfile = {
            id: adminUser.uid,
            name: 'Admin',
            email: adminUser.email!,
            isAdmin: true,
            password: password, // Storing for PoC
          };
          await setDoc(userDocRef, adminProfile);
          return true;
        } catch (signUpError) {
          console.error('Admin account creation failed:', signUpError);
          throw signUpError;
        }
      }
      console.error('Authentication failed:', error);
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
