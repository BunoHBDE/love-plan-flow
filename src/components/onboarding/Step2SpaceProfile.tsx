import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Heart, PartyPopper, TreePine, Building2, MoreHorizontal, User, Users, Briefcase, UserCheck } from 'lucide-react';

const schema = z.object({
  spaceName: z.string().min(2, 'Nome do espaço é obrigatório').max(100),
  spaceType: z.string().min(1, 'Selecione o tipo de espaço'),
  userRole: z.string().min(1, 'Selecione sua função'),
});

type FormData = z.infer<typeof schema>;

interface Step2Props {
  onComplete: (data: FormData) => void;
  defaultValues: { spaceName: string; spaceType: string; userRole: string };
}

const spaceTypes = [
  { value: 'casamento', label: 'Espaço de casamento', icon: Heart },
  { value: 'salao', label: 'Salão de festas', icon: PartyPopper },
  { value: 'sitio', label: 'Sítio / chácara', icon: TreePine },
  { value: 'hotel', label: 'Hotel / resort', icon: Building2 },
  { value: 'outro', label: 'Outro', icon: MoreHorizontal },
];

const userRoles = [
  { value: 'proprietario', label: 'Proprietário(a)', icon: User },
  { value: 'gestor', label: 'Gestor(a)', icon: Users },
  { value: 'administrador', label: 'Administrador(a)', icon: Briefcase },
  { value: 'funcionario', label: 'Funcionário(a)', icon: UserCheck },
];

export function Step2SpaceProfile({ onComplete, defaultValues }: Step2Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      spaceName: defaultValues.spaceName,
      spaceType: defaultValues.spaceType,
      userRole: defaultValues.userRole,
    },
  });

  const selectedSpaceType = form.watch('spaceType');
  const selectedUserRole = form.watch('userRole');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Conte-nos sobre seu espaço
        </h1>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onComplete)} className="space-y-6">
          {/* Space Name */}
          <FormField
            control={form.control}
            name="spaceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do espaço</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Espaço Villa Verde" 
                    className="h-12"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Space Type */}
          <FormField
            control={form.control}
            name="spaceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de espaço</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {spaceTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => field.onChange(type.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                          selectedSpaceType === type.value
                            ? 'border-accent bg-accent/10 shadow-gold'
                            : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
                        )}
                      >
                        <type.icon className={cn(
                          'w-6 h-6',
                          selectedSpaceType === type.value ? 'text-accent' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'text-sm font-medium text-center',
                          selectedSpaceType === type.value ? 'text-primary' : 'text-muted-foreground'
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

          {/* User Role */}
          <FormField
            control={form.control}
            name="userRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sua função</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-3">
                    {userRoles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => field.onChange(role.value)}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                          selectedUserRole === role.value
                            ? 'border-accent bg-accent/10 shadow-gold'
                            : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
                        )}
                      >
                        <role.icon className={cn(
                          'w-5 h-5',
                          selectedUserRole === role.value ? 'text-accent' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'text-sm font-medium',
                          selectedUserRole === role.value ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {role.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold"
          >
            Próximo
          </Button>
        </form>
      </Form>
    </div>
  );
}
