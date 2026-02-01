import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, RefreshCw, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: string;
}

export interface PaymentTermsData {
  percentualSinal: number;
  valorSinal: number;
  numeroParcelas: number;
  diaVencimento: number;
  parcelas: Parcela[];
}

interface PaymentTermsFormProps {
  valorTotal: number;
  dataEvento: string | null;
  onChange: (data: PaymentTermsData) => void;
  onValidationChange?: (hasErrors: boolean) => void;
}

const diasVencimento = [5, 10, 15, 20, 25];

export function PaymentTermsForm({
  valorTotal,
  dataEvento,
  onChange,
  onValidationChange,
}: PaymentTermsFormProps) {
  const [percentualSinal, setPercentualSinal] = useState(10);
  const [percentualInput, setPercentualInput] = useState("10");
  const [valorSinalInput, setValorSinalInput] = useState("");
  const [valorSinalManual, setValorSinalManual] = useState<number | null>(null);
  
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [diaVencimento, setDiaVencimento] = useState(10);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [parcelaInputs, setParcelaInputs] = useState<{ valor: string }[]>([]);
  const [parcelasEditadas, setParcelasEditadas] = useState(false);
  const [indicesEditados, setIndicesEditados] = useState<Set<number>>(new Set());
  const [maxParcelas, setMaxParcelas] = useState(12);
  const [erroParcelamento, setErroParcelamento] = useState<string | null>(null);
  const [erroSinal, setErroSinal] = useState(false);
  const [errosDataParcela, setErrosDataParcela] = useState<Set<number>>(new Set());

  // Calculate valorSinal
  const valorSinalCalculado = (valorTotal * percentualSinal) / 100;
  const valorSinal = valorSinalManual !== null ? valorSinalManual : valorSinalCalculado;
  const percentualEfetivo = valorTotal > 0 ? (valorSinal / valorTotal) * 100 : 0;
  const saldoRestante = valorTotal - valorSinal;

  // Format helpers
  const formatNumberBR = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseNumberBR = (value: string): number => {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString + "T12:00:00").toLocaleDateString("pt-BR");
  };

  // Sync percentage input when valorTotal changes
  useEffect(() => {
    setValorSinalManual(null);
    setValorSinalInput(formatNumberBR((valorTotal * percentualSinal) / 100));
  }, [valorTotal]);

  // Calculate max installments based on event date
  useEffect(() => {
    if (!dataEvento) {
      setMaxParcelas(12);
      setErroParcelamento(null);
      return;
    }

    const eventDate = new Date(dataEvento + "T12:00:00");
    const lastPaymentDate = new Date(eventDate);
    lastPaymentDate.setDate(lastPaymentDate.getDate() - 30);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let months = 0;
    const tempDate = new Date(today);
    
    while (tempDate < lastPaymentDate) {
      tempDate.setMonth(tempDate.getMonth() + 1);
      if (tempDate <= lastPaymentDate) {
        months++;
      }
    }

    const calculatedMax = Math.max(1, months);
    setMaxParcelas(calculatedMax);

    if (numeroParcelas > calculatedMax) {
      setNumeroParcelas(calculatedMax);
      setErroParcelamento(`Ajustado para ${calculatedMax}x`);
    } else {
      setErroParcelamento(null);
    }
  }, [dataEvento, diaVencimento]);

  // Calculate installments
  const calcularParcelas = () => {
    if (numeroParcelas <= 0 || saldoRestante <= 0) {
      setParcelas([]);
      setParcelaInputs([]);
      return;
    }

    const novasParcelas: Parcela[] = [];
    const hoje = new Date();
    const primeiraParcela = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVencimento);

    for (let i = 0; i < numeroParcelas; i++) {
      const dataParcela = new Date(primeiraParcela);
      dataParcela.setMonth(dataParcela.getMonth() + i);
      const valorParcela = saldoRestante / numeroParcelas;

      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: dataParcela.toISOString().split("T")[0],
      });
    }

    setParcelas(novasParcelas);
    setParcelaInputs(novasParcelas.map(p => ({ valor: formatNumberBR(p.valor) })));
    setParcelasEditadas(false);
    setIndicesEditados(new Set());
  };

  useEffect(() => {
    calcularParcelas();
  }, [numeroParcelas, diaVencimento, saldoRestante, dataEvento, valorTotal]);

  useEffect(() => {
    setParcelasEditadas(false);
    setIndicesEditados(new Set());
  }, [numeroParcelas, valorTotal]);

  // Notify parent of changes
  useEffect(() => {
    onChange({
      percentualSinal: Math.round(percentualEfetivo),
      valorSinal,
      numeroParcelas,
      diaVencimento,
      parcelas,
    });
  }, [percentualEfetivo, valorSinal, numeroParcelas, diaVencimento, parcelas]);

  useEffect(() => {
    onValidationChange?.(errosDataParcela.size > 0);
  }, [errosDataParcela, onValidationChange]);

  // Handlers
  const handlePercentualChange = (value: string) => {
    setPercentualInput(value);
    setValorSinalManual(null);
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num < 10) {
        setErroSinal(true);
      } else {
        setErroSinal(false);
        const clamped = Math.min(num, 100);
        setPercentualSinal(clamped);
        const novoValorSinal = (valorTotal * clamped) / 100;
        setValorSinalInput(formatNumberBR(novoValorSinal));
      }
    }
  };

  const handlePercentualBlur = () => {
    const num = parseInt(percentualInput);
    if (isNaN(num) || num < 10) {
      setPercentualSinal(10);
      setPercentualInput("10");
      setErroSinal(false);
      const novoValorSinal = (valorTotal * 10) / 100;
      setValorSinalInput(formatNumberBR(novoValorSinal));
    } else {
      const clamped = Math.min(num, 100);
      setPercentualSinal(clamped);
      setPercentualInput(clamped.toString());
      const novoValorSinal = (valorTotal * clamped) / 100;
      setValorSinalInput(formatNumberBR(novoValorSinal));
    }
    setValorSinalManual(null);
  };

  const handleValorSinalChange = (value: string) => {
    setValorSinalInput(value);
  };

  const handleValorSinalBlur = () => {
    const num = parseNumberBR(valorSinalInput);
    const minSinal = valorTotal * 0.1;
    
    if (isNaN(num) || num < minSinal) {
      setValorSinalManual(null);
      setValorSinalInput(formatNumberBR(valorSinalCalculado));
      if (num < minSinal && !isNaN(num)) {
        setErroSinal(true);
        setTimeout(() => setErroSinal(false), 2000);
      }
    } else if (num > valorTotal) {
      setValorSinalManual(valorTotal);
      setValorSinalInput(formatNumberBR(valorTotal));
    } else {
      setValorSinalManual(num);
      setValorSinalInput(formatNumberBR(num));
      const newPercentual = Math.round((num / valorTotal) * 100);
      setPercentualInput(newPercentual.toString());
      setPercentualSinal(newPercentual);
    }
  };

  const handleRecalcularParcelas = () => {
    calcularParcelas();
  };

  const handleParcelaValueChange = (index: number, value: string) => {
    const newInputs = [...parcelaInputs];
    newInputs[index] = { valor: value };
    setParcelaInputs(newInputs);
  };

  const handleParcelaValueBlur = (index: number) => {
    const input = parcelaInputs[index]?.valor;
    if (input === undefined) return;
    
    const num = parseNumberBR(input);
    if (isNaN(num) || num < 0) {
      const newInputs = [...parcelaInputs];
      newInputs[index] = { valor: formatNumberBR(parcelas[index].valor) };
      setParcelaInputs(newInputs);
      return;
    }
    
    const newParcelas = [...parcelas];
    newParcelas[index] = { ...newParcelas[index], valor: num };
    setParcelas(newParcelas);
    setParcelasEditadas(true);
    setIndicesEditados(prev => new Set(prev).add(index));
    
    const newInputs = [...parcelaInputs];
    newInputs[index] = { valor: formatNumberBR(num) };
    setParcelaInputs(newInputs);
  };

  const handleParcelaDateChange = (index: number, value: string) => {
    const newParcelas = [...parcelas];
    newParcelas[index] = { ...newParcelas[index], dataVencimento: value };
    setParcelas(newParcelas);
    setParcelasEditadas(true);
    
    if (dataEvento && value) {
      const eventDate = new Date(dataEvento + "T12:00:00");
      const limitDate = new Date(eventDate);
      limitDate.setDate(limitDate.getDate() - 30);
      const parcelaDate = new Date(value + "T12:00:00");
      
      const newErros = new Set(errosDataParcela);
      if (parcelaDate > limitDate) {
        newErros.add(index);
      } else {
        newErros.delete(index);
      }
      setErrosDataParcela(newErros);
    }
  };

  const dataLimiteVencimento = dataEvento && dataEvento.length >= 10
    ? (() => {
        const eventDate = new Date(dataEvento + "T12:00:00");
        if (isNaN(eventDate.getTime())) return null;
        const limitDate = new Date(eventDate);
        limitDate.setDate(limitDate.getDate() - 30);
        return limitDate.toISOString().split("T")[0];
      })()
    : null;

  const totalParcelas = parcelas.reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="space-y-4">
      {/* Sinal - Compacto */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <h3 className="font-medium text-sm mb-2">Sinal (Entrada)</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-muted-foreground text-xs">% (mín. 10%)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={10}
                max={100}
                value={percentualInput}
                onChange={(e) => handlePercentualChange(e.target.value)}
                onBlur={handlePercentualBlur}
                className="h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-muted-foreground text-xs">%</span>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Valor</Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs">R$</span>
              <Input
                type="text"
                value={valorSinalInput}
                onChange={(e) => handleValorSinalChange(e.target.value)}
                onBlur={handleValorSinalBlur}
                className="h-8 text-sm"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
        {erroSinal && (
          <p className="text-destructive text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Mínimo 10%
          </p>
        )}
        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-border">
          <span className="text-muted-foreground">Saldo restante:</span>
          <span className="font-semibold text-foreground">{formatCurrency(saldoRestante)}</span>
        </div>
      </div>

      {/* Parcelamento - Compacto */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <h3 className="font-medium text-sm mb-2">Parcelamento</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label className="text-muted-foreground text-xs">Nº Parcelas (máx. {maxParcelas})</Label>
            <Select
              value={numeroParcelas.toString()}
              onValueChange={(v) => setNumeroParcelas(parseInt(v))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Qtd" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Dia Vencimento</Label>
            <Select
              value={diaVencimento.toString()}
              onValueChange={(v) => setDiaVencimento(parseInt(v))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent>
                {diasVencimento.map((dia) => (
                  <SelectItem key={dia} value={dia.toString()}>
                    Dia {dia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {erroParcelamento && (
          <div className="flex items-center gap-1 text-amber-600 text-xs mb-2 p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded">
            <AlertCircle className="h-3 w-3" />
            {erroParcelamento}
          </div>
        )}

        {/* Cronograma de Parcelas - Colapsável */}
        {parcelas.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between text-xs hover:bg-muted rounded p-1.5 -mx-1.5 transition-colors group">
                <span className="text-muted-foreground font-medium">
                  Ver cronograma ({parcelas.length} parcelas)
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-[[data-state=open]]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1.5">
                {/* Sinal */}
                <div className="flex items-center justify-between p-1.5 bg-primary/10 rounded text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span className="font-medium">Sinal</span>
                  </div>
                  <span className="font-semibold text-primary">{formatCurrency(valorSinal)}</span>
                </div>

                {/* Parcelas */}
                {parcelas.map((parcela, index) => (
                  <div
                    key={parcela.numero}
                    className={`p-1.5 rounded text-xs space-y-1 ${
                      errosDataParcela.has(index)
                        ? "bg-destructive/10 border border-destructive/30"
                        : indicesEditados.has(index)
                          ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                          : "bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Parcela {parcela.numero}</span>
                      <Input
                        type="text"
                        value={parcelaInputs[index]?.valor ?? formatNumberBR(parcela.valor)}
                        onChange={(e) => handleParcelaValueChange(index, e.target.value)}
                        onBlur={() => handleParcelaValueBlur(index)}
                        className="h-6 w-24 text-xs text-right px-1.5"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Venc:</span>
                      <Input
                        type="date"
                        value={parcela.dataVencimento}
                        max={dataLimiteVencimento || undefined}
                        onChange={(e) => handleParcelaDateChange(index, e.target.value)}
                        className={`h-6 text-xs flex-1 px-1.5 ${errosDataParcela.has(index) ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errosDataParcela.has(index) && (
                      <p className="text-destructive text-[10px] flex items-center gap-1">
                        <AlertCircle className="h-2.5 w-2.5" />
                        Até 30 dias antes do evento
                      </p>
                    )}
                  </div>
                ))}

                {/* Total */}
                <div className="flex items-center justify-between p-1.5 bg-muted rounded text-xs border border-border mt-2">
                  <span className="font-medium">Total Parcelas:</span>
                  <span className={`font-semibold ${Math.abs(totalParcelas - saldoRestante) > 0.01 ? "text-destructive" : "text-primary"}`}>
                    {formatCurrency(totalParcelas)}
                  </span>
                </div>

                {/* Botão Recalcular */}
                {parcelasEditadas && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRecalcularParcelas}
                    className="w-full h-7 text-xs mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Recalcular
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}