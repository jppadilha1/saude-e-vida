'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from 'react';
import { initialWorkoutData } from '@/lib/workout-data';
import type { WorkoutData } from '@/types';
import { useAuth } from './auth-context';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

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
  
  const workoutDocRef = useMemoFirebase(() => {
    // Só constrói a referência se o ID do instrutor estiver disponível
    if (!firestore || !loggedInInstructorId) return null;
    return doc(firestore, 'workoutSchedules', loggedInInstructorId);
  }, [firestore, loggedInInstructorId]);

  const { data: workoutDoc, isLoading: workoutLoading } = useDoc<{schedule: WorkoutData}>(workoutDocRef);

  const [localWorkoutData, setLocalWorkoutData] = useState<WorkoutData>(initialWorkoutData);

  useEffect(() => {
    // Se a autenticação estiver carregando ou o ID não estiver disponível, não faça nada.
    if (authLoading || !loggedInInstructorId) {
      return;
    }
    
    // Se o documento existe no Firestore, usa esses dados.
    if (workoutDoc) {
      setLocalWorkoutData(workoutDoc.schedule);
    } 
    // Se a busca terminou (workoutLoading é false), temos um ID, mas o doc não existe.
    else if (!workoutLoading && workoutDocRef) {
        // Isso significa que o documento de agenda precisa ser criado.
        setLocalWorkoutData(initialWorkoutData);
        setDoc(workoutDocRef, { schedule: initialWorkoutData });
    }
  }, [workoutDoc, workoutLoading, authLoading, loggedInInstructorId, workoutDocRef]);


  const updateFirestoreSchedule = (newSchedule: WorkoutData) => {
    if (workoutDocRef) {
      setDoc(workoutDocRef, { schedule: newSchedule }, { merge: true });
    }
  };

  const syncWorkoutData = useCallback((studentNames: Set<string>) => {
    const currentSchedule = workoutDoc?.schedule || localWorkoutData;
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
      setLocalWorkoutData(newData);
      updateFirestoreSchedule(newData);
    }
  }, [workoutDoc, localWorkoutData]);

  const toggleStudentWorkout = (studentName: string, day: string, time: string, add: boolean): boolean => {
    const currentSchedule = JSON.parse(JSON.stringify(localWorkoutData));
    
    if (add) {
      const studentsInSlot = currentSchedule[day]?.[time] || [];
      if (studentsInSlot.length >= 2) {
        return false; 
      }
      if (!currentSchedule[day]) currentSchedule[day] = {};
      if (!currentSchedule[day][time]) currentSchedule[day][time] = [];
      
      if (!currentSchedule[day][time].includes(studentName)) {
        currentSchedule[day][time] = [...currentSchedule[day][time], studentName];
      }
    } else {
      if (currentSchedule[day]?.[time]?.includes(studentName)) {
        currentSchedule[day][time] = currentSchedule[day][time].filter((name:string) => name !== studentName);
      }
    }
    setLocalWorkoutData(currentSchedule);
    updateFirestoreSchedule(currentSchedule);
    return true;
  };

  const removeStudentFromSchedule = (studentName: string) => {
    const newData = JSON.parse(JSON.stringify(localWorkoutData));
    for (const day in newData) {
      for (const time in newData[day]) {
        const index = newData[day][time].indexOf(studentName);
        if (index > -1) {
          newData[day][time].splice(index, 1);
        }
      }
    }
    setLocalWorkoutData(newData);
    updateFirestoreSchedule(newData);
  };

  // O carregamento agora depende da autenticação E da busca do documento
  const loading = authLoading || workoutLoading;

  return (
    <WorkoutContext.Provider value={{ workoutData: localWorkoutData, loading, toggleStudentWorkout, removeStudentFromSchedule, syncWorkoutData }}>
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
