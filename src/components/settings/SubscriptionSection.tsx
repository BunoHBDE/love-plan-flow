/**
 * SEÇÃO DE ASSINATURA
 * 
 * Exibe informações do plano atual, recursos incluídos e opções de checkout.
 * Integrado com Stripe para gerenciamento de assinaturas.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Loader2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { PLAN_FEATURES } from "@/constants/settings";
import { useSubscription, SUBSCRIPTION_PRICES } from "@/hooks/useSubscription";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SubscriptionSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const {
    subscription,
    loading,
    isTrialing,
    isActive,
    isCanceled,
    trialDaysRemaining,
    priceType,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  } = useSubscription();

  // Handle success/cancel URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Assinatura realizada com sucesso! Bem-vindo ao Plano Pro.');
      checkSubscription();
      // Clean URL
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
    }

    if (canceled === 'true') {
      toast.info('Checkout cancelado. Você pode tentar novamente quando quiser.');
      // Clean URL
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      await createCheckout(selectedPlan);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir portal');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (isTrialing) {
      return (
        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Trial
        </div>
      );
    }
    if (isCanceled) {
      return (
        <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Cancelado
        </div>
      );
    }
    if (isActive) {
      return (
        <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
          Ativo
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User has active subscription
  if (isActive || isTrialing) {
    return (
      <div className="space-y-6">
        {/* Plano Atual */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Plano Pro
                </CardTitle>
                <CardDescription>
                  {priceType === 'yearly' ? 'Assinatura Anual' : 'Assinatura Mensal'}
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTrialing && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  🎉 Você está no período de teste gratuito!
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Restam <strong>{trialDaysRemaining} dias</strong> de trial. 
                  Após o período, a cobrança será automática.
                </p>
              </div>
            )}

            {isCanceled && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  ⚠️ Assinatura cancelada
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Você ainda tem acesso até {formatDate(subscription?.current_period_end)}.
                </p>
              </div>
            )}

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-medium">
                  {priceType === 'yearly' 
                    ? `R$ ${SUBSCRIPTION_PRICES.yearly.amount.toFixed(2)}/ano` 
                    : `R$ ${SUBSCRIPTION_PRICES.monthly.amount.toFixed(2)}/mês`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Próxima cobrança</span>
                <span className="font-medium">
                  {formatDate(subscription?.current_period_end)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleOpenPortal}
                disabled={isOpeningPortal}
              >
                {isOpeningPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Gerenciar assinatura
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recursos Incluídos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Check className="h-5 w-5 text-primary" />
              Recursos Incluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLAN_FEATURES.map((recurso) => (
                <div key={recurso} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{recurso}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User doesn't have subscription - show pricing
  return (
    <div className="space-y-6">
      {/* Pricing Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Plano Mensal */}
        <Card 
          className={cn(
            "cursor-pointer transition-all",
            selectedPlan === 'monthly' 
              ? "border-2 border-primary ring-2 ring-primary/20" 
              : "hover:border-primary/50"
          )}
          onClick={() => setSelectedPlan('monthly')}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Mensal</span>
              {selectedPlan === 'monthly' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$ {SUBSCRIPTION_PRICES.monthly.amount.toFixed(2)}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Cobrança mensal, cancele quando quiser
            </p>
          </CardContent>
        </Card>

        {/* Plano Anual */}
        <Card 
          className={cn(
            "cursor-pointer transition-all relative",
            selectedPlan === 'yearly' 
              ? "border-2 border-primary ring-2 ring-primary/20" 
              : "hover:border-primary/50"
          )}
          onClick={() => setSelectedPlan('yearly')}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              Melhor valor
            </span>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Anual</span>
              {selectedPlan === 'yearly' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$ {SUBSCRIPTION_PRICES.yearly.amount.toFixed(2)}</span>
              <span className="text-muted-foreground">/ano</span>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              {SUBSCRIPTION_PRICES.yearly.savings}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Comece com 14 dias grátis</h3>
              <p className="text-muted-foreground mt-1">
                Teste todas as funcionalidades sem compromisso
              </p>
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Iniciar trial gratuito
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Você só será cobrado após os 14 dias de teste
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Incluídos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Check className="h-5 w-5 text-primary" />
            O que está incluído no Plano Pro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLAN_FEATURES.map((recurso) => (
              <div key={recurso} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>{recurso}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
