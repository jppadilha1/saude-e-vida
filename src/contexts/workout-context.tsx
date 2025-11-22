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
    if (!firestore || !loggedInInstructorId) return null;
    return doc(firestore, 'workoutSchedules', loggedInInstructorId);
  }, [firestore, loggedInInstructorId]);

  const { data: workoutDoc, isLoading: workoutLoading } = useDoc<{schedule: WorkoutData}>(workoutDocRef);

  const [localWorkoutData, setLocalWorkoutData] = useState<WorkoutData>(initialWorkoutData);

  useEffect(() => {
    // Se o documento existe no Firestore, usa esses dados.
    if (workoutDoc) {
      setLocalWorkoutData(workoutDoc.schedule);
    } 
    // Se a busca terminou, não estamos autenticando, temos um ID de instrutor,
    // mas o documento não foi encontrado (workoutDoc é null).
    else if (!workoutLoading && !authLoading && loggedInInstructorId) {
      // Isso significa que é a primeira vez que este instrutor acessa a agenda.
      // Vamos criar o documento de agenda para ele no Firestore.
      if(workoutDocRef){
         // Define a agenda inicial no estado local imediatamente para a UI responder.
        setLocalWorkoutData(initialWorkoutData);
        // Envia a agenda inicial para o Firestore para persistência.
        setDoc(workoutDocRef, { schedule: initialWorkoutData });
      }
    }
  }, [workoutDoc, workoutLoading, authLoading, loggedInInstructorId, workoutDocRef]);


  const updateFirestoreSchedule = (newSchedule: WorkoutData) => {
    if (workoutDocRef) {
      // Usando setDoc com merge para garantir que o documento seja criado se não existir,
      // ou atualizado se já existir.
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
    // Cria uma cópia profunda para evitar mutação direta do estado
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
