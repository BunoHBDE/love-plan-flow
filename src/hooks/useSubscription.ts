import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Intervalo entre revalidações automáticas da assinatura
const SUBSCRIPTION_REFRESH_MS = 1000 * 60 * 5;

// Tempo mínimo entre revalidações disparadas ao voltar para a aba
const MIN_REVALIDATE_INTERVAL_MS = 1000 * 60;

// Preços do Plano Pro
export const SUBSCRIPTION_PRICES = {
  monthly: {
    id: "price_1SoeQSEaBTEftWYl5WlKw5lz",
    amount: 49.90,
    interval: "month" as const,
    label: "Mensal",
  },
  yearly: {
    id: "price_1SoeQhEaBTEftWYlBB0hyjca",
    amount: 479.00,
    interval: "year" as const,
    label: "Anual",
    savings: "Economize R$ 119,80",
  },
};

export interface SubscriptionData {
  subscribed: boolean;
  status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  price_id: string | null;
  app_trial: boolean;
  can_start_trial: boolean;
}

export function useSubscription() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  // Use session token as stable dependency instead of session object
  const sessionToken = session?.access_token;

  // Refs mantêm o controle de revalidação fora das dependências do useCallback:
  // usar estado aqui recriaria checkSubscription e redispararia o efeito abaixo.
  const hasLoadedRef = useRef(false);
  const lastCheckedAtRef = useRef(0);

  const checkSubscription = useCallback(async () => {
    if (!sessionToken) {
      hasLoadedRef.current = false;
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Só bloqueia a interface na primeira verificação. As seguintes revalidam em
    // segundo plano, senão o SubscriptionGate desmontaria a página a cada ciclo.
    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    lastCheckedAtRef.current = Date.now();

    try {
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('check-subscription');

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSubscription(data);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Erro ao verificar assinatura');

      // Falha em revalidação mantém o último estado conhecido: descartá-lo jogaria
      // o usuário no bloqueio de assinatura por uma instabilidade de rede.
      if (!hasLoadedRef.current) {
        setSubscription(null);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Revalidação periódica em segundo plano
  useEffect(() => {
    if (!sessionToken) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, SUBSCRIPTION_REFRESH_MS);

    return () => clearInterval(interval);
  }, [sessionToken, checkSubscription]);

  // Revalida ao voltar para a aba, para refletir rapidamente um checkout concluído
  // no Stripe (que abre em outra aba) sem depender do intervalo.
  useEffect(() => {
    if (!sessionToken) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastCheckedAtRef.current < MIN_REVALIDATE_INTERVAL_MS) return;
      checkSubscription();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionToken, checkSubscription]);

  const startTrial = async () => {
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setIsStartingTrial(true);
      
      const { data, error: fnError } = await supabase.functions.invoke('start-trial');

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh subscription state
      await checkSubscription();

      return data;
    } catch (err) {
      console.error('Error starting trial:', err);
      throw err;
    } finally {
      setIsStartingTrial(false);
    }
  };

  const createCheckout = async (priceType: 'monthly' | 'yearly') => {
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { priceType },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }

      return data;
    } catch (err) {
      console.error('Error creating checkout:', err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-portal');

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }

      return data;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      throw err;
    }
  };

  // Helper functions
  const isTrialing = subscription?.status === 'trialing';
  const isAppTrial = subscription?.app_trial === true;
  const isActive = subscription?.subscribed === true;
  const isCanceled = subscription?.cancel_at_period_end === true;
  const canStartTrial = subscription?.can_start_trial === true;

  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_end) return 0;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getPriceType = (): 'monthly' | 'yearly' | null => {
    if (!subscription?.price_id) return null;
    if (subscription.price_id === SUBSCRIPTION_PRICES.yearly.id) return 'yearly';
    if (subscription.price_id === SUBSCRIPTION_PRICES.monthly.id) return 'monthly';
    return null;
  };

  return {
    subscription,
    loading,
    error,
    isTrialing,
    isAppTrial,
    isActive,
    isCanceled,
    canStartTrial,
    isStartingTrial,
    trialDaysRemaining: getTrialDaysRemaining(),
    priceType: getPriceType(),
    checkSubscription,
    startTrial,
    createCheckout,
    openCustomerPortal,
  };
}
