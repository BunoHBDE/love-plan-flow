import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";
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

  const handleToggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      onServicesChange(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      onServicesChange([...selectedServiceIds, serviceId]);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-muted-foreground text-sm">
        Serviços Extras (Opcionais)
      </Label>

      {servicosDoAno.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum serviço configurado para {anoEvento}
        </p>
      ) : (
        <div className="space-y-2">
          {servicosDoAno.map((service) => {
            const preco = service.precos?.[0];
            const isSelected = selectedServiceIds.includes(service.id!);

            return (
              <Card
                key={service.id}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/5 border-primary"
                    : "bg-card hover:bg-muted/50"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !disabled && handleToggleService(service.id!)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => !disabled && handleToggleService(service.id!)}
                    disabled={disabled}
                    className="mt-1"
                  />
                  
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">
                      {service.nome}
                    </h4>
                    
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}