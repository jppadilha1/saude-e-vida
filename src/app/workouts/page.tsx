
import AuthGuard from '@/components/auth-guard';
import AppLayout from '@/components/app-layout';
import WorkoutsClient from '@/components/workouts/workouts-client';
import { WorkoutProvider } from '@/contexts/workout-context';

export default function WorkoutsPage() {
  return (
    <AuthGuard>
      <AppLayout pageTitle="Agenda de Treinos">
        <WorkoutProvider>
          <WorkoutsClient />
        </WorkoutProvider>
      </AppLayout>
    </AuthGuard>
  );
}
