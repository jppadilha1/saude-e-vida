'use client';

import { useStudent } from '@/contexts/student-context';
import { Loader2 } from 'lucide-react';
import OverviewCards from './overview-cards';
import PendingPaymentsTable from './pending-payments-table';

export default function DashboardClient() {
  const { students, loading } = useStudent();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeStudents = students.filter((s) => s.status === 'Ativo');
  const pendingPayments = students.filter(
    (s) => s.paymentStatus === 'Pendente' && s.status === 'Ativo'
  );

  return (
    <div className="space-y-8">
      <OverviewCards
        activeStudentsCount={activeStudents.length}
        pendingPaymentsCount={pendingPayments.length}
      />
      <PendingPaymentsTable students={pendingPayments} />
    </div>
  );
}
