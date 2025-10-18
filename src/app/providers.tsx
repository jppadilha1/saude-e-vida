'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { StudentProvider } from '@/contexts/student-context';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StudentProvider>{children}</StudentProvider>
    </AuthProvider>
  );
}
