import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Percent, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";

export interface DiscountData {
  descricao: string;
  percentual: number;
  valor: number;
}

interface DiscountFormProps {
  valorTotal: number;
  discount: DiscountData;
  onChange: (discount: DiscountData) => void;
}

export function DiscountForm({
  valorTotal,
  discount,
  onChange,
}: DiscountFormProps) {
  const [percentualInput, setPercentualInput] = useState(discount.percentual.toString());
  const [valorInput, setValorInput] = useState("");
  const [valorManual, setValorManual] = useState<number | null>(null);

  // Format number to Brazilian format for display (1.234,56)
  const formatNumberBR = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse Brazilian formatted number to float
  const parseNumberBR = (value: string): number => {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized);
  };

  // Calculate discount value
  const valorDescontoCalculado = (valorTotal * discount.percentual) / 100;
  const valorDesconto = valorManual !== null ? valorManual : valorDescontoCalculado;
  const percentualEfetivo = valorTotal > 0 ? (valorDesconto / valorTotal) * 100 : 0;

  // Initialize valorInput when component mounts or valorTotal changes
  useEffect(() => {
    setValorManual(null);
    setValorInput(formatNumberBR((valorTotal * discount.percentual) / 100));
  }, [valorTotal]);

  // Update parent when values change
  useEffect(() => {
    onChange({
      descricao: discount.descricao,
      percentual: percentualEfetivo,
      valor: valorDesconto,
    });
  }, [percentualEfetivo, valorDesconto, discount.descricao]);

  const handleDescricaoChange = (value: string) => {
    onChange({
      ...discount,
      descricao: value,
    });
  };

  const handlePercentualChange = (value: string) => {
    setPercentualInput(value);
    setValorManual(null);
    
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      const clamped = Math.min(num, 100);
      const novoValorDesconto = (valorTotal * clamped) / 100;
      setValorInput(formatNumberBR(novoValorDesconto));
      
      onChange({
        descricao: discount.descricao,
        percentual: clamped,
        valor: novoValorDesconto,
      });
    } else if (value === "" || value === "0") {
      setValorInput(formatNumberBR(0));
      onChange({
        descricao: discount.descricao,
        percentual: 0,
        valor: 0,
      });
    }
  };

  const handlePercentualBlur = () => {
    const num = parseFloat(percentualInput);
    if (isNaN(num) || num < 0) {
      setPercentualInput("0");
      setValorInput(formatNumberBR(0));
      onChange({
        descricao: discount.descricao,
        percentual: 0,
        valor: 0,
      });
    } else {
      const clamped = Math.min(num, 100);
      setPercentualInput(clamped.toString());
      const novoValorDesconto = (valorTotal * clamped) / 100;
      setValorInput(formatNumberBR(novoValorDesconto));
    }
    setValorManual(null);
  };

  const handleValorChange = (value: string) => {
    setValorInput(value);
  };

  const handleValorBlur = () => {
    const num = parseNumberBR(valorInput);
    
    if (isNaN(num) || num < 0) {
      setValorManual(null);
      setValorInput(formatNumberBR(valorDescontoCalculado));
    } else if (num > valorTotal) {
      setValorManual(valorTotal);
      setValorInput(formatNumberBR(valorTotal));
      const newPercentual = 100;
      setPercentualInput(newPercentual.toString());
    } else {
      setValorManual(num);
      setValorInput(formatNumberBR(num));
      const newPercentual = valorTotal > 0 ? (num / valorTotal) * 100 : 0;
      setPercentualInput(newPercentual.toFixed(2));
    }
  };

  const valorFinal = valorTotal - valorDesconto;

  return (
    <div className="space-y-3">
      {/* Descrição - Compacta */}
      <div>
        <Label className="text-muted-foreground text-xs">
          Descrição (opcional)
        </Label>
        <Textarea
          placeholder="Ex: Desconto promocional..."
          value={discount.descricao}
          onChange={(e) => handleDescricaoChange(e.target.value)}
          rows={1}
          className="resize-none text-sm min-h-[36px]"
        />
      </div>

      {/* Campos de Percentual e Valor - Grid responsivo */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-muted-foreground text-xs flex items-center gap-1">
            <Percent className="h-3 w-3" />
            Percentual
          </Label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={percentualInput}
              onChange={(e) => handlePercentualChange(e.target.value)}
              onBlur={handlePercentualBlur}
              className="h-9 pr-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              %
            </span>
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground text-xs flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Valor
          </Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              R$
            </span>
            <Input
              type="text"
              value={valorInput}
              onChange={(e) => handleValorChange(e.target.value)}
              onBlur={handleValorBlur}
              className="h-9 pl-8 text-sm"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      {/* Preview do valor final - Compacto */}
      {valorDesconto > 0 && (
        <div className="bg-muted/50 rounded-lg p-2.5 border border-border space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Original:</span>
            <span className="font-medium">R$ {formatNumberBR(valorTotal)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-success">
            <span>Desconto:</span>
            <span className="font-medium">- R$ {formatNumberBR(valorDesconto)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold pt-1.5 border-t border-border">
            <span className="text-foreground">Final:</span>
            <span className="text-primary">R$ {formatNumberBR(valorFinal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}