'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { formatISO, isToday } from 'date-fns';
import { mockStudents } from '@/lib/data';
import type { Student, StudentStatus, PaymentStatus } from '@/types';

interface StudentContextType {
  students: Student[];
  loading: boolean;
  addStudent: (studentData: { name: string; status: StudentStatus; paymentStatus: PaymentStatus; }) => void;
  updateStudent: (studentId: string, updatedData: Partial<Omit<Student, 'id'>>) => void;
  deleteStudent: (studentId: string) => void;
  markAttendance: (studentId: string) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STUDENTS_KEY = 'saude-vida-students';

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem(STUDENTS_KEY);
      if (storedStudents) {
        setStudents(JSON.parse(storedStudents));
      } else {
        setStudents(mockStudents);
      }
    } catch (error) {
      console.error('Failed to access student data, using mock data.', error);
      setStudents(mockStudents);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    }
  }, [students, loading]);

  const addStudent = (studentData: { name: string; status: StudentStatus; paymentStatus: PaymentStatus; }) => {
    const newStudent: Student = {
      id: crypto.randomUUID(),
      ...studentData,
      joinDate: formatISO(new Date()),
      attendance: [],
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const updateStudent = (studentId: string, updatedData: Partial<Omit<Student, 'id'>>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updatedData } : s))
    );
  };

  const deleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const markAttendance = (studentId: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          const newAttendance = [...student.attendance];
          const todayAttendanceIndex = newAttendance.findIndex(a => isToday(new Date(a.date)));

          if (todayAttendanceIndex > -1) {
            newAttendance[todayAttendanceIndex].present = !newAttendance[todayAttendanceIndex].present;
          } else {
            newAttendance.push({ date: formatISO(new Date()), present: true });
          }
          return { ...student, attendance: newAttendance };
        }
        return student;
      })
    );
  };

  const value = {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    markAttendance,
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
