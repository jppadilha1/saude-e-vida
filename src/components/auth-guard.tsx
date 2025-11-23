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
    if (auth.loading) {
      return; // Aguarda a autenticação ser carregada
    }

    // 1. Redireciona usuários não autenticados para o login
    if (!auth.isAuthenticated) {
      router.push('/login');
      return;
    }

    // 2. Protege as rotas de administrador
    if (pathname.startsWith('/admin')) {
      if (!auth.isAdmin) {
        // Se não for admin e tentar acessar /admin, redireciona para a home
        router.push('/');
      }
      // Se for admin, pode ficar
    } else {
      // 3. Se for admin e estiver fora da área de admin, redireciona para lá
      if (auth.isAdmin) {
        router.push('/admin/instructors');
      }
      // Se não for admin e estiver fora da área de admin, pode ficar
    }
  }, [auth.isAuthenticated, auth.loading, auth.isAdmin, pathname, router]);

  // Mostra o loader enquanto carrega as informações de autenticação ou redireciona
  if (auth.loading || !auth.user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se a rota for de admin e o usuário não for admin, o useEffect já terá redirecionado.
  // Se ele for admin, pode renderizar o conteúdo.
  if (pathname.startsWith('/admin') && auth.isAdmin) {
    return <>{children}</>;
  }

  // Se não for rota de admin e não for admin, renderiza com os providers.
  // A verificação !auth.loading garante que os providers só renderizem com o user disponível.
  if (!pathname.startsWith('/admin') && !auth.isAdmin && !auth.loading) {
    // O WorkoutProvider foi removido daqui e movido para sua página específica
    return <StudentProvider>{children}</StudentProvider>;
  }

  // Renderiza um loader como fallback enquanto o redirecionamento do useEffect acontece
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
