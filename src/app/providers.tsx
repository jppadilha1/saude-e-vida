'use client';

import { AuthProvider } from '@/contexts/auth-context';
import type { ReactNode } from 'react';

// Providers agora só contém o AuthProvider, que é global.
// O StudentProvider será usado de forma mais específica nas rotas protegidas.
export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
