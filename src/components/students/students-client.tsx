'use client';

import { useState, useMemo } from 'react';
import { useStudent } from '@/contexts/student-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Search, Filter } from 'lucide-react';
import StudentTable from './student-table';
import { StudentDialog } from './student-dialog';
import type { Student, StudentStatus, PaymentStatus } from '@/types';
import { isToday } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AttendanceFilter = 'todos' | 'presente' | 'ausente';

export default function StudentsClient() {
  const { students, loading } = useStudent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'todos'>('todos');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'todos'>('todos');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('todos');

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const nameMatches = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatches = statusFilter === 'todos' || student.status === statusFilter;
      const paymentMatches = paymentFilter === 'todos' || student.paymentStatus === paymentFilter;

      const hasAttendedToday = student.attendance.some(
        (a) => isToday(new Date(a.date)) && a.present
      );
      const attendanceMatches =
        attendanceFilter === 'todos' ||
        (attendanceFilter === 'presente' && hasAttendedToday) ||
        (attendanceFilter === 'ausente' && !hasAttendedToday && student.status === 'Ativo');

      return nameMatches && statusMatches && paymentMatches && attendanceMatches;
    });
  }, [students, searchTerm, statusFilter, paymentFilter, attendanceFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 md:flex-row flex-col">
        <h2 className="font-headline text-2xl font-semibold">
          Lista de Alunos ({filteredStudents.length})
        </h2>
        <Button onClick={handleAddStudent}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status da Matrícula</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment">Status da Mensalidade</Label>
                <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as any)}>
                  <SelectTrigger id="payment">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendance">Presença Hoje</Label>
                <Select value={attendanceFilter} onValueChange={(value) => setAttendanceFilter(value as any)}>
                  <SelectTrigger id="attendance">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="presente">Presente</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      <StudentTable students={filteredStudents} onEdit={handleEditStudent} />
      <StudentDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        student={selectedStudent}
      />
    </div>
  );
}
