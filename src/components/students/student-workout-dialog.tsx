'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkout } from '@/contexts/workout-context';
import type { Student } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

interface StudentWorkoutDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  student: Student | null;
}

const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7;
  return `${hour}:00-${hour + 1}:00`;
});


export function StudentWorkoutDialog({
  isOpen,
  setIsOpen,
  student,
}: StudentWorkoutDialogProps) {
  const { workoutData, toggleStudentWorkout } = useWorkout();
  const { toast } = useToast();

  if (!student) return null;

  const handleCheckboxChange = (day: string, time: string, isChecked: boolean) => {
    const success = toggleStudentWorkout(student.name, day, time, isChecked);
    if (!success) {
      toast({
        variant: 'destructive',
        title: 'Horário Cheio',
        description: 'Este horário já atingiu o limite de 2 alunos.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agenda de Treino: {student.name}</DialogTitle>
          <DialogDescription>
            Marque ou desmarque os horários de treino para este aluno.
            Um horário cheio (2 alunos) não pode ser selecionado.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-4">
            <div className="space-y-6 py-4">
            {daysOfWeek.map((day) => (
                <div key={day}>
                <h4 className="font-semibold mb-3">{day}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {timeSlots.map((time) => {
                    const studentsInSlot = workoutData[day]?.[time] || [];
                    const isStudentInSlot = studentsInSlot.includes(student.name);
                    const isSlotFull = studentsInSlot.length >= 2;
                    const isDisabled = isSlotFull && !isStudentInSlot;

                    return (
                        <div key={`${day}-${time}`} className="flex items-center space-x-2">
                            <Checkbox
                                id={`${day}-${time}`}
                                checked={isStudentInSlot}
                                onCheckedChange={(checked) => handleCheckboxChange(day, time, !!checked)}
                                disabled={isDisabled}
                            />
                            <Label 
                                htmlFor={`${day}-${time}`}
                                className={`flex-grow ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {time}
                                <Badge variant="secondary" className="ml-2">{studentsInSlot.length}/2</Badge>
                            </Label>
                        </div>
                    );
                    })}
                </div>
                </div>
            ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
