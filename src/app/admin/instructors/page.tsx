'use client';

import AuthGuard from '@/components/auth-guard';
import AppLayout from '@/components/app-layout';
import InstructorsClient from '@/components/admin/instructors-client';
import { InstructorProvider } from '@/contexts/instructor-context';

export default function AdminInstructorsPage() {
  return (
    <AuthGuard>
      <InstructorProvider>
        <AppLayout pageTitle="Gerenciar Instrutores">
          <InstructorsClient />
        </AppLayout>
      </InstructorProvider>
    </AuthGuard>
  );
}
