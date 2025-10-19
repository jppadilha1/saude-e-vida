'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useWorkout } from '@/contexts/workout-context';
import type { Student } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { CalendarCheck2, Edit } from 'lucide-react';

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
  
  const currentStudentWorkouts = daysOfWeek.flatMap(day => 
    timeSlots.map(time => {
        const studentsInSlot = workoutData[day]?.[time] || [];
        if (studentsInSlot.includes(student.name)) {
            return { day, time };
        }
        return null;
    }).filter(Boolean)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agenda de Treino: {student.name}</DialogTitle>
          <DialogDescription>
            Visualize e edite os horários de treino do aluno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <div>
                 <h3 className="text-lg font-semibold flex items-center mb-3">
                    <CalendarCheck2 className="mr-2 h-5 w-5" />
                    Treinos Atuais
                </h3>
                {currentStudentWorkouts.length > 0 ? (
                    <div className="space-y-2 rounded-md border p-4">
                        {currentStudentWorkouts.map((workout, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{workout!.day}</span>
                                <span className="text-muted-foreground">{workout!.time}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum treino agendado.</p>
                )}
            </div>

            <Separator className="my-6" />

            <div>
                <h3 className="text-lg font-semibold flex items-center mb-3">
                    <Edit className="mr-2 h-5 w-5" />
                    Editar Agenda
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Marque ou desmarque os horários. Um horário com 2 alunos não pode ser selecionado.
                </p>
                <ScrollArea className="h-[40vh] pr-4">
                    <Accordion type="single" collapsible className="w-full">
                        {daysOfWeek.map((day) => (
                            <AccordionItem value={day} key={day}>
                                <AccordionTrigger className="text-lg font-semibold">{day}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 pt-2">
                                        {timeSlots.map((time) => {
                                        const studentsInSlot = workoutData[day]?.[time] || [];
                                        const isStudentInSlot = studentsInSlot.includes(student.name);
                                        const isSlotFull = studentsInSlot.length >= 2;
                                        const isDisabled = isSlotFull && !isStudentInSlot;

                                        return (
                                            <div key={`${day}-${time}`} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`${day}-${time}-${student.id}`}
                                                    checked={isStudentInSlot}
                                                    onCheckedChange={(checked) => handleCheckboxChange(day, time, !!checked)}
                                                    disabled={isDisabled}
                                                />
                                                <Label 
                                                    htmlFor={`${day}-${time}-${student.id}`}
                                                    className={`flex-grow ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {time}
                                                    <Badge variant="secondary" className="ml-2">{studentsInSlot.length}/2</Badge>
                                                </Label>
                                            </div>
                                        );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
