import AuthGuard from '@/components/auth-guard';
import AppLayout from '@/components/app-layout';
import DashboardClient from '@/components/dashboard/dashboard-client';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppLayout pageTitle="Painel">
        <DashboardClient />
      </AppLayout>
    </AuthGuard>
  );
}
