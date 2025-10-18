import type { Student } from '@/types';
import { subDays, formatISO } from 'date-fns';

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Ana Silva',
    joinDate: formatISO(subDays(new Date(), 45)),
    status: 'Ativo',
    paymentStatus: 'Pago',
    attendance: [
      { date: new Date().toDateString(), present: true },
      { date: subDays(new Date(), 2).toDateString(), present: true },
    ],
  },
  {
    id: '2',
    name: 'Bruno Costa',
    joinDate: formatISO(subDays(new Date(), 90)),
    status: 'Ativo',
    paymentStatus: 'Pendente',
    attendance: [
      { date: subDays(new Date(), 1).toDateString(), present: true },
    ],
  },
  {
    id: '3',
    name: 'Carla Dias',
    joinDate: formatISO(subDays(new Date(), 20)),
    status: 'Ativo',
    paymentStatus: 'Pago',
    attendance: [
       { date: subDays(new Date(), 3).toDateString(), present: true },
    ],
  },
  {
    id: '4',
    name: 'Daniel Martins',
    joinDate: formatISO(subDays(new Date(), 150)),
    status: 'Inativo',
    paymentStatus: 'Pago',
    attendance: [],
  },
  {
    id: '5',
    name: 'Eduarda Ferreira',
    joinDate: formatISO(subDays(new Date(), 60)),
    status: 'Ativo',
    paymentStatus: 'Pendente',
    attendance: [],
  },
  {
    id: '6',
    name: 'Fábio Gomes',
    joinDate: formatISO(subDays(new Date(), 10)),
    status: 'Ativo',
    paymentStatus: 'Pago',
    attendance: [
        { date: new Date().toDateString(), present: true },
    ],
  },
];
