import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_PRICES } from '@/hooks/useSubscription';

const features = [
  'Orçamentos ilimitados em PDF',
  'Gestão completa de clientes',
  'Agendamento de visitas',
  'Calendário de disponibilidade',
  'Gestão de espaços e buffet',
  'Condições de pagamento personalizáveis',
  'Suporte por email',
];

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const currentPrice = billingPeriod === 'yearly' 
    ? SUBSCRIPTION_PRICES.yearly 
    : SUBSCRIPTION_PRICES.monthly;

  const monthlyEquivalent = billingPeriod === 'yearly' 
    ? (SUBSCRIPTION_PRICES.yearly.amount / 12).toFixed(2)
    : SUBSCRIPTION_PRICES.monthly.amount.toFixed(2);

  return (
    <section id="precos" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-4">
            Plano simples,{' '}
            <span className="text-gradient-gold">preço justo</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Comece com 14 dias grátis. Sem compromisso, cancele quando quiser.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              billingPeriod === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Anual
            {billingPeriod === 'yearly' && (
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                -20%
              </span>
            )}
          </button>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="relative rounded-2xl bg-background border-2 border-accent shadow-gold p-8 animate-scale-in">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 bg-gradient-gold text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium shadow-gold">
                <Sparkles size={14} />
                Plano Pro
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-8 pt-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-muted-foreground text-lg">R$</span>
                <span className="text-5xl font-bold text-primary">{monthlyEquivalent.split('.')[0]}</span>
                <span className="text-2xl font-bold text-primary">,{monthlyEquivalent.split('.')[1]}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-secondary mt-2 font-medium">
                  {SUBSCRIPTION_PRICES.yearly.savings}
                </p>
              )}
              {billingPeriod === 'yearly' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cobrado anualmente: R$ {SUBSCRIPTION_PRICES.yearly.amount.toFixed(2)}
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check size={18} className="text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="gold" size="lg" className="w-full" asChild>
              <Link to="/auth?mode=signup">
                Começar 14 dias grátis
              </Link>
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Sem cartão de crédito para iniciar o trial
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
