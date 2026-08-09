import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Building2,
  UtensilsCrossed,
  Wrench,
  Lock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { SpaceData } from "@/types/spaceSettings.types";
import type { BuffetData } from "@/types/buffetSettings.types";
import type { ServiceData } from "@/types/serviceSettings.types";
import type { PackageData } from "@/types/packageSettings.types";

import { SpaceSelection } from "./SpaceSelection";
import { BuffetSelection } from "./BuffetSelection";
import { ServicesSelection } from "./ServicesSelection";
import { formatCurrency } from "@/lib/pricingCalculator";
import { Input } from "@/components/ui/input";
import React from "react";

// =============================================================================
// TIPOS
// =============================================================================

export type SelectionMode = "personalizado" | "pacote";

export interface QuoteItemsSelections {
  mode: SelectionMode;
  espacoId: string | null;
  buffetId: string | null;
  servicoIds: string[];
  serviceQuantities: Record<string, number>;
  pacoteId: string | null;
  // IDs dos itens que vieram do pacote (para mostrar como bloqueados)
  packageLockedItems: {
    espacoId: string | null;
    buffetId: string | null;
    servicoIds: string[];
  };
}

interface QuoteItemsSectionProps {
  // Dados disponíveis
  spaces: SpaceData[];
  buffets: BuffetData[];
  services: ServiceData[];
  packages: PackageData[];
  
  // Seleções atuais
  selections: QuoteItemsSelections;
  onSelectionsChange: React.Dispatch<React.SetStateAction<QuoteItemsSelections>>;
  
  // Contexto
  anoEvento: string;
  diaSemana: string | null;
  
  // Estado
  disabled?: boolean;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function QuoteItemsSection({
  spaces,
  buffets,
  services,
  packages,
  selections,
  onSelectionsChange,
  anoEvento,
  diaSemana,
  disabled = false,
}: QuoteItemsSectionProps) {
  // Filtrar dados pelo ano
  const pacotesDoAno = packages.filter((p) => p.ano === anoEvento);
  const spacesDoAno = spaces.filter((s) => s.ano === anoEvento);
  const buffetsDoAno = buffets.filter((b) => b.ano === anoEvento);
  const servicesDoAno = services.filter((s) => s.ano === anoEvento);

  // Pacote selecionado
  const selectedPackage = pacotesDoAno.find((p) => p.id === selections.pacoteId);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  // IMPORTANTE: todos os handlers usam updates funcionais (prev => ...).
  // Isso evita que chamadas encadeadas no mesmo evento (ex.: adicionar um
  // serviço dispara onServicesChange + onQuantityChange) se sobrescrevam por
  // usarem uma cópia desatualizada de `selections`.
  const handleModeChange = (mode: SelectionMode) => {
    if (mode === "personalizado") {
      // Limpar seleções do pacote, manter itens desbloqueados
      onSelectionsChange((prev) => ({
        ...prev,
        mode: "personalizado",
        pacoteId: null,
        packageLockedItems: {
          espacoId: null,
          buffetId: null,
          servicoIds: [],
        },
      }));
    } else {
      // Mudar para modo pacote - limpar seleções manuais
      onSelectionsChange((prev) => ({
        ...prev,
        mode: "pacote",
        espacoId: null,
        buffetId: null,
        servicoIds: [],
        serviceQuantities: {},
        packageLockedItems: {
          espacoId: null,
          buffetId: null,
          servicoIds: [],
        },
      }));
    }
  };

  const handlePackageChange = (packageId: string | null) => {
    if (!packageId) {
      // Removeu pacote - voltar para modo personalizado
      onSelectionsChange((prev) => ({
        ...prev,
        mode: "personalizado",
        pacoteId: null,
        espacoId: null,
        buffetId: null,
        servicoIds: [],
        serviceQuantities: {},
        packageLockedItems: {
          espacoId: null,
          buffetId: null,
          servicoIds: [],
        },
      }));
      return;
    }

    const pkg = pacotesDoAno.find((p) => p.id === packageId);
    if (!pkg) return;

    // Auto-selecionar itens do pacote
    const espacoIdFromPackage = pkg.itens_pacote.espacos[0] || null;
    const buffetIdFromPackage = pkg.itens_pacote.buffets[0] || null;
    const servicoIdsFromPackage = pkg.itens_pacote.servicos || [];

    // Inicializar quantidades dos serviços
    const newServiceQuantities: Record<string, number> = {};
    servicoIdsFromPackage.forEach((id) => {
      newServiceQuantities[id] = 1;
    });

    onSelectionsChange((prev) => ({
      ...prev,
      mode: "pacote",
      pacoteId: packageId,
      espacoId: espacoIdFromPackage,
      buffetId: buffetIdFromPackage,
      servicoIds: servicoIdsFromPackage,
      serviceQuantities: newServiceQuantities,
      packageLockedItems: {
        espacoId: espacoIdFromPackage,
        buffetId: buffetIdFromPackage,
        servicoIds: servicoIdsFromPackage,
      },
    }));
  };

  // Handlers para modo personalizado
  const handleSpaceChange = (spaceId: string | null) => {
    onSelectionsChange((prev) => ({
      ...prev,
      espacoId: spaceId,
    }));
  };

  const handleBuffetChange = (buffetId: string | null) => {
    onSelectionsChange((prev) => ({
      ...prev,
      buffetId: buffetId,
    }));
  };

  const handleServicesChange = (serviceIds: string[]) => {
    onSelectionsChange((prev) => ({
      ...prev,
      servicoIds: serviceIds,
    }));
  };

  const handleServiceQuantityChange = (serviceId: string, quantity: number) => {
    onSelectionsChange((prev) => ({
      ...prev,
      serviceQuantities: {
        ...prev.serviceQuantities,
        [serviceId]: quantity,
      },
    }));
  };

  // Handler para serviços EXTRAS (além do pacote)
  const handleExtraServicesChange = (serviceIds: string[]) => {
    onSelectionsChange((prev) => {
      // Manter os serviços do pacote + adicionar os extras
      const packageServiceIds = prev.packageLockedItems.servicoIds;
      const allServiceIds = [...new Set([...packageServiceIds, ...serviceIds])];
      return {
        ...prev,
        servicoIds: allServiceIds,
      };
    });
  };

  // Serviços extras (não incluídos no pacote)
  const extraServiceIds = selections.servicoIds.filter(
    (id) => !selections.packageLockedItems.servicoIds.includes(id)
  );

  // Serviços disponíveis para adicionar como extra (não estão no pacote)
  const availableExtraServices = servicesDoAno.filter(
    (s) => !selections.packageLockedItems.servicoIds.includes(s.id!)
  );

  // =============================================================================
  // RENDER: MODO PERSONALIZADO
  // =============================================================================

  const renderPersonalizedMode = () => (
    <div className="space-y-6">
      <SpaceSelection
        spaces={spaces}
        selectedSpaceId={selections.espacoId}
        onSpaceChange={handleSpaceChange}
        diaSemana={diaSemana}
        anoEvento={anoEvento}
        disabled={disabled}
      />

      <BuffetSelection
        buffets={buffets}
        selectedBuffetId={selections.buffetId}
        onBuffetChange={handleBuffetChange}
        anoEvento={anoEvento}
        disabled={disabled}
      />

      <ServicesSelection
        services={services}
        selectedServiceIds={selections.servicoIds}
        serviceQuantities={selections.serviceQuantities}
        onServicesChange={handleServicesChange}
        onQuantityChange={handleServiceQuantityChange}
        anoEvento={anoEvento}
        disabled={disabled}
      />
    </div>
  );

  // =============================================================================
  // RENDER: MODO PACOTE
  // =============================================================================

  const renderPackageMode = () => (
    <div className="space-y-6">
      {/* Seleção do Pacote */}
      <div>
        <Label className="text-muted-foreground text-sm">
          Selecione o Pacote
        </Label>
        <Select
          value={selections.pacoteId || "none"}
          onValueChange={(value) => handlePackageChange(value === "none" ? null : value)}
          disabled={disabled || pacotesDoAno.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Escolha um pacote" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Selecione um pacote...</SelectItem>
            {pacotesDoAno.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id!}>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {pkg.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pacotesDoAno.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Nenhum pacote configurado para {anoEvento}
          </p>
        )}
      </div>

      {/* Detalhes do Pacote Selecionado */}
      {selectedPackage && (
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <div className="space-y-4">
            {/* Header do Pacote */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg text-foreground">
                    {selectedPackage.nome}
                  </h3>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Pacote Ativo
                  </Badge>
                </div>
                {selectedPackage.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPackage.descricao}
                  </p>
                )}
              </div>
            </div>

            {/* Descontos do Pacote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50">
                <p className="text-xs text-muted-foreground mb-1">Desconto em valores fixos</p>
                <p className="text-xl font-bold text-success">
                  {selectedPackage.desconto_percentual}%
                </p>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50">
                <p className="text-xs text-muted-foreground mb-1">Desconto em valores variáveis</p>
                <p className="text-xl font-bold text-success">
                  {selectedPackage.desconto_percentual_variavel}%
                </p>
              </div>
            </div>

            {/* Itens Inclusos (Bloqueados) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-foreground">
                  Itens inclusos no pacote
                </p>
              </div>

              <div className="space-y-2">
                {/* Espaço do Pacote */}
                {selections.packageLockedItems.espacoId && (
                  <LockedItemCard
                    icon={<Building2 className="h-4 w-4" />}
                    type="Espaço"
                    item={spacesDoAno.find((s) => s.id === selections.packageLockedItems.espacoId)}
                    diaSemana={diaSemana}
                  />
                )}

                {/* Buffet do Pacote */}
                {selections.packageLockedItems.buffetId && (
                  <LockedItemCard
                    icon={<UtensilsCrossed className="h-4 w-4" />}
                    type="Buffet"
                    item={buffetsDoAno.find((b) => b.id === selections.packageLockedItems.buffetId)}
                  />
                )}

                {/* Serviços do Pacote */}
                {selections.packageLockedItems.servicoIds.map((serviceId) => {
                  const service = servicesDoAno.find((s) => s.id === serviceId);
                  if (!service) return null;
                  return (
                    <LockedItemCard
                      key={serviceId}
                      icon={<Wrench className="h-4 w-4" />}
                      type="Serviço"
                      item={service}
                      serviceId={serviceId}  // ← ADICIONAR
                      quantity={selections.serviceQuantities[serviceId] || 1}  // ← ADICIONAR
                      onQuantityChange={handleServiceQuantityChange}  // ← ADICIONAR
                      disabled={disabled}  // ← ADICIONAR
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Serviços Extras (Além do Pacote) */}
      {selections.pacoteId && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Serviços Extras
            </h3>
            <span className="text-sm text-muted-foreground">
              (além do pacote)
            </span>
          </div>

          <ServicesSelection
            services={availableExtraServices}
            selectedServiceIds={extraServiceIds}
            serviceQuantities={selections.serviceQuantities}
            onServicesChange={handleExtraServicesChange}
            onQuantityChange={handleServiceQuantityChange}
            anoEvento={anoEvento}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Seletor de Modo */}
      <div className="space-y-3">
        <Label id="modo-orcamento-label" className="text-sm font-medium text-foreground">
          Como deseja montar o orçamento?
        </Label>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          role="group"
          aria-labelledby="modo-orcamento-label"
        >
          {/* Opção Personalizado */}
          <button
            type="button"
            onClick={() => handleModeChange("personalizado")}
            disabled={disabled}
            aria-pressed={selections.mode === "personalizado"}
            className={cn(
              "relative flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-left w-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selections.mode === "personalizado"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-muted/30",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selections.mode === "personalizado"
                  ? "bg-primary/10"
                  : "bg-muted"
              )}>
                <Wrench className={cn(
                  "h-5 w-5",
                  selections.mode === "personalizado"
                    ? "text-primary"
                    : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-semibold",
                  selections.mode === "personalizado"
                    ? "text-primary"
                    : "text-foreground"
                )}>
                  Personalizado
                </p>
                <p className="text-xs text-muted-foreground">
                  Escolha cada item individualmente
                </p>
              </div>
              {selections.mode === "personalizado" && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </div>
          </button>

          {/* Opção Pacote */}
          <button
            type="button"
            onClick={() => handleModeChange("pacote")}
            disabled={disabled || pacotesDoAno.length === 0}
            aria-pressed={selections.mode === "pacote"}
            className={cn(
              "relative flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-left w-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selections.mode === "pacote"
                ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm"
                : "border-border hover:border-amber-400/40 hover:bg-muted/30",
              (disabled || pacotesDoAno.length === 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selections.mode === "pacote"
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "bg-muted"
              )}>
                <Package className={cn(
                  "h-5 w-5",
                  selections.mode === "pacote"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-semibold",
                  selections.mode === "pacote"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-foreground"
                )}>
                  Usar Pacote
                </p>
                <p className="text-xs text-muted-foreground">
                  {pacotesDoAno.length > 0
                    ? `${pacotesDoAno.length} pacote(s) disponível(is)`
                    : "Nenhum pacote para este ano"}
                </p>
              </div>
              {selections.mode === "pacote" && (
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Conteúdo baseado no modo */}
      {selections.mode === "personalizado" 
        ? renderPersonalizedMode() 
        : renderPackageMode()
      }
    </div>
  );
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

interface LockedItemCardProps {
  icon: React.ReactNode;
  type: string;
  item?: { nome: string; precos_por_dia?: any[]; precos_por_pessoa?: any[]; precos?: any[] };
  diaSemana?: string | null;
  // ADICIONAR:
  serviceId?: string;
  quantity?: number;
  onQuantityChange?: (serviceId: string, quantity: number) => void;
  disabled?: boolean;
}

function LockedItemCard({ 
  icon, 
  type, 
  item, 
  diaSemana,
  serviceId,
  quantity = 1,
  onQuantityChange,
  disabled = false,
}: LockedItemCardProps) {
  // Inicializar com o valor atual da quantidade
  const [tempQuantity, setTempQuantity] = React.useState<string>(
    quantity ? quantity.toString() : "1"
  );

  // Sincronizar quando quantity externa mudar
  React.useEffect(() => {
    if (quantity !== undefined) {
      setTempQuantity(quantity.toString());
    }
  }, [quantity]);

  // Verificar se precisa de input de quantidade
  const needsQuantityInput = React.useMemo(() => {
    if (type !== "Serviço" || !item || !('precos' in item)) return false;
    
    const preco = item.precos?.[0];
    if (!preco || preco.tipo === 'fixo') return false;
    
    const unidade = preco.unidade?.toLowerCase() || '';
    return unidade !== 'pessoa' && 
           unidade !== 'pessoas' && 
           unidade !== 'convidado' && 
           unidade !== 'convidados';
  }, [item, type]);

  // Todos os hooks já foram chamados; agora é seguro sair se não houver item.
  if (!item) return null;

  // Handlers de quantidade
  const handleQuantityChange = (value: string) => {
    // Permitir campo vazio temporariamente
    setTempQuantity(value);
    
    // Só atualizar o pai se for número válido
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && serviceId && onQuantityChange) {
      onQuantityChange(serviceId, num);
    }
  };

  const handleQuantityBlur = () => {
    const num = parseInt(tempQuantity);
    
    // Se vazio ou inválido, resetar para 1
    if (!tempQuantity || isNaN(num) || num < 1) {
      setTempQuantity("1");
      if (serviceId && onQuantityChange) {
        onQuantityChange(serviceId, 1);
      }
    }
  };

  // Tentar extrair preço para exibição
  let precoInfo: string | null = null;
  let preco: any = null;
  
  if ('precos_por_dia' in item && item.precos_por_dia && diaSemana) {
    const precoDia = item.precos_por_dia.find((p: any) => p.dias?.includes(diaSemana));
    if (precoDia) {
      preco = precoDia;
      if (precoDia.tipo === 'fixo') {
        precoInfo = formatCurrency(precoDia.preco_fixo || 0);
      } else {
        precoInfo = `${formatCurrency(precoDia.valor_por_convidado || 0)}/pessoa`;
      }
    }
  } else if ('precos_por_pessoa' in item && item.precos_por_pessoa?.[0]) {
    preco = item.precos_por_pessoa[0];
    if (preco.tipo === 'fixo') {
      precoInfo = `${formatCurrency(preco.preco_fixo || 0)}/pessoa`;
    } else {
      precoInfo = `${formatCurrency(preco.valor_por_pessoa || 0)}/pessoa`;
    }
  } else if ('precos' in item && item.precos?.[0]) {
    preco = item.precos[0];
    if (preco.tipo === 'fixo') {
      precoInfo = formatCurrency(preco.preco_fixo || 0);
    } else {
      precoInfo = `${formatCurrency(preco.valor_por_unidade || 0)}/${preco.unidade || 'un'}`;
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/80 dark:bg-black/30 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-md text-amber-600 dark:text-amber-400">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{type}</p>
          <p className="font-medium text-sm text-foreground truncate">{item.nome}</p>
        </div>
        <div className="flex items-center gap-2">
          {precoInfo && !needsQuantityInput && (
            <span className="text-sm text-muted-foreground">{precoInfo}</span>
          )}
        </div>
      </div>

      {/* Campo de quantidade para serviços com unidade customizada */}
      {needsQuantityInput && preco && (
        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
          <Label className="text-xs text-muted-foreground mb-1 block">
            Quantidade de {preco.unidade || 'unidades'}
          </Label>
          <Input
            type="number"
            min="1"
            value={tempQuantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onBlur={handleQuantityBlur}
            disabled={disabled}
            className="h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Subtotal: <span className="font-semibold text-amber-700 dark:text-amber-300">
              {formatCurrency(
                (preco.valor_inicial || 0) + 
                ((preco.valor_por_unidade || 0) * (parseInt(tempQuantity) || 0))
              )}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORT DEFAULT DAS SELEÇÕES INICIAIS
// =============================================================================

export const initialQuoteItemsSelections: QuoteItemsSelections = {
  mode: "personalizado",
  espacoId: null,
  buffetId: null,
  servicoIds: [],
  serviceQuantities: {},
  pacoteId: null,
  packageLockedItems: {
    espacoId: null,
    buffetId: null,
    servicoIds: [],
  },
};