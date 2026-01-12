import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import type { ServiceData } from "@/types/serviceSettings.types";
import { formatCurrency } from "@/lib/pricingCalculator";

export interface ServiceWithQuantity {
  serviceId: string;
  quantity: number;
}

interface ServicesSelectionProps {
  services: ServiceData[];
  selectedServiceIds: string[];
  serviceQuantities: Record<string, number>; // { serviceId: quantity }
  onServicesChange: (serviceIds: string[]) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  anoEvento: string;
  disabled?: boolean;
}

export function ServicesSelection({
  services,
  selectedServiceIds,
  serviceQuantities,
  onServicesChange,
  onQuantityChange,
  anoEvento,
  disabled = false,
}: ServicesSelectionProps) {
  // Filtrar serviços pelo ano do evento
  const servicosDoAno = services.filter((s) => s.ano === anoEvento);

  // State temporário para inputs vazios
  const [tempQuantities, setTempQuantities] = React.useState<Record<string, string>>({});

  // Serviços disponíveis para adicionar (não selecionados)
  const servicosDisponiveis = servicosDoAno.filter(
    (s) => !selectedServiceIds.includes(s.id!)
  );

  // Serviços selecionados
  const selectedServices = servicosDoAno.filter((s) =>
    selectedServiceIds.includes(s.id!)
  );

  const handleAddService = (serviceId: string) => {
    if (serviceId && serviceId !== "none") {
      onServicesChange([...selectedServiceIds, serviceId]);
      // Inicializar quantidade padrão como 1
      onQuantityChange(serviceId, 1);
      setTempQuantities(prev => ({ ...prev, [serviceId]: "1" }));
    }
  };

  const handleRemoveService = (serviceId: string) => {
    onServicesChange(selectedServiceIds.filter((id) => id !== serviceId));
    // Limpar quantidade temporária
    setTempQuantities(prev => {
      const newTemp = { ...prev };
      delete newTemp[serviceId];
      return newTemp;
    });
  };

  const handleQuantityChange = (serviceId: string, value: string) => {
    // Permitir campo vazio
    setTempQuantities(prev => ({ ...prev, [serviceId]: value }));
    
    // Atualizar o valor real apenas se for um número válido
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0) {
      onQuantityChange(serviceId, quantity);
    }
  };

  const handleQuantityBlur = (serviceId: string) => {
    const tempValue = tempQuantities[serviceId];
    const quantity = parseInt(tempValue);
    
    // Se estiver vazio ou inválido, resetar para 1
    if (!tempValue || isNaN(quantity) || quantity < 1) {
      onQuantityChange(serviceId, 1);
      setTempQuantities(prev => ({ ...prev, [serviceId]: "1" }));
    }
  };

  // Verificar se o serviço precisa de input de quantidade
  const needsQuantityInput = (service: ServiceData): boolean => {
    const preco = service.precos?.[0];
    if (!preco || preco.tipo === 'fixo') return false;
    
    const unidade = preco.unidade?.toLowerCase() || '';
    return unidade !== 'pessoa' && unidade !== 'pessoas' && unidade !== 'convidado' && unidade !== 'convidados';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-muted-foreground text-sm">
          Serviços Extras (Opcionais)
        </Label>
        <Select
          value="none"
          onValueChange={handleAddService}
          disabled={disabled || servicosDisponiveis.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Adicionar serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled>
              Selecione um serviço
            </SelectItem>
            {servicosDisponiveis.map((service) => (
              <SelectItem key={service.id} value={service.id!}>
                {service.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {servicosDoAno.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Nenhum serviço configurado para {anoEvento}
          </p>
        )}
      </div>

      {/* Cards dos serviços selecionados */}
      {selectedServices.length > 0 && (
        <div className="space-y-2">
          {selectedServices.map((service) => {
            const preco = service.precos?.[0];
            const needsInput = needsQuantityInput(service);
            const quantity = serviceQuantities[service.id!] || 1;

            return (
              <Card key={service.id} className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">
                          {service.nome}
                        </h3>
                        {!disabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveService(service.id!)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {service.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.descricao}
                        </p>
                      )}

                      {preco && (
                        <div className="mt-2 space-y-2">
                          <div className="text-sm">
                            {preco.tipo === 'fixo' ? (
                              <p className="text-muted-foreground">
                                Preço: <span className="font-semibold text-primary">
                                  {formatCurrency(preco.preco_fixo || 0)}
                                </span>
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {preco.valor_inicial && preco.valor_inicial > 0 && (
                                  <p className="text-muted-foreground">
                                    Valor inicial: <span className="font-semibold text-foreground">
                                      {formatCurrency(preco.valor_inicial)}
                                    </span>
                                  </p>
                                )}
                                <p className="text-muted-foreground">
                                  Valor por {preco.unidade || 'unidade'}: <span className="font-semibold text-primary">
                                    {formatCurrency(preco.valor_por_unidade || 0)}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Input de quantidade para unidades customizadas */}
                          {needsInput && preco.tipo === 'variavel' && (
                            <div className="pt-2 border-t border-border">
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Quantidade de {preco.unidade || 'unidades'}
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                value={tempQuantities[service.id!] ?? quantity}
                                onChange={(e) => handleQuantityChange(service.id!, e.target.value)}
                                onBlur={() => handleQuantityBlur(service.id!)}
                                disabled={disabled}
                                className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Subtotal: <span className="font-semibold text-primary">
                                  {formatCurrency(
                                    (preco.valor_inicial || 0) + 
                                    ((preco.valor_por_unidade || 0) * (quantity || 0))
                                  )}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}