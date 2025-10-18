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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudent } from '@/contexts/student-context';
import type { Student, StudentStatus, PaymentStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

const studentSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  status: z.enum(['Ativo', 'Inativo']),
  paymentStatus: z.enum(['Pago', 'Pendente']),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  student: Student | null;
}

export function StudentDialog({
  isOpen,
  setIsOpen,
  student,
}: StudentDialogProps) {
  const { addStudent, updateStudent } = useStudent();
  const { toast } = useToast();
  const isEditing = !!student;

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      status: 'Ativo',
      paymentStatus: 'Pago',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (student) {
        form.reset({
          name: student.name,
          status: student.status,
          paymentStatus: student.paymentStatus,
        });
      } else {
        form.reset({
          name: '',
          status: 'Ativo',
          paymentStatus: 'Pago',
        });
      }
    }
  }, [student, form, isOpen]);

  const onSubmit = (data: StudentFormValues) => {
    if (isEditing && student) {
      updateStudent(student.id, data);
      toast({ title: 'Sucesso', description: 'Aluno atualizado com sucesso.' });
    } else {
      addStudent(data);
      toast({ title: 'Sucesso', description: 'Aluno adicionado com sucesso.' });
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Aluno' : 'Adicionar Aluno'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Faça alterações nos dados do aluno aqui.'
              : 'Preencha os dados do novo aluno.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status da Matrícula</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status da Mensalidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status do pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                {isEditing ? 'Salvar Alterações' : 'Adicionar Aluno'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
