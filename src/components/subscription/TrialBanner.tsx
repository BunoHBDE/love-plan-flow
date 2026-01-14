/**
 * BANNER DE TRIAL
 * 
 * Exibe um aviso sobre os dias restantes do período de trial.
 * Aparece apenas para usuários em trial (app ou Stripe).
 */

import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

export function TrialBanner() {
  const { isTrialing, isAppTrial, trialDaysRemaining, loading } = useSubscriptionContext();
  const navigate = useNavigate();

  // Só exibe para usuários em trial
  if (loading || !isTrialing) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/configuracoes?tab=assinatura');
  };

  // Define estilo baseado na urgência
  const isUrgent = trialDaysRemaining <= 3;
  const bannerStyles = isUrgent
    ? "bg-gradient-to-r from-destructive/10 via-destructive/5 to-destructive/10 border-destructive/30"
    : "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30";

  const iconStyles = isUrgent
    ? "bg-destructive/20 text-destructive"
    : "bg-primary/20 text-primary";

  const textStyles = isUrgent
    ? "text-destructive"
    : "text-primary";

  return (
    <div className={`rounded-xl border p-4 ${bannerStyles} animate-fade-in`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconStyles}`}>
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className={`font-semibold ${textStyles}`}>
              {trialDaysRemaining === 0 
                ? "Seu trial expira hoje!" 
                : trialDaysRemaining === 1 
                  ? "Resta 1 dia de trial" 
                  : `Restam ${trialDaysRemaining} dias de trial`}
            </p>
            <p className="text-sm text-muted-foreground">
              {isUrgent 
                ? "Assine agora para não perder acesso às funcionalidades"
                : isAppTrial 
                  ? "Aproveite para explorar todas as funcionalidades premium - sem cartão!"
                  : "Aproveite para explorar todas as funcionalidades premium"}
            </p>
          </div>
        </div>

        <Button 
          variant="gold" 
          size="sm" 
          onClick={handleUpgrade}
          className="gap-2 whitespace-nowrap"
        >
          <Sparkles className="h-4 w-4" />
          Assinar Agora
        </Button>
      </div>
    </div>
  );
}
