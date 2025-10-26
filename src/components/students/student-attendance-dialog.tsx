'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useStudent } from '@/contexts/student-context';
import { useWorkout } from '@/contexts/workout-context';
import type { Student, Attendance } from '@/types';
import { format, isToday, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, CalendarX } from 'lucide-react';

type StudentWithAttendance = Student & { attendance: Attendance[] };

interface StudentAttendanceDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  student: StudentWithAttendance | null;
}

// Mapeia o índice do dia da semana de date-fns (0=Dom, 1=Seg, ...) para o nome do dia.
const dayIndexToName: { [key: number]: string } = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  0: 'Domingo',
};

export function StudentAttendanceDialog({
  isOpen,
  setIsOpen,
  student,
}: StudentAttendanceDialogProps) {
  const { markAttendance } = useStudent();
  const { workoutData } = useWorkout();

  // Encontra os dias de treino agendados para o aluno
  const studentWorkoutDays = useMemo(() => {
    if (!student) return new Set();
    const days = new Set<string>();
    for (const day in workoutData) {
      for (const time in workoutData[day]) {
        if (workoutData[day][time].includes(student.name)) {
          days.add(day);
        }
      }
    }
    return days;
  }, [student, workoutData]);

  const isTrainingDayToday = useMemo(() => {
    const todayIndex = getDay(new Date());
    const todayName = dayIndexToName[todayIndex];
    return studentWorkoutDays.has(todayName);
  }, [studentWorkoutDays]);

  if (!student) return null;

  const hasAttendedToday = student.attendance.find((a) => isToday(new Date(a.date)))?.present;

  // Filtra o histórico para mostrar apenas os dias de treino
  const filteredAttendance = student.attendance.filter(record => {
    const recordDayIndex = getDay(parseISO(record.date));
    const recordDayName = dayIndexToName[recordDayIndex];
    return studentWorkoutDays.has(recordDayName);
  });

  const sortedAttendance = [...filteredAttendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Presença: {student.name}</DialogTitle>
          <DialogDescription>
            Marque a presença de hoje e visualize o histórico de aulas do aluno, filtrado pelos dias de treino agendados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <h4 className="font-semibold">Presença de Hoje</h4>
             <div className="mt-2 flex items-center gap-2 rounded-lg border p-4">
              {!isTrainingDayToday ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarX className="h-5 w-5" />
                  <span className="font-semibold">Hoje não é um dia de treino para este aluno.</span>
                </div>
              ) : hasAttendedToday ? (
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Aluno presente hoje.</span>
                </div>
              ) : hasAttendedToday === false ? (
                 <p className="font-semibold text-red-600">Aluno ausente hoje.</p>
              ) : (
                <p className="text-muted-foreground">A presença de hoje ainda não foi marcada.</p>
              )}
               <div className="ml-auto flex gap-2">
                <Button size="sm" variant="default" onClick={() => markAttendance(student.id, true)} disabled={!isTrainingDayToday || hasAttendedToday === true}>
                  Marcar Presença
                </Button>
                 <Button size="sm" variant="destructive" onClick={() => markAttendance(student.id, false)} disabled={!isTrainingDayToday || hasAttendedToday === false}>
                  Marcar Falta
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Histórico de Aulas (Apenas dias de treino)</h4>
            <div className="mt-2 max-h-80 overflow-y-auto rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedAttendance.length > 0 ? (
                    sortedAttendance.map((record) => (
                        <TableRow key={record.id}>
                        <TableCell className="font-medium">
                            {format(parseISO(record.date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                            {record.present ? (
                            <span className="text-green-600 font-semibold">Presente</span>
                            ) : (
                            <span className="text-red-600 font-semibold">Ausente</span>
                            )}
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                        Nenhum registro de presença encontrado nos dias de treino.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
