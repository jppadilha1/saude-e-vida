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
import { useInstructor } from '@/contexts/instructor-context';
import type { Instructor } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const instructorSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
    .optional()
    .or(z.literal('')),
});

interface InstructorDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  instructor: Instructor | null;
}

export function InstructorDialog({
  isOpen,
  setIsOpen,
  instructor,
}: InstructorDialogProps) {
  const { addInstructor, updateInstructor, loading } = useInstructor();
  const { toast } = useToast();
  const isEditing = !!instructor;

  const form = useForm<z.infer<typeof instructorSchema>>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (instructor) {
        form.reset({
          name: instructor.name || '',
          email: instructor.email || '',
          password: '',
        });
        // Remove password validation when editing
        form.clearErrors('password');
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
        });
      }
    }
  }, [instructor, form, isOpen]);

  const onSubmit = async (data: z.infer<typeof instructorSchema>) => {
    if (isEditing && instructor) {
      const updatedData: Partial<Instructor> = {
        name: data.name,
        // Email is not editable to avoid auth mismatches
      };
      await updateInstructor(instructor.id, updatedData);
      toast({
        title: 'Sucesso',
        description: 'Instrutor atualizado com sucesso.',
      });
    } else {
      if (!data.password) {
        form.setError('password', {
          message: 'A senha é obrigatória ao criar um instrutor.',
        });
        return;
      }
      try {
        await addInstructor({
          name: data.name,
          email: data.email,
          password: data.password,
        });
        toast({
          title: 'Sucesso',
          description: 'Instrutor adicionado com sucesso.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar instrutor',
          description:
            error.message || 'Não foi possível criar a conta. Tente novamente.',
        });
        return; // Prevent closing the dialog on error
      }
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Instrutor' : 'Adicionar Instrutor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Faça alterações nos dados do instrutor aqui.'
              : 'Preencha os dados do novo instrutor.'}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@dominio.com"
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Adicionar Instrutor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
