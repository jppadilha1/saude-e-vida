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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // A query busca todos os usuários que não são administradores
  const instructorsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.isAdmin) return null; // Apenas admins podem listar instrutores
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

      // Verifica se já existe um usuário com este email
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', instructorData.email));
      const existingUserSnapshot = await getDocs(q);
      if (!existingUserSnapshot.empty) {
        throw new Error('Este email já está em uso.');
      }

      // Apenas cria o documento do instrutor no Firestore.
      const userProfile: Omit<UserProfile, 'id'> = {
          name: instructorData.name,
          email: instructorData.email,
          isAdmin: false, // Instrutores não são admins
          password: instructorData.password,
      };
      await addDoc(collection(firestore, 'users'), userProfile);
    },
    [firestore]
  );

  const updateInstructor = useCallback(
    async (instructorId: string, updatedData: Partial<UserProfile>) => {
      if (!firestore) return;
      // Não permite a edição do email ou da senha por este método
      const { email, password, ...safeUpdateData } = updatedData;
      const userDocRef = doc(firestore, 'users', instructorId);
      await setDoc(userDocRef, safeUpdateData, { merge: true });
    },
    [firestore]
  );

  const deleteInstructor = useCallback(
    async (instructorId: string) => {
      if (!firestore) return;

      try {
        const batch = writeBatch(firestore);

        // Deleta o documento do usuário
        const userDocRef = doc(firestore, 'users', instructorId);
        batch.delete(userDocRef);

        // Deleta os alunos associados
        const studentsRef = collection(firestore, 'students');
        const q = query(studentsRef, where('instructorId', '==', instructorId));
        const studentDocs = await getDocs(q);
        studentDocs.forEach((studentDoc) => {
          batch.delete(studentDoc.ref);
        });
        
        // Deleta a agenda de treinos associada
        const workoutDocRef = doc(firestore, 'workoutSchedules', instructorId);
        batch.delete(workoutDocRef);

        await batch.commit();

      } catch (error) {
        console.error("Erro ao deletar dados do instrutor:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Excluir',
            description: 'Não foi possível remover todos os dados associados ao instrutor.'
        });
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
