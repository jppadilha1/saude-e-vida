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
import type { Student, StudentStatus, PaymentStatus, Attendance } from '@/types';
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
} from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';

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
    updatedData: Partial<Omit<Student, 'id'>>
  ) => void;
  deleteStudent: (studentId: string) => void;
  markAttendance: (studentId: string) => void;
  resetAllPayments: () => void;
  getStudentAttendance: (studentId: string) => Promise<Attendance[]>;
}

const StudentContext = createContext<StudentContextType | undefined>(
  undefined
);

export function StudentProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser(); // Get user and auth loading state

  // Only create the query if the user is authenticated
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
    if (isUserLoading) return; // Wait for auth to be ready
    if (!user) { // If no user, we are done loading
        setAttendanceLoading(false);
        return;
    }
    if (studentsLoading) return; // Wait for students to load

    if (!studentsData || studentsData.length === 0) {
      setAttendanceLoading(false); // No students, so no attendance to fetch.
      return;
    }

    const fetchAllAttendance = async () => {
      setAttendanceLoading(true);
      const newAttendanceData: Record<string, Attendance[]> = {};
      await Promise.all(studentsData.map(async (student) => {
        if (!firestore) return;
        const attendanceRef = collection(
          firestore,
          'students',
          student.id,
          'attendance'
        );
        const attendanceSnapshot = await getDocs(attendanceRef);
        newAttendanceData[student.id] = attendanceSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Attendance)
        );
      }));
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

  // The overall loading state depends on user authentication, students, and attendance
  const loading = isUserLoading || studentsLoading || attendanceLoading;

  const addStudent = (studentData: {
    name: string;
    status: StudentStatus;
    paymentStatus: PaymentStatus;
  }) => {
    if (!firestore) return;
    const studentsCollection = collection(firestore, 'students');
    addDocumentNonBlocking(studentsCollection, {
      ...studentData,
      enrollmentDate: formatISO(new Date()),
    });
  };

  const updateStudent = (
    studentId: string,
    updatedData: Partial<Omit<Student, 'id'>>
  ) => {
    if (!firestore) return;
    const studentDocRef = doc(firestore, 'students', studentId);
    updateDocumentNonBlocking(studentDocRef, updatedData);
  };

  const deleteStudent = (studentId: string) => {
    if (!firestore) return;
    const studentDocRef = doc(firestore, 'students', studentId);
    deleteDocumentNonBlocking(studentDocRef);
  };

  const markAttendance = async (studentId: string) => {
    if (!firestore) return;
    const today = formatISO(new Date(), { representation: 'date' });
    const attendanceRef = collection(
      firestore,
      'students',
      studentId,
      'attendance'
    );
    const q = query(attendanceRef, where('date', '>=', `${today}T00:00:00.000Z`), where('date', '<=', `${today}T23:59:59.999Z`));
    const querySnapshot = await getDocs(q);

    let docToUpdate;
    if (querySnapshot.empty) {
      docToUpdate = doc(attendanceRef); // Create a new doc reference
      setDocumentNonBlocking(docToUpdate, { date: formatISO(new Date()), present: true }, { merge: false });
    } else {
      docToUpdate = querySnapshot.docs[0].ref;
      const currentStatus = querySnapshot.docs[0].data().present;
      updateDocumentNonBlocking(docToUpdate, { present: !currentStatus });
    }
    
    // Optimistically update UI
    setAttendanceData(prev => {
        const studentAttendance = prev[studentId] ? [...prev[studentId]] : [];
        const todayAttendanceIndex = studentAttendance.findIndex(a => isToday(new Date(a.date)));

        if (todayAttendanceIndex > -1) {
            studentAttendance[todayAttendanceIndex].present = !studentAttendance[todayAttendanceIndex].present;
        } else {
            studentAttendance.push({ id: 'temp-id', date: formatISO(new Date()), present: true, studentId: studentId });
        }
        return { ...prev, [studentId]: studentAttendance };
    });
  };

  const resetAllPayments = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    const activeStudentsQuery = query(
      collection(firestore, 'students'),
      where('status', '==', 'Ativo')
    );
    const querySnapshot = await getDocs(activeStudentsQuery);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { paymentStatus: 'Pendente' });
    });
    await batch.commit();
  };
  
    const getStudentAttendance = async (studentId: string): Promise<Attendance[]> => {
    if (!firestore) return [];
    const attendanceRef = collection(
      firestore,
      'students',
      studentId,
      'attendance'
    );
    const attendanceSnapshot = await getDocs(attendanceRef);
    return attendanceSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Attendance)
    );
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
