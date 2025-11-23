'use client';

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import type { UserProfile } from '@/types';

// O AuthContext agora lida apenas com nosso UserProfile customizado
interface AuthContextType {
  user: UserProfile | null;
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Apenas para o processo de login manual

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.isAdmin || false;
  // O ID do instrutor logado agora vem diretamente do nosso objeto de usuário
  const loggedInInstructorId = isAuthenticated && !isAdmin ? currentUser.id : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!firestore) {
      throw new Error('Serviço de banco de dados indisponível.');
    }
    setLoading(true);

    try {
      const usersRef = collection(firestore, 'users');
      // Busca o usuário pelo email na coleção 'users'
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Credenciais inválidas.');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserProfile;

      // Verifica se a senha corresponde (inseguro, apenas para PoC)
      if (userData.password !== password) {
        throw new Error('Credenciais inválidas.');
      }

      // Login bem-sucedido: define o usuário no estado
      setCurrentUser({ ...userData, id: userDoc.id });
      return true;

    } catch (error: any) {
      setCurrentUser(null);
      throw new Error(error.message || 'Ocorreu um erro durante o login.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Apenas limpa o estado local. Nenhuma interação com Firebase Auth.
    setCurrentUser(null);
  };

  const value = {
    user: currentUser,
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
