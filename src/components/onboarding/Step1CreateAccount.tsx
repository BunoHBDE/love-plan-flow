import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { formatPhone } from '@/lib/masks';
import { PasswordStrength } from './PasswordStrength';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  whatsapp: z.string().min(10, 'WhatsApp inválido').max(20),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(72),
  allowContact: z.boolean().default(true),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Você precisa aceitar os termos para continuar',
  }),
  acceptPrivacy: z.boolean().refine(val => val === true, {
    message: 'Você precisa aceitar a política de privacidade',
  }),
});

type FormData = z.infer<typeof schema>;

interface Step1Props {
  onComplete: (data: { name: string; email: string; password: string; whatsapp: string; allowContact: boolean }) => Promise<void>;
  isSubmitting: boolean;
  defaultValues: { name: string; email: string; password: string };
}

export function Step1CreateAccount({ onComplete, isSubmitting, defaultValues }: Step1Props) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues.name,
      email: defaultValues.email,
      password: defaultValues.password,
      whatsapp: '',
      allowContact: true,
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onComplete({
        name: data.name,
        email: data.email,
        password: data.password,
        whatsapp: data.whatsapp,
        allowContact: data.allowContact,
      });
    } catch (error: any) {
      let message = 'Erro ao criar conta. Tente novamente.';
      if (error?.message?.includes('already registered')) {
        message = 'Este email já está cadastrado. Faça login ou use outro email.';
      }
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Crie sua conta em segundos
        </h1>
        <p className="text-muted-foreground">
          Comece agora a simplificar a gestão do seu espaço de eventos.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Seu nome completo" 
                    className="h-12"
                    {...field} 
                  />
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
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="h-12"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input 
                    type="tel" 
                    placeholder="(11) 99999-9999" 
                    className="h-12"
                    value={field.value}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    className="h-12"
                    {...field} 
                  />
                </FormControl>
                <PasswordStrength password={field.value} />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Consent Checkboxes */}
          <div className="space-y-3 pt-2">
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Li e aceito os{' '}
                      <a href="/termos" target="_blank" className="text-accent hover:underline">
                        Termos de Uso
                      </a>
                      {' '}e a{' '}
                      <a href="/cookies" target="_blank" className="text-accent hover:underline">
                        Política de Cookies
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptPrivacy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Li e aceito a{' '}
                      <a href="/privacidade" target="_blank" className="text-accent hover:underline">
                        Política de Privacidade
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowContact"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer text-muted-foreground">
                      Aceito receber contato para acompanhamento da minha experiência
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold mt-2" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
