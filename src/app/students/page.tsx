import AuthGuard from '@/components/auth-guard';
import AppLayout from '@/components/app-layout';
import StudentsClient from '@/components/students/students-client';

export default function StudentsPage() {
  return (
    <AuthGuard>
      <AppLayout pageTitle="Gerenciar Alunos">
        <StudentsClient />
      </AppLayout>
    </AuthGuard>
  );
}
