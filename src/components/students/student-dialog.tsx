'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import type { Student, StudentStatus, PaymentStatus, Payment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Calendar, History, Loader2 } from 'lucide-react';

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
  const { addStudent, updateStudent, getStudentPayments } = useStudent();
  const { toast } = useToast();
  const isEditing = !!student;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

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
        // Fetch payment history
        setIsLoadingPayments(true);
        getStudentPayments(student.id)
          .then(setPayments)
          .finally(() => setIsLoadingPayments(false));
      } else {
        form.reset({
          name: '',
          status: 'Ativo',
          paymentStatus: 'Pago',
        });
        setPayments([]);
      }
    }
  }, [student, form, isOpen, getStudentPayments]);

  const onSubmit = (data: StudentFormValues) => {
    if (isEditing && student) {
      updateStudent(student.id, data, student);
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

            {isEditing && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                       <History className="h-4 w-4" /> Histórico de Pagamentos
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isLoadingPayments ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : payments.length > 0 ? (
                      <ul className="space-y-2 pt-2">
                        {payments.map((payment) => (
                          <li key={payment.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Pagamento recebido em{' '}
                              <span className="font-semibold text-foreground">
                                {format(new Date(payment.paymentDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pt-2 text-center text-sm text-muted-foreground">
                        Nenhum pagamento registrado.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            
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
