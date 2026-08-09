import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DollarSign,
  ChevronDown,
  ChevronRight,
  Building2,
  UtensilsCrossed,
  Wrench,
  Package,
  Plus,
  Percent,
  Tag,
  Lock,
} from "lucide-react";
import type { QuoteComposicao, QuoteItem } from "@/types/quote.types";
import { formatCurrency } from "@/lib/pricingCalculator";
import { cn } from "@/lib/utils";

// =============================================================================
// TIPOS
// =============================================================================

export interface DiscountData {
  descricao: string;
  percentual: number;
  valor: number;
}

interface QuotePriceSummaryProps {
  composicao: QuoteComposicao | null;
  nConvidados: number;
  discount?: DiscountData;
  // Novos props para mostrar contexto do pacote
  packageInfo?: {
    nome: string;
    descontoFixo: number;
    descontoVariavel: number;
    itensIds: string[];
  } | null;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function QuotePriceSummary({ 
  composicao, 
  nConvidados, 
  discount,
  packageInfo,
}: QuotePriceSummaryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Estado vazio
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
          Selecione os itens do orçamento para ver o resumo
        </p>
      </Card>
    );
  }

  // Toggle expansão de item
  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Expandir/colapsar todos
  const expandAll = () => {
    setExpandedItems(new Set(composicao.itens.map((i) => i.id)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  // Verificar se item é do pacote
  const isPackageItem = (itemId: string) => {
    return packageInfo?.itensIds.includes(itemId) ?? false;
  };

  // Calcular desconto do pacote para um item específico
  const calcularDescontoPacoteItem = (item: QuoteItem): number => {
    if (!packageInfo) return 0;
    
    const percentual = item.tipo_preco === 'fixo' 
      ? packageInfo.descontoFixo 
      : packageInfo.descontoVariavel;
    
    return (item.valor_total * percentual) / 100;
  };

  // Separar itens do pacote vs extras
  const itensPackage = composicao.itens.filter((item) => isPackageItem(item.id));
  const itensExtras = composicao.itens.filter((item) => !isPackageItem(item.id));

  // Totais
  const hasPackageDiscount = composicao.desconto_fixo > 0 || composicao.desconto_variavel > 0;
  const totalDescontoPacote = composicao.desconto_fixo + composicao.desconto_variavel;
  const subtotalAntesDescontoManual = composicao.total_geral;
  const valorFinal = discount && discount.valor > 0 
    ? composicao.total_geral - discount.valor 
    : composicao.total_geral;

  // Ícone por tipo de item
  const getItemIcon = (tipo: string) => {
    switch (tipo) {
      case 'espaco':
        return <Building2 className="h-4 w-4" />;
      case 'buffet':
        return <UtensilsCrossed className="h-4 w-4" />;
      case 'servico':
        return <Wrench className="h-4 w-4" />;
      case 'extra':
        return <Plus className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // =============================================================================
  // RENDER: ITEM EXPANDÍVEL
  // =============================================================================

  const renderItem = (item: QuoteItem, isFromPackage: boolean) => {
    const isExpanded = expandedItems.has(item.id);
    const descontoPacoteItem = isFromPackage ? calcularDescontoPacoteItem(item) : 0;
    const valorComDesconto = item.valor_total - descontoPacoteItem;

    return (
      <Collapsible
        key={item.id}
        open={isExpanded}
        onOpenChange={() => toggleItem(item.id)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              "hover:bg-muted/50",
              isExpanded && "bg-muted/50",
              isFromPackage && "border-l-2 border-amber-400"
            )}
          >
            {/* Ícone de expansão */}
            <div className="text-muted-foreground">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>

            {/* Ícone do tipo */}
            <div className={cn(
              "p-1.5 rounded-md",
              isFromPackage 
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                : "bg-primary/10 text-primary"
            )}>
              {getItemIcon(item.tipo)}
            </div>

            {/* Nome e info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground truncate">
                  {item.nome}
                </span>
                {isFromPackage && (
                  <Lock className="h-3 w-3 text-amber-500 flex-shrink-0" />
                )}
              </div>
              {item.tipo_preco === 'variavel' && (
                <span className="text-xs text-muted-foreground">
                  {nConvidados} {item.unidade || 'un'}
                </span>
              )}
            </div>

            {/* Valor */}
            <div className="text-right flex-shrink-0">
              {descontoPacoteItem > 0 ? (
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground line-through block">
                    {formatCurrency(item.valor_total)}
                  </span>
                  <span className="font-semibold text-sm text-foreground">
                    {formatCurrency(valorComDesconto)}
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-sm text-foreground">
                  {formatCurrency(item.valor_total)}
                </span>
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="ml-11 mr-3 mb-3 p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
            {/* Composição do preço */}
            {item.tipo_preco === 'fixo' ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor fixo</span>
                <span className="text-foreground">{formatCurrency(item.valor_fixo || item.valor_total)}</span>
              </div>
            ) : (
              <>
                {item.valor_inicial && item.valor_inicial > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor base</span>
                    <span className="text-foreground">{formatCurrency(item.valor_inicial)}</span>
                  </div>
                )}
                {item.valor_por_unidade && item.valor_por_unidade > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(item.valor_por_unidade)} × {
                        // Calcular quantidade baseado nos valores
                        item.valor_inicial 
                          ? Math.round((item.valor_total - item.valor_inicial) / item.valor_por_unidade)
                          : Math.round(item.valor_total / item.valor_por_unidade)
                      } {item.unidade || 'un'}
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(item.valor_total - (item.valor_inicial || 0))}
                    </span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(item.valor_total)}</span>
                </div>
              </>
            )}

            {/* Desconto do pacote aplicado a este item */}
            {descontoPacoteItem > 0 && packageInfo && (
              <>
                <Separator className="my-1" />
                <div className="flex justify-between text-sm text-success">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Desconto pacote ({item.tipo_preco === 'fixo' ? packageInfo.descontoFixo : packageInfo.descontoVariavel}%)
                  </span>
                  <span>- {formatCurrency(descontoPacoteItem)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-foreground">Total do item</span>
                  <span className="text-primary">{formatCurrency(valorComDesconto)}</span>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Resumo do Orçamento</h3>
        </div>
        
        {composicao.itens.length > 0 && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="text-xs h-7 px-2"
            >
              Expandir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="text-xs h-7 px-2"
            >
              Colapsar
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Badge do Pacote (se aplicável) */}
        {packageInfo && (
          <div className="flex items-center gap-2 p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Package className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {packageInfo.nome}
            </span>
            <Badge variant="secondary" className="ml-auto bg-success/10 text-success text-xs">
              -{packageInfo.descontoFixo}% fixo / -{packageInfo.descontoVariavel}% var
            </Badge>
          </div>
        )}

        {/* Itens do Pacote */}
        {itensPackage.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Itens do Pacote
              </p>
            </div>
            <div className="space-y-1">
              {itensPackage.map((item) => renderItem(item, true))}
            </div>
          </div>
        )}

        {/* Itens Extras / Personalizados */}
        {itensExtras.length > 0 && (
          <div>
            {packageInfo && (
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {packageInfo ? "Itens Extras" : "Itens Selecionados"}
                </p>
              </div>
            )}
            <div className="space-y-1">
              {itensExtras.map((item) => renderItem(item, false))}
            </div>
          </div>
        )}

        {/* Extras do orçamento (ExtraItems) */}
        {composicao.total_extras > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Extras adicionais</span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(composicao.total_extras)}
              </span>
            </div>
          </>
        )}

        <Separator className="my-2" />

        {/* Resumo de Totais */}
        <div className="space-y-2">
          {/* Subtotal (antes de qualquer desconto) */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal dos itens</span>
            <span className="text-foreground">
              {formatCurrency(composicao.subtotal_fixo + composicao.subtotal_variavel + composicao.total_extras)}
            </span>
          </div>

          {/* Desconto do Pacote */}
          {hasPackageDiscount && (
            <div className="flex justify-between text-sm text-success">
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                Desconto do pacote
              </span>
              <span>- {formatCurrency(totalDescontoPacote)}</span>
            </div>
          )}

          {/* Subtotal após desconto do pacote (se houver desconto manual) */}
          {discount && discount.valor > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">
                {formatCurrency(subtotalAntesDescontoManual)}
              </span>
            </div>
          )}

          {/* Desconto Manual */}
          {discount && discount.valor > 0 && (
            <div className="flex justify-between text-sm text-success">
              <div className="flex flex-col">
                <span className="flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5" />
                  Desconto adicional ({discount.percentual.toFixed(1)}%)
                </span>
                {discount.descricao && (
                  <span className="text-xs text-muted-foreground">
                    {discount.descricao}
                  </span>
                )}
              </div>
              <span>- {formatCurrency(discount.valor)}</span>
            </div>
          )}
        </div>

        {/* Total Final */}
        <div className="bg-primary/10 rounded-lg p-4 mt-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-base font-semibold text-foreground">
              Valor Total
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(valorFinal)}
            </span>
          </div>

          {/* Resumo dos descontos aplicados */}
          {(hasPackageDiscount || (discount && discount.valor > 0)) && (
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Economia total:</p>
              <p className="text-sm font-semibold text-success">
                {formatCurrency(totalDescontoPacote + (discount?.valor || 0))}
              </p>
            </div>
          )}

          {/* Valor por convidado */}
          {nConvidados > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {formatCurrency(valorFinal / nConvidados)} por convidado
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}