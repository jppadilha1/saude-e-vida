
import AuthGuard from '@/components/auth-guard';
import AppLayout from '@/components/app-layout';
import WorkoutsClient from '@/components/workouts/workouts-client';

export default function WorkoutsPage() {
  return (
    <AuthGuard>
      <AppLayout pageTitle="Agenda de Treinos">
        <WorkoutsClient />
      </AppLayout>
    </AuthGuard>
  );
}
