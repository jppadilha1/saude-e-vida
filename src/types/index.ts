export type PaymentStatus = 'Pago' | 'Pendente';
export type StudentStatus = 'Ativo' | 'Inativo';

export type Attendance = {
  date: string;
  present: boolean;
};

export type Student = {
  id: string;
  name: string;
  joinDate: string;
  status: StudentStatus;
  paymentStatus: PaymentStatus;
  attendance: Attendance[];
};
