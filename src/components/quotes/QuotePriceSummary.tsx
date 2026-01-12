import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import type { QuoteComposicao } from "@/types/quote.types";
import { formatCurrency } from "@/lib/pricingCalculator";

interface QuotePriceSummaryProps {
  composicao: QuoteComposicao | null;
  nConvidados: number;
}

export function QuotePriceSummary({ composicao, nConvidados }: QuotePriceSummaryProps) {
  if (!composicao) {
    return (
      <Card className="p-6 bg-muted/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Resumo do Orçamento</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Configure o espaço e outros itens para ver o resumo
        </p>
      </Card>
    );
  }

  const hasDiscount = composicao.desconto_fixo > 0 || composicao.desconto_variavel > 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Resumo do Orçamento</h3>
      </div>

      <div className="space-y-4">
        {/* Itens selecionados */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Itens selecionados:
          </p>
          <div className="space-y-1">
            {composicao.itens.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.nome}
                  {item.tipo_preco === 'variavel' && item.unidade && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({item.unidade})
                    </span>
                  )}
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(item.valor_total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Valores Fixos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium text-foreground">Valores Fixos</p>
          </div>
          
          <div className="pl-6 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal fixo</span>
              <span className="text-foreground">
                {formatCurrency(composicao.subtotal_fixo)}
              </span>
            </div>
            
            {composicao.desconto_fixo > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto aplicado</span>
                <span>- {formatCurrency(composicao.desconto_fixo)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/50">
              <span className="text-foreground">Total Fixo</span>
              <span className="text-blue-600">
                {formatCurrency(composicao.total_fixo)}
              </span>
            </div>
          </div>
        </div>

        {/* Valores Variáveis */}
        {composicao.subtotal_variavel > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-purple-500" />
                <p className="text-sm font-medium text-foreground">
                  Valores Variáveis ({nConvidados} convidados)
                </p>
              </div>
              
              <div className="pl-6 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal variável</span>
                  <span className="text-foreground">
                    {formatCurrency(composicao.subtotal_variavel)}
                  </span>
                </div>
                
                {composicao.desconto_variavel > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto aplicado</span>
                    <span>- {formatCurrency(composicao.desconto_variavel)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/50">
                  <span className="text-foreground">Total Variável</span>
                  <span className="text-purple-600">
                    {formatCurrency(composicao.total_variavel)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Extras */}
        {composicao.total_extras > 0 && (
          <>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Extras</span>
              <span className="font-medium text-foreground">
                {formatCurrency(composicao.total_extras)}
              </span>
            </div>
          </>
        )}

        <Separator className="my-4" />

        {/* Total Geral */}
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">
              Valor Total
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(composicao.total_geral)}
            </span>
          </div>
          
          {hasDiscount && (
            <p className="text-xs text-green-600 mt-2 text-center">
              ✓ Descontos aplicados com sucesso
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}