'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { initialWorkoutData } from '@/lib/workout-data';
import type { WorkoutData } from '@/types';
import { useAuth } from './auth-context';
import { useFirestore } from '@/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    if (!firestore || !loggedInInstructorId || authLoading) {
      if (!authLoading) {
        setWorkoutLoading(false);
      }
      return;
    }

    // O caminho agora é 'workouts'
    const workoutDocRef = doc(firestore, 'workouts', loggedInInstructorId);

    // Usamos onSnapshot para escutar em tempo real.
    // Ele lida com a criação do documento se não existir.
    const unsubscribe = onSnapshot(workoutDocRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          // Documento existe, carregamos os dados.
          setWorkoutData(snapshot.data().schedule as WorkoutData);
        } else {
          // Documento não existe. Criamos ele.
          // A regra "allow write" permitirá isso.
          setDoc(workoutDocRef, { schedule: initialWorkoutData })
            .then(() => {
              setWorkoutData(initialWorkoutData);
            })
            .catch(error => {
              const permissionError = new FirestorePermissionError({
                  path: workoutDocRef.path,
                  operation: 'create',
                  requestResourceData: { schedule: initialWorkoutData }
              });
              errorEmitter.emit('permission-error', permissionError);
            });
        }
        setWorkoutLoading(false);
      }, 
      (error) => {
        // Erro ao tentar escutar o documento.
        const permissionError = new FirestorePermissionError({
            path: workoutDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setWorkoutLoading(false);
      }
    );

    return () => {
      // Limpa a escuta quando o componente é desmontado.
      unsubscribe();
    };

  }, [firestore, loggedInInstructorId, authLoading]);

  const updateFirestoreSchedule = useCallback((newSchedule: WorkoutData) => {
    if (firestore && loggedInInstructorId) {
      const workoutDocRef = doc(firestore, 'workouts', loggedInInstructorId);
      // A regra `allow write` protegerá esta operação
      setDoc(workoutDocRef, { schedule: newSchedule }, { merge: true })
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: workoutDocRef.path,
                operation: 'update',
                requestResourceData: { schedule: newSchedule }
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  }, [firestore, loggedInInstructorId]);

  const syncWorkoutData = useCallback((studentNames: Set<string>) => {
    setWorkoutData(currentSchedule => {
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
            updateFirestoreSchedule(newData);
            return newData;
        }
        return currentSchedule;
    });
  }, [updateFirestoreSchedule]);

  const toggleStudentWorkout = (studentName: string, day: string, time: string, add: boolean): boolean => {
    let success = true;
    setWorkoutData(currentSchedule => {
        const newSchedule = JSON.parse(JSON.stringify(currentSchedule));
        
        if (add) {
            const studentsInSlot = newSchedule[day]?.[time] || [];
            if (studentsInSlot.length >= 2) {
                success = false; 
                return currentSchedule;
            }
            if (!newSchedule[day]) newSchedule[day] = {};
            if (!newSchedule[day][time]) newSchedule[day][time] = [];
            
            if (!newSchedule[day][time].includes(studentName)) {
                newSchedule[day][time].push(studentName);
            }
        } else {
            if (newSchedule[day]?.[time]?.includes(studentName)) {
                newSchedule[day][time] = newSchedule[day][time].filter((name:string) => name !== studentName);
            }
        }
        updateFirestoreSchedule(newSchedule);
        return newSchedule;
    });
    return success;
  };

  const removeStudentFromSchedule = (studentName: string) => {
    setWorkoutData(currentSchedule => {
        const newData = JSON.parse(JSON.stringify(currentSchedule));
        let hasChanged = false;
        for (const day in newData) {
        for (const time in newData[day]) {
            const index = newData[day][time].indexOf(studentName);
            if (index > -1) {
            newData[day][time].splice(index, 1);
            hasChanged = true;
            }
        }
        }
        if (hasChanged) {
            updateFirestoreSchedule(newData);
            return newData;
        }
        return currentSchedule;
    });
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
