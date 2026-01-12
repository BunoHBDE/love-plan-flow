import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { SpaceData } from "@/types/spaceSettings.types";
import { formatCurrency } from "@/lib/pricingCalculator";

interface SpaceSelectionProps {
  spaces: SpaceData[];
  selectedSpaceId: string | null;
  onSpaceChange: (spaceId: string) => void;
  diaSemana: string | null;
  anoEvento: string;
  disabled?: boolean;
}

export function SpaceSelection({
  spaces,
  selectedSpaceId,
  onSpaceChange,
  diaSemana,
  anoEvento,
  disabled = false,
}: SpaceSelectionProps) {
  // Filtrar espaços pelo ano do evento
  const spacesDoAno = spaces.filter((s) => s.ano === anoEvento);

  // Encontrar espaço selecionado
  const selectedSpace = spacesDoAno.find((s) => s.id === selectedSpaceId);

  // Encontrar preço do espaço selecionado para o dia da semana
  const precoDia = selectedSpace?.precos_por_dia?.find((p) =>
    diaSemana ? p.dias.includes(diaSemana) : false
  );

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-muted-foreground text-sm">
          Espaço (Opcional)
        </Label>
        <Select
          value={selectedSpaceId || ""}
          onValueChange={onSpaceChange}
          disabled={disabled || spacesDoAno.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um espaço" />
          </SelectTrigger>
          <SelectContent>
            {spacesDoAno.map((space) => (
              <SelectItem key={space.id} value={space.id!}>
                {space.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {spacesDoAno.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Nenhum espaço configurado para {anoEvento}
          </p>
        )}
      </div>

      {/* Detalhes do espaço selecionado */}
      {selectedSpace && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedSpace.nome}
                </h3>
                {precoDia && diaSemana && (
                  <div className="mt-2 text-sm">
                    {precoDia.tipo === 'fixo' ? (
                      <p className="text-muted-foreground">
                        Preço fixo: <span className="font-semibold text-primary">
                          {formatCurrency(precoDia.preco_fixo || 0)}
                        </span>
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {precoDia.valor_inicial && precoDia.valor_inicial > 0 && (
                          <p className="text-muted-foreground">
                            Valor inicial: <span className="font-semibold text-foreground">
                              {formatCurrency(precoDia.valor_inicial)}
                            </span>
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Valor por convidado: <span className="font-semibold text-primary">
                            {formatCurrency(precoDia.valor_por_convidado || 0)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {!diaSemana && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ Selecione o dia da semana para ver o preço
                  </p>
                )}
              </div>

              {/* Itens inclusos */}
              {selectedSpace.itens_inclusos.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Itens inclusos:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {selectedSpace.itens_inclusos.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}