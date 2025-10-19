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
import { format, parseISO } from 'date-fns';
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
  const { updateSpecificAttendance } = useStudent();

  if (!student) return null;

  const handleUpdateAttendance = (attendanceId: string, present: boolean) => {
    updateSpecificAttendance(student.id, attendanceId, present);
  };
  
  const sortedAttendance = [...student.attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Presença: {student.name}</DialogTitle>
          <DialogDescription>
            Visualize e edite o histórico de aulas do aluno.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <h4 className="font-semibold">Histórico de Aulas</h4>
            <div className="max-h-96 overflow-y-auto rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedAttendance.length > 0 ? (
                    sortedAttendance.map((record) => (
                        <TableRow key={record.id}>
                        <TableCell className="font-medium">
                            {format(parseISO(record.date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                            {record.present ? (
                            <span className="text-green-600 font-semibold">Presente</span>
                            ) : (
                            <span className="text-red-600 font-semibold">Ausente</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant={record.present ? "default" : "outline"} onClick={() => handleUpdateAttendance(record.id, true)} disabled={record.present}>
                                    Presente
                                </Button>
                                <Button size="sm" variant={!record.present ? "destructive" : "outline"} onClick={() => handleUpdateAttendance(record.id, false)} disabled={!record.present}>
                                    Ausente
                                </Button>
                            </div>
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
