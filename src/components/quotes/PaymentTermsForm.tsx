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
import { CreditCard, AlertCircle, CheckCircle2, RefreshCw, Scale } from "lucide-react";

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

  // Calculate valorSinal: use manual if set, otherwise from percentage
  const valorSinalCalculado = (valorTotal * percentualSinal) / 100;
  const valorSinal = valorSinalManual !== null ? valorSinalManual : valorSinalCalculado;
  const percentualEfetivo = valorTotal > 0 ? (valorSinal / valorTotal) * 100 : 0;
  
  const saldoRestante = valorTotal - valorSinal;

  // Format number to Brazilian format for display (1.234,56)
  const formatNumberBR = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse Brazilian formatted number to float
  const parseNumberBR = (value: string): number => {
    // Remove dots (thousand separator) and replace comma with dot (decimal separator)
    const normalized = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized);
  };

  // Sync percentage input when valorTotal changes
  useEffect(() => {
    if (valorSinalManual === null) {
      setValorSinalInput(formatNumberBR(valorSinalCalculado));
    }
  }, [valorTotal, percentualSinal, valorSinalManual, valorSinalCalculado]);

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
      setErroParcelamento(
        `Ajustado para ${calculatedMax} parcela(s) devido à proximidade do evento.`
      );
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
    
    // First installment starts next month
    const hoje = new Date();
    const primeiraParcela = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVencimento);
    
    let dataUltimaParcela: Date;

    if (dataEvento) {
      const eventDate = new Date(dataEvento + "T12:00:00");
      const limitDate = new Date(eventDate);
      limitDate.setDate(limitDate.getDate() - 30);
      
      // Calculate last installment date (must be before 30 days of event)
      dataUltimaParcela = new Date(limitDate.getFullYear(), limitDate.getMonth(), diaVencimento);
      if (dataUltimaParcela > limitDate) {
        dataUltimaParcela.setMonth(dataUltimaParcela.getMonth() - 1);
      }
    } else {
      // No event date: last installment = first + (numParcelas - 1) months
      dataUltimaParcela = new Date(primeiraParcela);
      dataUltimaParcela.setMonth(dataUltimaParcela.getMonth() + numeroParcelas - 1);
    }

    // Generate installments starting from first installment date
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

  // Auto-calculate installments when not manually edited
  useEffect(() => {
    if (parcelasEditadas) return;
    calcularParcelas();
  }, [numeroParcelas, diaVencimento, saldoRestante, dataEvento, parcelasEditadas]);

  // Reset manual edits when number of installments changes
  useEffect(() => {
    setParcelasEditadas(false);
    setIndicesEditados(new Set());
  }, [numeroParcelas]);

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

  // Notify parent of validation errors
  useEffect(() => {
    onValidationChange?.(errosDataParcela.size > 0);
  }, [errosDataParcela, onValidationChange]);

  const handlePercentualChange = (value: string) => {
    setPercentualInput(value);
    setValorSinalManual(null); // Reset manual value when percentage changes
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num < 10) {
        setErroSinal(true);
      } else {
        setErroSinal(false);
        setPercentualSinal(Math.min(num, 100));
      }
    }
  };

  const handlePercentualBlur = () => {
    const num = parseInt(percentualInput);
    if (isNaN(num) || num < 10) {
      setPercentualSinal(10);
      setPercentualInput("10");
      setErroSinal(false);
    } else {
      const clamped = Math.min(num, 100);
      setPercentualSinal(clamped);
      setPercentualInput(clamped.toString());
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
      // Reset to percentage-based value
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
      // Update percentage display
      const newPercentual = Math.round((num / valorTotal) * 100);
      setPercentualInput(newPercentual.toString());
      setPercentualSinal(newPercentual);
    }
  };

  const handleRecalcularParcelas = () => {
    calcularParcelas();
  };

  // Adjust non-edited installments to balance the total
  const handleAjustarDemais = () => {
    if (indicesEditados.size === 0 || indicesEditados.size >= parcelas.length) return;
    
    // Sum of edited installments
    const somaEditadas = parcelas
      .filter((_, index) => indicesEditados.has(index))
      .reduce((sum, p) => sum + p.valor, 0);
    
    // Remaining amount to distribute
    const restanteParaDistribuir = saldoRestante - somaEditadas;
    const numNaoEditadas = parcelas.length - indicesEditados.size;
    const valorPorParcela = restanteParaDistribuir / numNaoEditadas;
    
    const novasParcelas = parcelas.map((parcela, index) => {
      if (indicesEditados.has(index)) {
        return parcela;
      }
      return { ...parcela, valor: valorPorParcela };
    });
    
    setParcelas(novasParcelas);
    setParcelaInputs(novasParcelas.map(p => ({ valor: formatNumberBR(p.valor) })));
  };

  // Handle individual installment value change
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
      // Reset to current value
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

  // Handle individual installment date change with validation
  const handleParcelaDateChange = (index: number, value: string) => {
    const newParcelas = [...parcelas];
    newParcelas[index] = { ...newParcelas[index], dataVencimento: value };
    setParcelas(newParcelas);
    setParcelasEditadas(true);
    
    // Validate date against 30 days before event
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

  // Calculate limit date for display
  const dataLimiteVencimento = dataEvento
    ? (() => {
        const eventDate = new Date(dataEvento + "T12:00:00");
        const limitDate = new Date(eventDate);
        limitDate.setDate(limitDate.getDate() - 30);
        return limitDate.toISOString().split("T")[0];
      })()
    : null;

  // Calculate total of installments
  const totalParcelas = parcelas.reduce((sum, p) => sum + p.valor, 0);

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

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-semibold">
          Condições de Pagamento
        </h2>
      </div>

      <div className="space-y-6">
        {/* Sinal */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-medium mb-3">Sinal (Entrada)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label className="text-muted-foreground text-sm">
                Percentual (mín. 10%)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={percentualInput}
                  onChange={(e) => handlePercentualChange(e.target.value)}
                  onBlur={handlePercentualBlur}
                  className="w-20"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Valor do Sinal
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={valorSinalInput}
                  onChange={(e) => handleValorSinalChange(e.target.value)}
                  onBlur={handleValorSinalBlur}
                  className="w-32"
                  placeholder="0,00"
                />
              </div>
              {erroSinal && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Mínimo de 10% ({formatCurrency(valorTotal * 0.1)})
                </p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Saldo Restante</Label>
              <p className="font-semibold text-lg mt-1">
                {formatCurrency(saldoRestante)}
              </p>
            </div>
          </div>
        </div>

        {/* Parcelamento */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-medium mb-3">Parcelamento do Saldo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-muted-foreground text-sm">
                Número de Parcelas (máx. {maxParcelas})
              </Label>
              <Select
                value={numeroParcelas.toString()}
                onValueChange={(v) => setNumeroParcelas(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
              <Label className="text-muted-foreground text-sm">
                Dia de Vencimento
              </Label>
              <Select
                value={diaVencimento.toString()}
                onValueChange={(v) => setDiaVencimento(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <div className="flex items-center gap-2 text-warning text-sm mb-4 p-2 bg-warning/10 rounded">
              <AlertCircle className="h-4 w-4" />
              {erroParcelamento}
            </div>
          )}

          {/* Installments Preview */}
          {parcelas.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground text-sm">
                  Cronograma de Parcelas (edite valores e vencimentos)
                </Label>
                {parcelasEditadas && (
                  <div className="flex items-center gap-2">
                    {indicesEditados.size > 0 && indicesEditados.size < parcelas.length && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAjustarDemais}
                        className="flex items-center gap-1"
                      >
                        <Scale className="h-3 w-3" />
                        Ajustar demais
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRecalcularParcelas}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Recalcular
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded border border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Sinal</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    Na assinatura do contrato
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(valorSinal)}
                  </span>
                </div>
                {parcelas.map((parcela, index) => (
                  <div
                    key={parcela.numero}
                    className={`flex flex-col gap-1 p-2 rounded transition-colors ${
                      errosDataParcela.has(index)
                        ? "bg-destructive/10 border border-destructive/50"
                        : indicesEditados.has(index) 
                          ? "bg-amber-100 border border-amber-300 dark:bg-amber-900/30 dark:border-amber-700" 
                          : "bg-secondary/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm w-20">
                        Parcela {parcela.numero}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Vencimento:</span>
                        <Input
                          type="date"
                          value={parcela.dataVencimento}
                          max={dataLimiteVencimento || undefined}
                          onChange={(e) => handleParcelaDateChange(index, e.target.value)}
                          className={`w-36 h-8 text-sm ${errosDataParcela.has(index) ? "border-destructive" : ""}`}
                        />
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          type="text"
                          value={parcelaInputs[index]?.valor ?? formatNumberBR(parcela.valor)}
                          onChange={(e) => handleParcelaValueChange(index, e.target.value)}
                          onBlur={() => handleParcelaValueBlur(index)}
                          className="w-24 h-8 text-sm text-right"
                        />
                      </div>
                    </div>
                    {errosDataParcela.has(index) && (
                      <div className="flex items-center gap-1 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>Vencimento deve ser até 30 dias antes do evento ({dataLimiteVencimento ? formatDate(dataLimiteVencimento) : ""})</span>
                      </div>
                    )}
                  </div>
                ))}
                {parcelas.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded border border-border mt-2">
                    <span className="text-sm font-medium">Total Parcelas:</span>
                    <span className={`font-semibold ${Math.abs(totalParcelas - saldoRestante) > 0.01 ? "text-destructive" : "text-primary"}`}>
                      {formatCurrency(totalParcelas)}
                      {Math.abs(totalParcelas - saldoRestante) > 0.01 && (
                        <span className="text-xs ml-2">
                          (esperado: {formatCurrency(saldoRestante)})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
