import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";
import type { BuffetData } from "@/types/buffetSettings.types";
import { formatCurrency } from "@/lib/pricingCalculator";

interface BuffetSelectionProps {
  buffets: BuffetData[];
  selectedBuffetId: string | null;
  onBuffetChange: (buffetId: string | null) => void;
  anoEvento: string;
  disabled?: boolean;
}

export function BuffetSelection({
  buffets,
  selectedBuffetId,
  onBuffetChange,
  anoEvento,
  disabled = false,
}: BuffetSelectionProps) {
  // Filtrar buffets pelo ano do evento
  const buffetsDoAno = buffets.filter((b) => b.ano === anoEvento);

  // Encontrar buffet selecionado
  const selectedBuffet = buffetsDoAno.find((b) => b.id === selectedBuffetId);

  // Encontrar preço do buffet selecionado
  const preco = selectedBuffet?.precos_por_pessoa?.[0];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-muted-foreground text-sm">
          Buffet (Opcional)
        </Label>
        <Select
          value={selectedBuffetId || "none"}
          onValueChange={(value) => onBuffetChange(value === "none" ? null : value)}
          disabled={disabled || buffetsDoAno.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nenhum buffet selecionado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum buffet</SelectItem>
            {buffetsDoAno.map((buffet) => (
              <SelectItem key={buffet.id} value={buffet.id!}>
                {buffet.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {buffetsDoAno.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Nenhum buffet configurado para {anoEvento}
          </p>
        )}
      </div>

      {/* Detalhes do buffet selecionado */}
      {selectedBuffet && preco && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedBuffet.nome}
                </h3>
                <div className="mt-2 text-sm">
                  {preco.tipo === 'fixo' ? (
                    <p className="text-muted-foreground">
                      Preço por pessoa: <span className="font-semibold text-primary">
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
                        Valor por pessoa: <span className="font-semibold text-primary">
                          {formatCurrency(preco.valor_por_pessoa || 0)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Itens inclusos */}
              {selectedBuffet.itens_inclusos && selectedBuffet.itens_inclusos.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Itens inclusos:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {selectedBuffet.itens_inclusos.map((item, idx) => (
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