'use client';

import { useState } from 'react';
import { useInstructor } from '@/contexts/instructor-context';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import InstructorTable from './instructor-table';
import { InstructorDialog } from './instructor-dialog';
import type { UserProfile } from '@/types'; // Changed from Instructor to UserProfile
import { useToast } from '@/hooks/use-toast';

export default function InstructorsClient() {
  const { instructors, loading, deleteInstructor } = useInstructor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<UserProfile | null>(
    null
  );
  const { toast } = useToast();

  const handleAddInstructor = () => {
    setSelectedInstructor(null);
    setDialogOpen(true);
  };

  const handleEditInstructor = (instructor: UserProfile) => {
    setSelectedInstructor(instructor);
    setDialogOpen(true);
  };

  const handleDeleteInstructor = async (
    instructorId: string,
    instructorName: string
  ) => {
    try {
      await deleteInstructor(instructorId);
      toast({
        title: 'Sucesso',
        description: `Instrutor "${instructorName}" excluído do sistema.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description:
          error.message || 'Não foi possível excluir o instrutor.',
      });
    }
  };

  if (loading && instructors.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl font-semibold">
          Lista de Instrutores
        </h2>
        <Button onClick={handleAddInstructor}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Instrutor
        </Button>
      </div>

      <InstructorTable
        instructors={instructors}
        onEdit={handleEditInstructor}
        onDelete={handleDeleteInstructor}
      />

      <InstructorDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        instructor={selectedInstructor}
      />
    </div>
  );
}
