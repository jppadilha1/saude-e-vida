'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { StudentProvider } from '@/contexts/student-context';
import { WorkoutProvider } from '@/contexts/workout-context';

// O AuthGuard agora envolve o StudentProvider e o WorkoutProvider
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push('/login');
    }
  }, [auth.isAuthenticated, auth.loading, router]);

  if (auth.loading || !auth.isAuthenticated) {
    // Mostra o loader enquanto carrega ou redireciona
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Só renderiza os providers e os filhos se a autenticação for bem-sucedida
  return (
    <WorkoutProvider>
      <StudentProvider>{children}</StudentProvider>
    </WorkoutProvider>
  );
}
