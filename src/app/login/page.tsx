'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { instructors } from '@/lib/instructors-data';

export default function LoginPage() {
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructor) {
      toast({
        title: 'Seleção Necessária',
        description: 'Por favor, selecione um instrutor para continuar.',
        variant: 'destructive',
      });
      return;
    }
    if (password !== 'senha segura') {
      toast({
        title: 'Senha Incorreta',
        description: 'A senha informada está incorreta. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await login(selectedInstructor);
    if (success) {
      router.push('/');
    } else {
      toast({
        title: 'Erro de Autenticação',
        description: 'Falha na autenticação. Tente novamente.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    router.push('/');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const loginImage = PlaceHolderImages.find(p => p.id === 'login-background');

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      {loginImage && (
        <Image
          src={loginImage.imageUrl}
          alt={loginImage.description}
          fill
          className="object-cover"
          data-ai-hint={loginImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/60" />

      <Card className="z-10 w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2">
              <Logo />
            </div>
            <CardTitle className="font-headline text-2xl">
              Acesso ao Painel
            </CardTitle>
            <CardDescription>
              Selecione seu perfil de instrutor para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instrutor</Label>
              <Select onValueChange={setSelectedInstructor} value={selectedInstructor}>
                <SelectTrigger id="instructor">
                  <SelectValue placeholder="Selecione seu nome" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map(instr => (
                    <SelectItem key={instr.id} value={instr.id}>
                      {instr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
