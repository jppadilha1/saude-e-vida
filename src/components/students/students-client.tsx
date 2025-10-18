'use client';

import { useState } from 'react';
import { useStudent } from '@/contexts/student-context';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import StudentTable from './student-table';
import { StudentDialog } from './student-dialog';
import type { Student } from '@/types';

export default function StudentsClient() {
  const { students, loading } = useStudent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setDialogOpen(true);
  };
  
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl font-semibold">Lista de Alunos</h2>
        <Button onClick={handleAddStudent}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>
      <StudentTable students={students} onEdit={handleEditStudent} />
      <StudentDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        student={selectedStudent}
      />
    </div>
  );
}
