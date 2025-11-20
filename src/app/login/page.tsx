'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useAuth as useFirebaseAuth } from '@/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const firebaseAuth = useFirebaseAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha o email e a senha.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    if (!firebaseAuth) {
        toast({
            title: 'Erro de Autenticação',
            description: 'Serviço de autenticação não disponível.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }

    try {
      // The login function in auth-context now handles firebase auth
      const success = await login(email, password);
      
      if (success) {
        // The useEffect will handle redirection
      } else {
        // The login function will throw an error on failure, which is caught below
        throw new Error('Falha ao processar o login.');
      }
    } catch (error: any) {
       toast({
        title: 'Erro de Autenticação',
        description: 'Email ou senha inválidos. Tente novamente.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // This check prevents a flash of the login page if already authenticated.
  if (isAuthenticated) {
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
              Use seu email e senha para acessar o painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
