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
  useUser,
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const { user, isUserLoading } = useUser();

  const studentsRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'students') : null),
    [firestore, user]
  );
  const { data: studentsData, isLoading: studentsLoading } =
    useCollection<Student>(studentsRef);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, Attendance[]>
  >({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !user || studentsLoading || !firestore) return;

    if (!studentsData || studentsData.length === 0) {
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
            const permissionError = new FirestorePermissionError({
              path: attendanceRef.path,
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
          }
        })
      );
      
      setAttendanceData(newAttendanceData);
      setAttendanceLoading(false);
    };

    fetchAllAttendance();
  }, [studentsData, studentsLoading, firestore, user, isUserLoading]);

  const students = useMemo(() => {
    if (!studentsData) return [];
    return studentsData.map((student) => ({
      ...student,
      attendance: attendanceData[student.id] || [],
    }));
  }, [studentsData, attendanceData]);

  const loading = isUserLoading || (!!user && (studentsLoading || attendanceLoading));

  const addStudent = (studentData: {
    name: string;
    status: StudentStatus;
    paymentStatus: PaymentStatus;
  }) => {
    if (!firestore || !user) return;
    const studentsCollection = collection(firestore, 'students');
    addDocumentNonBlocking(studentsCollection, {
      ...studentData,
      enrollmentDate: formatISO(new Date()),
    });
  };

  const updateStudent = (
    studentId: string,
    updatedData: Partial<Omit<Student, 'id'>>,
    originalStudent: Student
  ) => {
    if (!firestore || !user) return;
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
    if (!firestore || !user) return;
    const studentDocRef = doc(firestore, 'students', studentId);
    deleteDocumentNonBlocking(studentDocRef);
  };

  const markAttendance = (studentId: string, present: boolean) => {
    if (!firestore || !user) return;
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
        const permissionError = new FirestorePermissionError({
            path: q.toString(),
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
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
    if (!firestore || !user) return;
    const batch = writeBatch(firestore);
    const activeStudentsQuery = query(
      collection(firestore, 'students'),
      where('status', '==', 'Ativo')
    );
    try {
        const querySnapshot = await getDocs(activeStudentsQuery);
        querySnapshot.forEach((doc) => {
          batch.update(doc.ref, { paymentStatus: 'Pendente' });
        });
        await batch.commit();
    } catch(e) {
        const permissionError = new FirestorePermissionError({
            path: activeStudentsQuery.toString(),
            operation: 'write',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };

    const getStudentAttendance = async (studentId: string): Promise<Attendance[]> => {
    if (!firestore || !user) return [];
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
        const permissionError = new FirestorePermissionError({
            path: attendanceRef.path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        return [];
    }
  };

  const getStudentPayments = async (studentId: string): Promise<Payment[]> => {
    if (!firestore || !user) return [];
    const paymentsRef = collection(firestore, 'students', studentId, 'payments');
    const q = query(paymentsRef, orderBy('paymentDate', 'desc'));
    try {
      const paymentsSnapshot = await getDocs(q);
      return paymentsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Payment)
      );
    } catch (e) {
      const permissionError = new FirestorePermissionError({
        path: paymentsRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
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
