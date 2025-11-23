
import AuthGuard from '@/components/auth-guard';
import AppLayout from '@/components/app-layout';
import StudentsClient from '@/components/students/students-client';
import { WorkoutProvider } from '@/contexts/workout-context';

export default function StudentsPage() {
  return (
    <AuthGuard>
      <AppLayout pageTitle="Gerenciar Alunos">
        <WorkoutProvider>
          <StudentsClient />
        </WorkoutProvider>
      </AppLayout>
    </AuthGuard>
  );
}
