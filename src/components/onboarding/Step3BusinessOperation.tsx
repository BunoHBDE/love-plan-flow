import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, Calendar, FileCheck, CalendarDays, Heart, Cake, Building2, PartyPopper, Shuffle } from 'lucide-react';

const schema = z.object({
  mainChallenge: z.string().min(1, 'Selecione seu principal desafio'),
  quotesPerMonth: z.string().min(1, 'Selecione a quantidade de pedidos'),
  eventType: z.string().min(1, 'Selecione o tipo de evento'),
  socialContact: z.string().max(100).optional(),
});

type FormData = z.infer<typeof schema>;

interface Step3Props {
  onComplete: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  defaultValues: { mainChallenge: string; quotesPerMonth: string; eventType: string; socialContact: string };
}

const challenges = [
  { value: 'orcamentos', label: 'Responder orçamentos', icon: MessageSquare },
  { value: 'visitas', label: 'Organizar visitas', icon: Calendar },
  { value: 'contratos', label: 'Controlar contratos', icon: FileCheck },
  { value: 'datas', label: 'Gerenciar datas', icon: CalendarDays },
];

const quotesOptions = [
  { value: 'ate10', label: 'Até 10' },
  { value: '11a30', label: '11 a 30' },
  { value: '31a60', label: '31 a 60' },
  { value: 'mais60', label: 'Mais de 60' },
];

const eventTypes = [
  { value: 'casamentos', label: 'Casamentos', icon: Heart },
  { value: '15anos', label: '15 anos', icon: Cake },
  { value: 'corporativos', label: 'Corporativos', icon: Building2 },
  { value: 'aniversarios', label: 'Aniversários', icon: PartyPopper },
  { value: 'misto', label: 'Misto', icon: Shuffle },
];

export function Step3BusinessOperation({ onComplete, isSubmitting, defaultValues }: Step3Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mainChallenge: defaultValues.mainChallenge,
      quotesPerMonth: defaultValues.quotesPerMonth,
      eventType: defaultValues.eventType,
      socialContact: defaultValues.socialContact || '',
    },
  });

  const selectedChallenge = form.watch('mainChallenge');
  const selectedQuotes = form.watch('quotesPerMonth');
  const selectedEventType = form.watch('eventType');

  const handleSubmit = async (data: FormData) => {
    await onComplete({
      ...data,
      socialContact: data.socialContact || '',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Como funciona sua operação hoje?
        </h1>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Main Challenge */}
          <FormField
            control={form.control}
            name="mainChallenge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Principal desafio</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-3">
                    {challenges.map((challenge) => (
                      <button
                        key={challenge.value}
                        type="button"
                        onClick={() => field.onChange(challenge.value)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200',
                          selectedChallenge === challenge.value
                            ? 'border-accent bg-accent/10 shadow-gold'
                            : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
                        )}
                      >
                        <challenge.icon className={cn(
                          'w-5 h-5 flex-shrink-0',
                          selectedChallenge === challenge.value ? 'text-accent' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'text-sm font-medium text-left',
                          selectedChallenge === challenge.value ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {challenge.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quotes Per Month */}
          <FormField
            control={form.control}
            name="quotesPerMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pedidos de orçamento por mês</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-4 gap-2">
                    {quotesOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          'flex items-center justify-center p-3 rounded-xl border-2 transition-all duration-200',
                          selectedQuotes === option.value
                            ? 'border-accent bg-accent/10 shadow-gold'
                            : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
                        )}
                      >
                        <span className={cn(
                          'text-sm font-medium',
                          selectedQuotes === option.value ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Type */}
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de evento predominante</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {eventTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => field.onChange(type.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                          selectedEventType === type.value
                            ? 'border-accent bg-accent/10 shadow-gold'
                            : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
                        )}
                      >
                        <type.icon className={cn(
                          'w-5 h-5',
                          selectedEventType === type.value ? 'text-accent' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'text-xs font-medium text-center',
                          selectedEventType === type.value ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Social Contact - Optional */}
          <FormField
            control={form.control}
            name="socialContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Instagram ou WhatsApp <span className="text-xs">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="@seuperfil ou (11) 99999-9999" 
                    className="h-12"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              'Acessar painel'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
