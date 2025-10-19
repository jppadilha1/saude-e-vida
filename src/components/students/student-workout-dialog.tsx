'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Student } from '@/types';
import { workoutData } from '@/lib/workout-data';

interface StudentWorkoutDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  student: Student | null;
}

type WorkoutEntry = {
  day: string;
  time: string;
};

export function StudentWorkoutDialog({
  isOpen,
  setIsOpen,
  student,
}: StudentWorkoutDialogProps) {
  if (!student) return null;

  const studentWorkouts: WorkoutEntry[] = [];
  for (const day in workoutData) {
    for (const time in workoutData[day]) {
      if (workoutData[day][time].includes(student.name)) {
        studentWorkouts.push({ day, time });
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agenda de Treino: {student.name}</DialogTitle>
          <DialogDescription>
            Abaixo estão os dias e horários dos treinos agendados para este aluno.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {studentWorkouts.length > 0 ? (
            <ul className="space-y-3">
              {studentWorkouts.map((workout, index) => (
                <li key={index} className="flex justify-between items-center p-3 bg-accent rounded-md">
                  <span className="font-semibold">{workout.day}</span>
                  <span className="text-muted-foreground">{workout.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum treino encontrado para este aluno.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
