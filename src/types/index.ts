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

// This type is deprecated and replaced by User, but kept for reference if needed.
export type Instructor = {
  id: string;
  name: string;
  email: string;
};

// Represents a user in the 'users' collection in Firestore
export type UserProfile = {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
}


// Estrutura para os dados de treino no Firestore
export type WorkoutData = {
  [day: string]: {
    [time: string]: string[]; // Array de nomes de alunos
  };
};
