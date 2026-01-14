/**
 * CONTEXTO DE ASSINATURA
 * 
 * Provê estado global de assinatura para toda a aplicação.
 * Permite verificar acesso a recursos premium em qualquer componente.
 */

import { createContext, useContext, ReactNode } from 'react';
import { useSubscription, SubscriptionData, SUBSCRIPTION_PRICES } from '@/hooks/useSubscription';

interface SubscriptionContextValue {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  isTrialing: boolean;
  isAppTrial: boolean;
  isActive: boolean;
  isCanceled: boolean;
  canStartTrial: boolean;
  isStartingTrial: boolean;
  trialDaysRemaining: number;
  priceType: 'monthly' | 'yearly' | null;
  hasAccess: boolean; // True if user has active subscription or is trialing
  checkSubscription: () => Promise<void>;
  startTrial: () => Promise<any>;
  createCheckout: (priceType: 'monthly' | 'yearly') => Promise<any>;
  openCustomerPortal: () => Promise<any>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscriptionData = useSubscription();
  
  // User has access if they have an active subscription or are in trial (app or Stripe)
  const hasAccess = subscriptionData.isActive || subscriptionData.isTrialing;

  return (
    <SubscriptionContext.Provider value={{ ...subscriptionData, hasAccess }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

// Re-export for convenience
export { SUBSCRIPTION_PRICES };
