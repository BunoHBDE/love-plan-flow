/**
 * COMPONENTE DE BLOQUEIO DE ASSINATURA
 * 
 * Bloqueia acesso a recursos premium mostrando overlay ou componente alternativo.
 * Usado para proteger funcionalidades que requerem assinatura ativa.
 */

import { ReactNode } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGateProps {
  children: ReactNode;
  /** Modo de exibição quando bloqueado */
  fallback?: 'overlay' | 'card' | 'inline' | 'hidden';
  /** Título customizado para a mensagem de bloqueio */
  title?: string;
  /** Descrição customizada para a mensagem de bloqueio */
  description?: string;
  /** Se true, mostra loading enquanto verifica assinatura */
  showLoading?: boolean;
}

export function SubscriptionGate({ 
  children, 
  fallback = 'overlay',
  title = 'Recurso Premium',
  description = 'Este recurso está disponível apenas para assinantes do Plano Pro.',
  showLoading = true,
}: SubscriptionGateProps) {
  const { hasAccess, loading } = useSubscriptionContext();
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/configuracoes?tab=assinatura');
  };

  // Loading state
  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // User has access - render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show fallback
  switch (fallback) {
    case 'hidden':
      return null;

    case 'inline':
      return (
        <div className="flex items-center gap-2 text-muted-foreground py-2">
          <Lock className="h-4 w-4" />
          <span className="text-sm">{title}</span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={handleSubscribe}>
            Assinar
          </Button>
        </div>
      );

    case 'card':
      return (
        <Card className="border-dashed border-muted-foreground/30">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Crown className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <Button onClick={handleSubscribe}>
              <Crown className="h-4 w-4 mr-2" />
              Conhecer Plano Pro
            </Button>
          </CardContent>
        </Card>
      );

    case 'overlay':
    default:
      return (
        <div className="relative">
          {/* Blurred content */}
          <div className="pointer-events-none select-none blur-sm opacity-50">
            {children}
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
            <div className="text-center space-y-4 p-6 max-w-sm">
              <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
              <Button onClick={handleSubscribe} size="lg">
                <Crown className="h-4 w-4 mr-2" />
                Assinar Plano Pro
              </Button>
              <p className="text-xs text-muted-foreground">
                14 dias grátis para testar
              </p>
            </div>
          </div>
        </div>
      );
  }
}

/**
 * Hook para verificar acesso a recursos premium
 * Retorna hasAccess diretamente para uso em lógica condicional
 */
export function usePremiumAccess() {
  const { hasAccess, loading, isTrialing, trialDaysRemaining } = useSubscriptionContext();
  return { hasAccess, loading, isTrialing, trialDaysRemaining };
}
