import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Users } from "lucide-react";

export interface ExtraItem {
  id: string;
  descricao: string;
  valor: number;
  porConvidado: boolean;
}

interface ExtrasFormProps {
  extras: ExtraItem[];
  onChange: (extras: ExtraItem[]) => void;
  disabled?: boolean;
  guestCount?: number;
}

export function ExtrasForm({ extras, onChange, disabled = false, guestCount = 0 }: ExtrasFormProps) {
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoPorConvidado, setNovoPorConvidado] = useState(false);

  const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/\D/g, "");
    const number = parseInt(numericValue, 10) / 100;
    if (isNaN(number)) return "";
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyValue = (value: string): number => {
    if (!value) return 0;
    const numericString = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(numericString) || 0;
  };

  const handleValorChange = (value: string) => {
    setNovoValor(formatCurrencyInput(value));
  };

  const handleAddExtra = () => {
    if (!novaDescricao.trim() || parseCurrencyValue(novoValor) <= 0) return;

    const newExtra: ExtraItem = {
      id: crypto.randomUUID(),
      descricao: novaDescricao.trim(),
      valor: parseCurrencyValue(novoValor),
      porConvidado: novoPorConvidado,
    };

    onChange([...extras, newExtra]);
    setNovaDescricao("");
    setNovoValor("");
    setNovoPorConvidado(false);
  };

  const handleRemoveExtra = (id: string) => {
    onChange(extras.filter((e) => e.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calcularValorExtra = (extra: ExtraItem): number => {
    if (extra.porConvidado) {
      return extra.valor * guestCount;
    }
    return extra.valor;
  };

  const totalExtras = extras.reduce((sum, e) => sum + calcularValorExtra(e), 0);

  return (
    <div className="space-y-4">
      {/* Lista de extras existentes */}
      {extras.length > 0 && (
        <div className="space-y-2">
          {extras.map((extra) => (
            <div
              key={extra.id}
              className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{extra.descricao}</p>
                {extra.porConvidado && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {formatCurrency(extra.valor)} × {guestCount} convidados
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary">
                  {formatCurrency(calcularValorExtra(extra))}
                </span>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveExtra(extra.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {/* Total de extras */}
          <div className="flex justify-end pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Total Extras: <span className="font-semibold text-foreground">{formatCurrency(totalExtras)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Formulário para adicionar novo extra */}
      {!disabled && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label className="text-muted-foreground text-xs">Descrição</Label>
              <Input
                placeholder="Ex: Taxa de energia"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddExtra()}
              />
            </div>
            <div className="w-full sm:w-40">
              <Label className="text-muted-foreground text-xs">Valor (R$)</Label>
              <Input
                placeholder="0,00"
                value={novoValor}
                onChange={(e) => handleValorChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddExtra()}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddExtra}
                disabled={!novaDescricao.trim() || parseCurrencyValue(novoValor) <= 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="porConvidado"
              checked={novoPorConvidado}
              onCheckedChange={(checked) => setNovoPorConvidado(checked === true)}
            />
            <label
              htmlFor="porConvidado"
              className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Valor por convidado (multiplicar pelo número de convidados)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate total extras value
export function calcularTotalExtras(extras: ExtraItem[], guestCount: number): number {
  return extras.reduce((sum, extra) => {
    if (extra.porConvidado) {
      return sum + (extra.valor * guestCount);
    }
    return sum + extra.valor;
  }, 0);
}
