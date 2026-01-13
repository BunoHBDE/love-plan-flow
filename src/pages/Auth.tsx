import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const resetSchema = z.object({
  email: z.string().email('Email inválido'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type AuthView = 'login' | 'forgot-password' | 'reset-sent';

export default function Auth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);
    
    if (error) {
      let message = 'Erro ao fazer login';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Email não confirmado. Verifique sua caixa de entrada.';
      }
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleForgotPassword = async (data: ResetFormData) => {
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/configuracoes`,
    });
    
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar email de recuperação. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setAuthView('reset-sent');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        {authView === 'login' && (
          <>
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-primary">
                Espaço de Casamento
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Faça login para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="seu@email.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? 'text' : 'password'} 
                              placeholder="••••••••" 
                              className="pr-10"
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm text-muted-foreground hover:text-primary"
                      onClick={() => {
                        resetForm.setValue('email', loginForm.getValues('email'));
                        setAuthView('forgot-password');
                      }}
                    >
                      Esqueceu sua senha?
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </Form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Não tem uma conta?{' '}
                <a href="/cadastro" className="text-accent hover:underline font-medium">
                  Criar conta grátis
                </a>
              </p>
            </CardContent>
          </>
        )}

        {authView === 'forgot-password' && (
          <>
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-primary">
                Recuperar Senha
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Digite seu email para receber o link de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="seu@email.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar link de recuperação'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setAuthView('login')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        )}

        {authView === 'reset-sent' && (
          <>
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-primary">
                Email Enviado!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Verifique sua caixa de entrada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Enviamos um link de recuperação para <strong>{resetForm.getValues('email')}</strong>. 
                Clique no link para redefinir sua senha.
              </p>
              <p className="text-xs text-center text-muted-foreground">
                Não recebeu o email? Verifique a pasta de spam ou tente novamente.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAuthView('forgot-password')}
                >
                  Reenviar email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setAuthView('login')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
