'use client';

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
import type { Student, Attendance } from '@/types';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';

type StudentWithAttendance = Student & { attendance: Attendance[] };

interface StudentAttendanceDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  student: StudentWithAttendance | null;
}

export function StudentAttendanceDialog({
  isOpen,
  setIsOpen,
  student,
}: StudentAttendanceDialogProps) {
  const { markAttendance } = useStudent();

  if (!student) return null;

  const hasAttendedToday = student.attendance.find((a) => isToday(new Date(a.date)))?.present;
  
  const sortedAttendance = [...student.attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Presença: {student.name}</DialogTitle>
          <DialogDescription>
            Marque a presença de hoje e visualize o histórico de aulas do aluno.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <h4 className="font-semibold">Presença de Hoje</h4>
             <div className="mt-2 flex items-center gap-2 rounded-lg border p-4">
              {hasAttendedToday ? (
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
                <Button size="sm" variant="default" onClick={() => markAttendance(student.id, true)} disabled={hasAttendedToday === true}>
                  Marcar Presença
                </Button>
                 <Button size="sm" variant="destructive" onClick={() => markAttendance(student.id, false)} disabled={hasAttendedToday === false}>
                  Marcar Falta
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Histórico de Aulas</h4>
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
                        Nenhum registro de presença encontrado.
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
