'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStudent } from '@/contexts/student-context';
import type { Student, BodyMeasurements } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Ruler, Weight, Scale, VenetianMask } from 'lucide-react';

const positiveNumberSchema = z.coerce
  .number()
  .positive({ message: 'O valor deve ser positivo.' })
  .optional()
  .or(z.literal(''));

const detailsSchema = z.object({
  height: positiveNumberSchema,
  weight: positiveNumberSchema,
  bodyMeasurements: z.object({
    chest: positiveNumberSchema,
    waist: positiveNumberSchema,
    hips: positiveNumberSchema,
    leftArm: positiveNumberSchema,
    rightArm: positiveNumberSchema,
    leftThigh: positiveNumberSchema,
    rightThigh: positiveNumberSchema,
  }).optional(),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

interface StudentDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  student: Student | null;
}

const calculateIMC = (height?: number, weight?: number) => {
  if (!height || !weight || height <= 0 || weight <= 0) return 'N/A';
  const heightInMeters = height / 100;
  const imc = weight / (heightInMeters * heightInMeters);
  return imc.toFixed(2);
};

export function StudentDetailsDialog({
  isOpen,
  setIsOpen,
  student,
}: StudentDetailsDialogProps) {
  const { updateStudent } = useStudent();
  const { toast } = useToast();

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      height: '',
      weight: '',
      bodyMeasurements: {
        chest: '',
        waist: '',
        hips: '',
        leftArm: '',
        rightArm: '',
        leftThigh: '',
        rightThigh: '',
      },
    },
  });

  const { watch } = form;
  const watchedHeight = watch('height');
  const watchedWeight = watch('weight');
  const imc = calculateIMC(Number(watchedHeight), Number(watchedWeight));


  useEffect(() => {
    if (student) {
      form.reset({
        height: student.height || '',
        weight: student.weight || '',
        bodyMeasurements: {
          chest: student.bodyMeasurements?.chest || '',
          waist: student.bodyMeasurements?.waist || '',
          hips: student.bodyMeasurements?.hips || '',
          leftArm: student.bodyMeasurements?.leftArm || '',
          rightArm: student.bodyMeasurements?.rightArm || '',
          leftThigh: student.bodyMeasurements?.leftThigh || '',
          rightThigh: student.bodyMeasurements?.rightThigh || '',
        },
      });
    }
  }, [student, form, isOpen]);

  const onSubmit = (data: DetailsFormValues) => {
    if (student) {
      const updatedData: Partial<Student> = {
        height: data.height ? Number(data.height) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        bodyMeasurements: Object.keys(data.bodyMeasurements || {}).reduce((acc, key) => {
          const value = data.bodyMeasurements?.[key as keyof BodyMeasurements];
          if(value) {
            acc[key as keyof BodyMeasurements] = Number(value);
          }
          return acc;
        }, {} as BodyMeasurements)
      };
      
      updateStudent(student.id, updatedData, student);
      toast({ title: 'Sucesso', description: 'Informações do aluno atualizadas.' });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mais Informações: {student?.name}</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações físicas do aluno.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-6 -mr-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Altura, Peso e IMC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Ruler className="mr-2 h-4 w-4" /> Altura (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 175" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Weight className="mr-2 h-4 w-4" /> Peso (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 70.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="space-y-2">
                  <FormLabel className="flex items-center"><Scale className="mr-2 h-4 w-4" /> IMC</FormLabel>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {imc}
                  </div>
              </div>
            </div>

             {/* Medidas Corporais */}
             <div>
                <FormLabel className="flex items-center mb-4 text-lg font-semibold"><VenetianMask className="mr-2 h-5 w-5" /> Medidas Corporais (cm)</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <FormField
                        control={form.control}
                        name="bodyMeasurements.chest"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tórax</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 98" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="bodyMeasurements.waist"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cintura</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 80" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="bodyMeasurements.hips"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quadril</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 102" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bodyMeasurements.rightArm"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Braço Direito</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 35" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="bodyMeasurements.leftArm"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Braço Esquerdo</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 34.5" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bodyMeasurements.rightThigh"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Coxa Direita</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 60" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="bodyMeasurements.leftThigh"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Coxa Esquerda</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 59.5" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
             </div>
             <DialogFooter className="pt-4 !mt-8">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
