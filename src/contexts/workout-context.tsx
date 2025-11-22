'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { initialWorkoutData } from '@/lib/workout-data';
import type { WorkoutData } from '@/types';
import { useAuth } from './auth-context';
import { useFirestore } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface WorkoutContextType {
  workoutData: WorkoutData;
  loading: boolean;
  toggleStudentWorkout: (studentName: string, day: string, time: string, add: boolean) => boolean;
  removeStudentFromSchedule: (studentName: string) => void;
  syncWorkoutData: (studentNames: Set<string>) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { loggedInInstructorId, loading: authLoading } = useAuth();
  
  const [workoutData, setWorkoutData] = useState<WorkoutData>(initialWorkoutData);
  const [workoutLoading, setWorkoutLoading] = useState(true);

  useEffect(() => {
    // Aguarda a autenticação e o firestore estarem prontos
    if (authLoading || !firestore || !loggedInInstructorId) {
      return;
    }

    const workoutDocRef = doc(firestore, 'workoutSchedules', loggedInInstructorId);

    const checkAndInitializeSchedule = async () => {
      setWorkoutLoading(true);
      try {
        const docSnap = await getDoc(workoutDocRef);

        if (docSnap.exists()) {
          // Documento existe, carrega os dados
          setWorkoutData(docSnap.data().schedule as WorkoutData);
        } else {
          // Documento não existe, cria com os dados iniciais
          await setDoc(workoutDocRef, { schedule: initialWorkoutData });
          setWorkoutData(initialWorkoutData);
        }
      } catch (error) {
        console.error("Error checking/creating workout schedule:", error);
        // Em caso de erro, usa os dados locais como fallback
        setWorkoutData(initialWorkoutData);
      } finally {
        setWorkoutLoading(false);
      }
    };

    checkAndInitializeSchedule();
  }, [authLoading, firestore, loggedInInstructorId]);


  const updateFirestoreSchedule = useCallback((newSchedule: WorkoutData) => {
    if (firestore && loggedInInstructorId) {
      const workoutDocRef = doc(firestore, 'workoutSchedules', loggedInInstructorId);
      setDoc(workoutDocRef, { schedule: newSchedule });
    }
  }, [firestore, loggedInInstructorId]);

  const syncWorkoutData = useCallback((studentNames: Set<string>) => {
    const currentSchedule = workoutData;
    const newData = JSON.parse(JSON.stringify(currentSchedule));
    let hasChanged = false;
    
    for (const day in newData) {
      for (const time in newData[day]) {
        const originalLength = newData[day][time].length;
        newData[day][time] = newData[day][time].filter((name: string) => studentNames.has(name));
        if (newData[day][time].length !== originalLength) {
          hasChanged = true;
        }
      }
    }
    
    if (hasChanged) {
      setWorkoutData(newData);
      updateFirestoreSchedule(newData);
    }
  }, [workoutData, updateFirestoreSchedule]);

  const toggleStudentWorkout = (studentName: string, day: string, time: string, add: boolean): boolean => {
    const newSchedule = JSON.parse(JSON.stringify(workoutData));
    
    if (add) {
      const studentsInSlot = newSchedule[day]?.[time] || [];
      if (studentsInSlot.length >= 2) {
        return false; 
      }
      if (!newSchedule[day]) newSchedule[day] = {};
      if (!newSchedule[day][time]) newSchedule[day][time] = [];
      
      if (!newSchedule[day][time].includes(studentName)) {
        newSchedule[day][time] = [...newSchedule[day][time], studentName];
      }
    } else {
      if (newSchedule[day]?.[time]?.includes(studentName)) {
        newSchedule[day][time] = newSchedule[day][time].filter((name:string) => name !== studentName);
      }
    }
    setWorkoutData(newSchedule);
    updateFirestoreSchedule(newSchedule);
    return true;
  };

  const removeStudentFromSchedule = (studentName: string) => {
    const newData = JSON.parse(JSON.stringify(workoutData));
    for (const day in newData) {
      for (const time in newData[day]) {
        const index = newData[day][time].indexOf(studentName);
        if (index > -1) {
          newData[day][time].splice(index, 1);
        }
      }
    }
    setWorkoutData(newData);
    updateFirestoreSchedule(newData);
  };

  const loading = authLoading || workoutLoading;

  return (
    <WorkoutContext.Provider value={{ workoutData, loading, toggleStudentWorkout, removeStudentFromSchedule, syncWorkoutData }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
