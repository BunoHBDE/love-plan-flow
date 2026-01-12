import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Wrench, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServiceData } from "@/types/serviceSettings.types";
import { formatCurrency } from "@/lib/pricingCalculator";

interface ServicesSelectionProps {
  services: ServiceData[];
  selectedServiceIds: string[];
  onServicesChange: (serviceIds: string[]) => void;
  anoEvento: string;
  disabled?: boolean;
}

export function ServicesSelection({
  services,
  selectedServiceIds,
  onServicesChange,
  anoEvento,
  disabled = false,
}: ServicesSelectionProps) {
  // Filtrar serviços pelo ano do evento
  const servicosDoAno = services.filter((s) => s.ano === anoEvento);

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
    }
  };

  const handleRemoveService = (serviceId: string) => {
    onServicesChange(selectedServiceIds.filter((id) => id !== serviceId));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-muted-foreground text-sm">
          Serviços Extras (Opcionais)
        </Label>
        <div className="flex gap-2 mt-1">
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
        </div>

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
                        <div className="mt-2 text-sm">
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