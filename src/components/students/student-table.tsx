'use client';

import type { Student, Attendance } from '@/types';
import { useStudent } from '@/contexts/student-context';
import { isToday } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, MoreHorizontal } from 'lucide-react';

type StudentWithAttendance = Student & { attendance: Attendance[] };

type StudentTableProps = {
  students: StudentWithAttendance[];
  onEdit: (student: Student) => void;
  onShowDetails: (student: Student) => void;
  onShowAttendance: (student: StudentWithAttendance) => void;
};

export default function StudentTable({ students, onEdit, onShowDetails, onShowAttendance }: StudentTableProps) {
  const { deleteStudent, markAttendance } = useStudent();

  const hasAttendedToday = (student: StudentWithAttendance) => {
    const todayAttendance = student.attendance.find((a) => isToday(new Date(a.date)));
    return todayAttendance?.present;
  };
  
  const handleMarkTodayAttendance = (studentId: string, present: boolean) => {
    markAttendance(studentId, present);
  };


  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mensalidade</TableHead>
            <TableHead>Presença Hoje</TableHead>
            <TableHead>Histórico de Presença</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length > 0 ? (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={student.status === 'Ativo' ? 'default' : 'secondary'}
                    className={student.status === 'Ativo' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}
                  >
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={student.paymentStatus === 'Pago' ? 'secondary' : 'destructive'}
                  >
                    {student.paymentStatus}
                  </Badge>
                </TableCell>
                 <TableCell>
                  {student.status === 'Ativo' ? (
                     <div className="flex items-center gap-2">
                      {hasAttendedToday(student) && <CheckCircle className="h-5 w-5 text-green-500" title="Presente hoje" />}
                      <Button size="sm" variant={hasAttendedToday(student) ? "default" : "outline"} onClick={() => handleMarkTodayAttendance(student.id, true)} disabled={hasAttendedToday(student) === true}>P</Button>
                      <Button size="sm" variant={hasAttendedToday(student) === false ? "destructive" : "outline"} onClick={() => handleMarkTodayAttendance(student.id, false)} disabled={hasAttendedToday(student) === false}>F</Button>
                    </div>
                  ) : (
                     <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {student.status === 'Ativo' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowAttendance(student)}
                    >
                      Ver Histórico
                    </Button>
                  ) : (
                     <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(student)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShowDetails(student)}>
                          Mais Informações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. Isso irá excluir permanentemente o aluno
                          "{student.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => deleteStudent(student.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhum aluno encontrado para os filtros aplicados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
