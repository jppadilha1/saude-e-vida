'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
} from 'react';
import { formatISO, isToday } from 'date-fns';
import type { Student, StudentStatus, PaymentStatus, Attendance, Payment } from '@/types';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { useAuth } from './auth-context';

type StudentWithAttendance = Student & { attendance: Attendance[] };

interface StudentContextType {
  students: StudentWithAttendance[];
  loading: boolean;
  addStudent: (studentData: {
    name: string;
    status: StudentStatus;
    paymentStatus: PaymentStatus;
  }) => void;
  updateStudent: (
    studentId: string,
    updatedData: Partial<Omit<Student, 'id'>>,
    originalStudent: Student
  ) => void;
  deleteStudent: (studentId: string) => void;
  markAttendance: (studentId: string, present: boolean) => void;
  resetAllPayments: () => void;
  getStudentAttendance: (studentId: string) => Promise<Attendance[]>;
  getStudentPayments: (studentId: string) => Promise<Payment[]>;
}

const StudentContext = createContext<StudentContextType | undefined>(
  undefined
);

export function StudentProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  // Usa o loggedInInstructorId do nosso auth-context manual
  const { loggedInInstructorId, loading: authLoading } = useAuth();

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !loggedInInstructorId) return null;
    return query(
      collection(firestore, 'students'),
      where('instructorId', '==', loggedInInstructorId)
    );
  }, [firestore, loggedInInstructorId]);

  const { data: studentsData, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  
  const [attendanceData, setAttendanceData] = useState<
    Record<string, Attendance[]>
  >({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    if (studentsLoading || !firestore || !studentsData) {
        if (!studentsLoading) {
            setAttendanceLoading(false);
        }
        return;
    };

    if (studentsData.length === 0) {
      setAttendanceLoading(false);
      setAttendanceData({});
      return;
    }

    const fetchAllAttendance = async () => {
      setAttendanceLoading(true);
      const newAttendanceData: Record<string, Attendance[]> = {};
      
      await Promise.all(
        studentsData.map(async (student) => {
          const attendanceRef = collection(
            firestore,
            'students',
            student.id,
            'attendance'
          );
          try {
            const attendanceSnapshot = await getDocs(attendanceRef);
            newAttendanceData[student.id] = attendanceSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Attendance)
            );
          } catch (error) {
            console.error(`Falha ao buscar presenças para o aluno ${student.id}:`, error);
          }
        })
      );
      
      setAttendanceData(newAttendanceData);
      setAttendanceLoading(false);
    };

    fetchAllAttendance();
  }, [studentsData, studentsLoading, firestore]);

  const students = useMemo(() => {
    if (!studentsData) return [];
    return studentsData.map((student) => ({
      ...student,
      attendance: attendanceData[student.id] || [],
    }));
  }, [studentsData, attendanceData]);

  const loading = authLoading || studentsLoading || attendanceLoading;

  const addStudent = (studentData: {
    name: string;
    status: StudentStatus;
    paymentStatus: PaymentStatus;
  }) => {
    if (!firestore || !loggedInInstructorId) return;
    const studentsCollection = collection(firestore, 'students');
    addDocumentNonBlocking(studentsCollection, {
      ...studentData,
      enrollmentDate: formatISO(new Date()),
      instructorId: loggedInInstructorId,
    });
  };

  const updateStudent = (
    studentId: string,
    updatedData: Partial<Omit<Student, 'id'>>,
    originalStudent: Student
  ) => {
    if (!firestore) return;
    const studentDocRef = doc(firestore, 'students', studentId);
    updateDocumentNonBlocking(studentDocRef, updatedData);

    if (updatedData.paymentStatus === 'Pago' && originalStudent.paymentStatus !== 'Pago') {
      const paymentsCollection = collection(firestore, 'students', studentId, 'payments');
      addDocumentNonBlocking(paymentsCollection, {
        studentId: studentId,
        paymentDate: formatISO(new Date()),
      });
    }
  };

  const deleteStudent = (studentId: string) => {
    if (!firestore) return;
    const studentDocRef = doc(firestore, 'students', studentId);
    deleteDocumentNonBlocking(studentDocRef);
  };

  const markAttendance = (studentId: string, present: boolean) => {
    if (!firestore) return;
    const today = formatISO(new Date(), { representation: 'date' });
    const attendanceRef = collection(firestore, 'students', studentId, 'attendance');
    const q = query(
      attendanceRef,
      where('date', '>=', `${today}T00:00:00.000Z`),
      where('date', '<=', `${today}T23:59:59.999Z`)
    );

    getDocs(q).then(querySnapshot => {
      let docToUpdate;
      if (querySnapshot.empty) {
        docToUpdate = doc(attendanceRef);
        const data = { date: formatISO(new Date()), present, studentId: studentId };
        setDocumentNonBlocking(docToUpdate, data, {});
      } else {
        docToUpdate = querySnapshot.docs[0].ref;
        const data = { present };
        updateDocumentNonBlocking(docToUpdate, data);
      }
    }).catch(error => {
        console.error("Erro ao marcar presença:", error);
    });

    setAttendanceData(prev => {
        const studentAttendance = prev[studentId] ? [...prev[studentId]] : [];
        const todayAttendanceIndex = studentAttendance.findIndex(a => isToday(new Date(a.date)));

        if (todayAttendanceIndex > -1) {
            studentAttendance[todayAttendanceIndex].present = present;
        } else {
            const newId = `temp-${Date.now()}`;
            studentAttendance.push({ id: newId, date: formatISO(new Date()), present, studentId: studentId });
        }
        return { ...prev, [studentId]: studentAttendance };
    });
  };

  const resetAllPayments = async () => {
    if (!firestore || !studentsQuery) return;
    const batch = writeBatch(firestore);
    try {
        const querySnapshot = await getDocs(studentsQuery);
        querySnapshot.forEach((doc) => {
          batch.update(doc.ref, { paymentStatus: 'Pendente' });
        });
        await batch.commit();
    } catch(e) {
       console.error("Erro ao resetar mensalidades:", e);
    }
  };

    const getStudentAttendance = async (studentId: string): Promise<Attendance[]> => {
    if (!firestore) return [];
    const attendanceRef = collection(
      firestore,
      'students',
      studentId,
      'attendance'
    );
    try {
        const attendanceSnapshot = await getDocs(attendanceRef);
        return attendanceSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Attendance)
        );
    } catch (e) {
        console.error("Erro ao buscar histórico de presença:", e);
        return [];
    }
  };

  const getStudentPayments = async (studentId: string): Promise<Payment[]> => {
    if (!firestore) return [];
    const paymentsRef = collection(firestore, 'students', studentId, 'payments');
    const q = query(paymentsRef, orderBy('paymentDate', 'desc'));
    try {
      const paymentsSnapshot = await getDocs(q);
      return paymentsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Payment)
      );
    } catch (e) {
        console.error("Erro ao buscar histórico de pagamentos:", e);
        return [];
    }
  };


  const value = {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    markAttendance,
    resetAllPayments,
    getStudentAttendance,
    getStudentPayments,
  };

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
