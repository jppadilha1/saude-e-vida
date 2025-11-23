'use client';

import React, {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
} from 'react';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser,
  useAuth as useFirebaseAuth,
} from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  where,
  query,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { UserProfile } from '@/types'; // Changed from Instructor to UserProfile
import { useToast } from '@/hooks/use-toast';

interface InstructorContextType {
  instructors: UserProfile[]; // Changed from Instructor to UserProfile
  loading: boolean;
  addInstructor: (instructorData: {
    name: string;
    email: string;
    password?: string;
  }) => Promise<void>;
  updateInstructor: (
    instructorId: string,
    updatedData: Partial<UserProfile>
  ) => Promise<void>;
  deleteInstructor: (instructorId: string) => Promise<void>;
}

const InstructorContext = createContext<InstructorContextType | undefined>(
  undefined
);

export function InstructorProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const firebaseAuth = useFirebaseAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const instructorsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query the 'users' collection for non-admin users
    return query(collection(firestore, 'users'), where('isAdmin', '==', false));
  }, [firestore, user]);

  const { data: instructorsData, isLoading: instructorsLoading } =
    useCollection<UserProfile>(instructorsQuery);

  const addInstructor = useCallback(
    async (instructorData: {
      name: string;
      email: string;
      password?: string;
    }) => {
      if (!firestore || !firebaseAuth) throw new Error('Serviços do Firebase indisponíveis');
      if (!instructorData.password) throw new Error('A senha é obrigatória');

      try {
        // Creates the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          instructorData.email,
          instructorData.password
        );
        const newInstructorUID = userCredential.user.uid;

        // Creates the instructor's document in the 'users' collection in Firestore
        const userDocRef = doc(firestore, 'users', newInstructorUID);
        const userProfile: UserProfile = {
            id: newInstructorUID,
            name: instructorData.name,
            email: instructorData.email,
            isAdmin: false, // Instructors are not admins
        };
        await setDoc(userDocRef, userProfile);

      } catch (error: any) {
        console.error('Erro ao criar instrutor:', error);
        if (error.code === 'auth/email-already-in-use') {
          throw new Error('Este email já está em uso.');
        }
        throw new Error('Erro desconhecido ao criar conta.');
      }
    },
    [firestore, firebaseAuth]
  );

  const updateInstructor = useCallback(
    async (instructorId: string, updatedData: Partial<UserProfile>) => {
      if (!firestore) return;
      const userDocRef = doc(firestore, 'users', instructorId);
      // Use setDoc with merge to ensure update
      await setDoc(userDocRef, updatedData, { merge: true });
    },
    [firestore]
  );

  const deleteInstructor = useCallback(
    async (instructorId: string) => {
      if (!firestore) return;

      // This action only removes the user from the Firestore 'users' collection.
      // The auth account remains, but without access, as per security rules.
      // For full deletion, manual removal in Firebase Console or a backend function is needed.

      try {
        const batch = writeBatch(firestore);

        // 1. Delete the user document from 'users' collection
        const userDocRef = doc(firestore, 'users', instructorId);
        batch.delete(userDocRef);

        // 2. Find and delete associated students
        const studentsRef = collection(firestore, 'students');
        const q = query(studentsRef, where('instructorId', '==', instructorId));
        const studentDocs = await getDocs(q);
        studentDocs.forEach((studentDoc) => {
          batch.delete(studentDoc.ref);
        });
        
        // 3. Find and delete associated workout schedule
        const workoutDocRef = doc(firestore, 'workoutSchedules', instructorId);
        batch.delete(workoutDocRef);

        await batch.commit();

        toast({
          title: 'Dados do Instrutor Removidos',
          description: 'O instrutor e seus dados associados foram removidos do sistema. A conta de autenticação precisará ser removida manualmente se desejado.',
        });

      } catch (error) {
        console.error("Erro ao deletar dados do instrutor:", error);
        throw error;
      }
    },
    [firestore, toast]
  );

  const loading = isUserLoading || instructorsLoading;

  const value = {
    instructors: instructorsData || [],
    loading,
    addInstructor,
    updateInstructor,
    deleteInstructor,
  };

  return (
    <InstructorContext.Provider value={value}>
      {children}
    </InstructorContext.Provider>
  );
}

export function useInstructor() {
  const context = useContext(InstructorContext);
  if (context === undefined) {
    throw new Error('useInstructor must be used within an InstructorProvider');
  }
  return context;
}
