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

  // Find today's attendance record
  const todayRecord = student.attendance.find(a => isToday(new Date(a.date)));

  const handleMarkTodayAttendance = (present: boolean) => {
    markAttendance(student.id, present);
  };
  
  const sortedAttendance = [...student.attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Presença: {student.name}</DialogTitle>
          <DialogDescription>
            Visualize o histórico de aulas e marque a presença de hoje.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="rounded-md border p-4">
                 <h4 className="mb-2 font-semibold">Presença de Hoje ({format(new Date(), 'dd/MM/yyyy')})</h4>
                 <div className="flex items-center justify-between">
                     <p className="text-sm text-muted-foreground">
                        {todayRecord ? (todayRecord.present ? 'O aluno está presente.' : 'O aluno está ausente.') : 'A presença ainda não foi marcada.'}
                     </p>
                    <div className="flex gap-2">
                        <Button size="sm" variant={todayRecord?.present ? "default" : "outline"} onClick={() => handleMarkTodayAttendance(true)}>
                            Presente
                        </Button>
                        <Button size="sm" variant={todayRecord && !todayRecord.present ? "destructive" : "outline"} onClick={() => handleMarkTodayAttendance(false)}>
                            Ausente
                        </Button>
                    </div>
                 </div>
            </div>

            <h4 className="font-semibold">Histórico de Aulas</h4>
            <div className="max-h-64 overflow-y-auto rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedAttendance.length > 0 ? (
                    sortedAttendance.map((record) => (
                        <TableRow key={record.id}>
                        <TableCell className="font-medium">
                            {format(parseISO(record.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                            {format(parseISO(record.date), 'HH:mm')}
                        </TableCell>
                        <TableCell>
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
                        <TableCell colSpan={3} className="h-24 text-center">
                        Nenhum registro de presença encontrado.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
