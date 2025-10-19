'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { initialWorkoutData } from '@/lib/workout-data';

// Definindo os tipos para os dados de treino
type WorkoutSlot = string[]; // Array de nomes de alunos
type WorkoutDay = Record<string, WorkoutSlot>; // Chave é o horário (e.g., "7:00-8:00")
type WorkoutData = Record<string, WorkoutDay>; // Chave é o dia da semana

interface WorkoutContextType {
  workoutData: WorkoutData;
  toggleStudentWorkout: (studentName: string, day: string, time: string, add: boolean) => boolean;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [workoutData, setWorkoutData] = useState<WorkoutData>(initialWorkoutData);

  const toggleStudentWorkout = (studentName: string, day: string, time: string, add: boolean): boolean => {
    
    // Se for para adicionar um aluno
    if (add) {
      const studentsInSlot = workoutData[day]?.[time] || [];
      // Verifica se o horário está cheio
      if (studentsInSlot.length >= 2) {
        return false; // Retorna false se o slot está cheio
      }
      // Adiciona o aluno
      setWorkoutData(prevData => {
        const newData = { ...prevData };
        // Garante que o dia e o horário existam
        if (!newData[day]) newData[day] = {};
        if (!newData[day][time]) newData[day][time] = [];
        
        // Adiciona o aluno se ele já não estiver lá
        if (!newData[day][time].includes(studentName)) {
            newData[day][time] = [...newData[day][time], studentName];
        }
        return newData;
      });
    } else {
      // Se for para remover um aluno
      setWorkoutData(prevData => {
        const newData = { ...prevData };
        if (newData[day]?.[time]?.includes(studentName)) {
            newData[day][time] = newData[day][time].filter(name => name !== studentName);
        }
        return newData;
      });
    }
    return true; // Retorna true se a operação foi bem-sucedida
  };


  return (
    <WorkoutContext.Provider value={{ workoutData, toggleStudentWorkout }}>
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
