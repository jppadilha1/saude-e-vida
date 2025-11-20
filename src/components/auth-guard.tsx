'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { StudentProvider } from '@/contexts/student-context';
import { WorkoutProvider } from '@/contexts/workout-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não estiver carregando e não estiver autenticado, redireciona para o login
    if (!auth.loading && !auth.isAuthenticated) {
      router.push('/login');
      return;
    }

    // Se o usuário é admin e tenta acessar uma página que não é a de administração,
    // redireciona-o para a página correta.
    if (!auth.loading && auth.isAuthenticated && auth.isAdmin) {
      if (pathname !== '/admin/instructors') {
        router.push('/admin/instructors');
      }
    }
  }, [auth.isAuthenticated, auth.loading, auth.isAdmin, pathname, router]);

  // Mostra o loader enquanto carrega as informações de autenticação ou redireciona
  if (auth.loading || !auth.isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se for admin, renderiza o conteúdo da página de admin sem os providers de aluno/treino
  if (auth.isAdmin) {
    return <>{children}</>;
  }

  // Para instrutores, envolve com os providers necessários
  // O StudentProvider deve envolver o WorkoutProvider porque a agenda de treinos (workout)
  // precisa saber quais alunos pertencem ao instrutor para filtrá-los.
  return (
    <StudentProvider>
      <WorkoutProvider>{children}</WorkoutProvider>
    </StudentProvider>
  );
}
