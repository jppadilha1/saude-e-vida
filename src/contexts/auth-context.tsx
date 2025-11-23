'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth as useFirebaseAuth, useUser as useFirebaseUser, useFirestore } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
} from 'firebase/firestore';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null; // Alterado de User para UserProfile
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
  const firestore = useFirestore();
  // Mantemos o signOut do Firebase Auth para limpar qualquer sessão antiga, se houver.
  const firebaseAuth = useFirebaseAuth(); 

  // O estado agora será controlado manualmente, não pelo onAuthStateChanged
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Simplificamos o estado de loading

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.isAdmin || false;
  const loggedInInstructorId = currentUser ? currentUser.id : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!firestore) {
      throw new Error('Serviço de banco de dados indisponível.');
    }
    setLoading(true);

    try {
      // 1. Criar a query para buscar o usuário pelo email
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email));

      // 2. Executar a query
      const querySnapshot = await getDocs(q);

      // 3. Verificar se o usuário foi encontrado
      if (querySnapshot.empty) {
        // Usuário com o email fornecido não existe
        throw new Error('Credenciais inválidas.');
      }

      // 4. Pegar os dados do primeiro documento encontrado (deve ser único)
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserProfile;

      // 5. Verificar se a senha corresponde
      if (userData.password !== password) {
        // Senha incorreta
        throw new Error('Credenciais inválidas.');
      }

      // 6. Login bem-sucedido: definir o usuário no estado
      setCurrentUser({ ...userData, id: userDoc.id });
      return true;

    } catch (error: any) {
      // Limpa o usuário em caso de erro e propaga a mensagem
      setCurrentUser(null);
      // Retornamos a mensagem de erro específica ou uma genérica
      throw new Error(error.message || 'Ocorreu um erro durante o login.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Limpa o estado de usuário manual
    setCurrentUser(null);
    // Também executa o signOut do Firebase para garantir que qualquer sessão residual seja limpa
    if (firebaseAuth) {
      signOut(firebaseAuth);
    }
  };

  const value = {
    user: currentUser, // Agora o 'user' é o nosso objeto UserProfile
    userProfile: currentUser,
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
