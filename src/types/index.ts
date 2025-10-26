export type PaymentStatus = 'Pago' | 'Pendente';
export type StudentStatus = 'Ativo' | 'Inativo';

export type Attendance = {
  id: string;
  studentId: string;
  date: string;
  present: boolean;
};

export type BodyMeasurements = {
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
};

export type Student = {
  id: string;
  instructorId: string;
  name: string;
  enrollmentDate: string;
  status: StudentStatus;
  paymentStatus: PaymentStatus;
  height?: number; // in cm
  weight?: number; // in kg
  bodyMeasurements?: BodyMeasurements;
  notes?: string;
};

export type Payment = {
  id: string;
  studentId: string;
  paymentDate: string;
};

export type Instructor = {
  id: string;
  name: string;
};
