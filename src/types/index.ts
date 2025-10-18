export type PaymentStatus = 'Pago' | 'Pendente';
export type StudentStatus = 'Ativo' | 'Inativo';

export type Attendance = {
  date: string;
  present: boolean;
};

export type Student = {
  id: string;
  name: string;
  enrollmentDate: string; // Renamed from joinDate
  status: StudentStatus;
  paymentStatus: PaymentStatus;
  // Attendance is now a subcollection, so it's not part of the Student type directly
};
