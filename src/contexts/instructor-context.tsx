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
} from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  where,
  query,
} from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Instructor } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface InstructorContextType {
  instructors: Instructor[];
  loading: boolean;
  addInstructor: (instructorData: {
    name: string;
    email: string;
    password?: string;
  }) => Promise<void>;
  updateInstructor: (
    instructorId: string,
    updatedData: Partial<Instructor>
  ) => Promise<void>;
  deleteInstructor: (instructorId: string) => Promise<void>;
}

const InstructorContext = createContext<InstructorContextType | undefined>(
  undefined
);

export function InstructorProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const instructorsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'instructors');
  }, [firestore, user]);

  const { data: instructorsData, isLoading: instructorsLoading } =
    useCollection<Instructor>(instructorsQuery);

  const addInstructor = useCallback(
    async (instructorData: {
      name: string;
      email: string;
      password?: string;
    }) => {
      if (!firestore) throw new Error('Firestore not available');

      const functions = getFunctions();
      const createInstructorAccount = httpsCallable(
        functions,
        'createInstructorAccount'
      );

      try {
        await createInstructorAccount({
          email: instructorData.email,
          password: instructorData.password,
          name: instructorData.name,
        });

        // A função de nuvem agora lida com a criação do usuário e do documento.
        // O useCollection atualizará a lista automaticamente.
      } catch (error) {
        console.error('Error creating instructor:', error);
        throw error;
      }
    },
    [firestore]
  );

  const updateInstructor = useCallback(
    async (instructorId: string, updatedData: Partial<Instructor>) => {
      if (!firestore) return;
      const instructorDocRef = doc(firestore, 'instructors', instructorId);
      updateDocumentNonBlocking(instructorDocRef, updatedData);
    },
    [firestore]
  );

  const deleteInstructor = useCallback(
    async (instructorId: string) => {
      if (!firestore) return;

      const functions = getFunctions();
      const deleteInstructorAccount = httpsCallable(
        functions,
        'deleteInstructorAccount'
      );

      try {
        // Chama a função de nuvem para excluir o usuário do Auth
        await deleteInstructorAccount({ uid: instructorId });

        // Exclui o documento do instrutor no Firestore
        const instructorDocRef = doc(firestore, 'instructors', instructorId);
        await deleteDocumentNonBlocking(instructorDocRef);

        // Exclui os alunos associados a este instrutor
        const studentsRef = collection(firestore, 'students');
        const q = query(studentsRef, where('instructorId', '==', instructorId));
        const studentDocs = await getDocs(q);
        const batch = writeBatch(firestore);
        studentDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (error) {
        console.error("Error deleting instructor and their students:", error);
        throw error;
      }
    },
    [firestore]
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
