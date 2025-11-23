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
  useAuth as useFirebaseClientAuth, // Renomeado para evitar conflito
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
  addDoc,
} from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';

interface InstructorContextType {
  instructors: UserProfile[];
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
  const { user, loading: authLoading } = useAuth(); // Usando nosso auth context manual
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
      if (!firestore) throw new Error('Serviços do Firebase indisponíveis');
      if (!instructorData.password) throw new Error('A senha é obrigatória');

      try {
        // Apenas cria o documento do instrutor no Firestore.
        // A autenticação agora é manual.
        const userProfile: Omit<UserProfile, 'id'> = {
            name: instructorData.name,
            email: instructorData.email,
            isAdmin: false, // Instructors are not admins
            password: instructorData.password,
        };
        await addDoc(collection(firestore, 'users'), userProfile);

      } catch (error: any) {
        console.error('Erro ao criar instrutor:', error);
        throw new Error('Erro desconhecido ao criar conta.');
      }
    },
    [firestore]
  );

  const updateInstructor = useCallback(
    async (instructorId: string, updatedData: Partial<UserProfile>) => {
      if (!firestore) return;
      const userDocRef = doc(firestore, 'users', instructorId);
      await setDoc(userDocRef, updatedData, { merge: true });
    },
    [firestore]
  );

  const deleteInstructor = useCallback(
    async (instructorId: string) => {
      if (!firestore) return;

      try {
        const batch = writeBatch(firestore);

        const userDocRef = doc(firestore, 'users', instructorId);
        batch.delete(userDocRef);

        const studentsRef = collection(firestore, 'students');
        const q = query(studentsRef, where('instructorId', '==', instructorId));
        const studentDocs = await getDocs(q);
        studentDocs.forEach((studentDoc) => {
          batch.delete(studentDoc.ref);
        });
        
        const workoutDocRef = doc(firestore, 'workoutSchedules', instructorId);
        batch.delete(workoutDocRef);

        await batch.commit();

        toast({
          title: 'Instrutor Removido',
          description: 'O instrutor e seus dados associados foram removidos do sistema.',
        });

      } catch (error) {
        console.error("Erro ao deletar dados do instrutor:", error);
        throw error;
      }
    },
    [firestore, toast]
  );

  const loading = authLoading || instructorsLoading;

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
