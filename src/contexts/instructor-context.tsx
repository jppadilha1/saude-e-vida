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
  const firebaseAuth = useFirebaseAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const instructorsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // O admin pode listar todos os instrutores
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
      if (!firestore || !firebaseAuth) throw new Error('Serviços do Firebase indisponíveis');
      if (!instructorData.password) throw new Error('A senha é obrigatória');

      try {
        // Cria o usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          instructorData.email,
          instructorData.password
        );
        const newInstructorUID = userCredential.user.uid;

        // Cria o documento do instrutor no Firestore
        const instructorDocRef = doc(firestore, 'instructors', newInstructorUID);
        await setDoc(instructorDocRef, {
          id: newInstructorUID,
          name: instructorData.name,
          email: instructorData.email,
        });

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
    async (instructorId: string, updatedData: Partial<Instructor>) => {
      if (!firestore) return;
      const instructorDocRef = doc(firestore, 'instructors', instructorId);
      // Usando setDoc com merge para garantir a atualização
      await setDoc(instructorDocRef, updatedData, { merge: true });
    },
    [firestore]
  );

  const deleteInstructor = useCallback(
    async (instructorId: string) => {
      if (!firestore) return;

      // ATENÇÃO: O SDK do cliente não pode excluir usuários do Auth.
      // Esta ação deve ser feita manualmente no console do Firebase
      // ou com uma Cloud Function separada e segura.
      // Aqui, vamos focar em limpar os dados do Firestore.

      try {
        const batch = writeBatch(firestore);

        // 1. Deletar o documento do instrutor
        const instructorDocRef = doc(firestore, 'instructors', instructorId);
        batch.delete(instructorDocRef);

        // 2. Encontrar e deletar os alunos associados
        const studentsRef = collection(firestore, 'students');
        const q = query(studentsRef, where('instructorId', '==', instructorId));
        const studentDocs = await getDocs(q);
        studentDocs.forEach((studentDoc) => {
          batch.delete(studentDoc.ref);
        });

        await batch.commit();

        toast({
          title: 'Dados do Instrutor Removidos',
          description: 'O instrutor e seus alunos foram removidos do Firestore. A conta de autenticação precisa ser removida manualmente.',
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
