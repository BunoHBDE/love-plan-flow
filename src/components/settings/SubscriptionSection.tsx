/**
 * SEÇÃO DE ASSINATURA
 * 
 * Exibe informações do plano atual, recursos incluídos e histórico de faturas.
 * TODO: Integrar com sistema de pagamento real (Stripe, etc.)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Receipt } from "lucide-react";
import { PLAN_FEATURES, MOCK_INVOICES } from "@/constants/settings";

export function SubscriptionSection() {
  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-gold" />
                Plano Atual
              </CardTitle>
              <CardDescription>Gerenciamento da sua assinatura</CardDescription>
            </div>
            <div className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-medium">
              Ativo
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">Plano Pro</span>
            <span className="text-muted-foreground">/ mensal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Próxima cobrança em 15 de Janeiro de 2026
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Alterar plano
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive">
              Cancelar assinatura
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

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Histórico de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_INVOICES.map((fatura, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{fatura.data}</p>
                  <p className="text-sm text-muted-foreground">{fatura.valor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                    {fatura.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}