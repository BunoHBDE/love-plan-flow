import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'Mínimo 6 caracteres', test: (p) => p.length >= 6 },
  { label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Um número', test: (p) => /[0-9]/.test(p) },
  { label: 'Um caractere especial', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const analysis = useMemo(() => {
    const passed = requirements.filter((req) => req.test(password));
    const score = passed.length;
    
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    let label: string;
    let color: string;
    
    if (score <= 1) {
      strength = 'weak';
      label = 'Fraca';
      color = 'bg-destructive';
    } else if (score <= 2) {
      strength = 'fair';
      label = 'Regular';
      color = 'bg-warning';
    } else if (score <= 4) {
      strength = 'good';
      label = 'Boa';
      color = 'bg-secondary';
    } else {
      strength = 'strong';
      label = 'Forte';
      color = 'bg-secondary';
    }
    
    return { score, strength, label, color, passed };
  }, [password]);

  if (!password) return null;

  const percentage = (analysis.score / requirements.length) * 100;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            'font-medium',
            analysis.strength === 'weak' && 'text-destructive',
            analysis.strength === 'fair' && 'text-warning',
            analysis.strength === 'good' && 'text-secondary',
            analysis.strength === 'strong' && 'text-secondary'
          )}>
            {analysis.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300 rounded-full', analysis.color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {requirements.map((req) => {
          const isPassed = req.test(password);
          return (
            <div
              key={req.label}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                isPassed ? 'text-secondary' : 'text-muted-foreground'
              )}
            >
              {isPassed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
