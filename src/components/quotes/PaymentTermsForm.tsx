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
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";

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
}

const diasVencimento = [5, 10, 15, 20, 25];

export function PaymentTermsForm({
  valorTotal,
  dataEvento,
  onChange,
}: PaymentTermsFormProps) {
  const [percentualSinal, setPercentualSinal] = useState(10);
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [diaVencimento, setDiaVencimento] = useState(10);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [maxParcelas, setMaxParcelas] = useState(12);
  const [erroParcelamento, setErroParcelamento] = useState<string | null>(null);

  const valorSinal = (valorTotal * percentualSinal) / 100;
  const saldoRestante = valorTotal - valorSinal;
  const valorParcela = numeroParcelas > 0 ? saldoRestante / numeroParcelas : 0;

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

    // Calculate months between today and last payment date
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

  // Calculate installment dates
  useEffect(() => {
    if (numeroParcelas <= 0 || saldoRestante <= 0) {
      setParcelas([]);
      return;
    }

    const novasParcelas: Parcela[] = [];
    let dataUltimaParcela: Date;

    if (dataEvento) {
      // Last installment 30 days before event, adjusted to due day
      const eventDate = new Date(dataEvento + "T12:00:00");
      dataUltimaParcela = new Date(eventDate);
      dataUltimaParcela.setDate(dataUltimaParcela.getDate() - 30);
      
      // Adjust to the chosen due day
      dataUltimaParcela.setDate(diaVencimento);
      
      // If the adjusted date is after 30 days before event, go back one month
      const limitDate = new Date(eventDate);
      limitDate.setDate(limitDate.getDate() - 30);
      if (dataUltimaParcela > limitDate) {
        dataUltimaParcela.setMonth(dataUltimaParcela.getMonth() - 1);
      }
    } else {
      // If no event date, start from next month
      dataUltimaParcela = new Date();
      dataUltimaParcela.setMonth(dataUltimaParcela.getMonth() + numeroParcelas);
      dataUltimaParcela.setDate(diaVencimento);
    }

    // Calculate installments backwards from last date
    for (let i = numeroParcelas; i >= 1; i--) {
      const dataParcela = new Date(dataUltimaParcela);
      dataParcela.setMonth(dataParcela.getMonth() - (numeroParcelas - i));

      novasParcelas.push({
        numero: i,
        valor: valorParcela,
        dataVencimento: dataParcela.toISOString().split("T")[0],
      });
    }

    // Sort by installment number
    novasParcelas.sort((a, b) => a.numero - b.numero);
    setParcelas(novasParcelas);
  }, [numeroParcelas, diaVencimento, saldoRestante, dataEvento, valorParcela]);

  // Notify parent of changes
  useEffect(() => {
    onChange({
      percentualSinal,
      valorSinal,
      numeroParcelas,
      diaVencimento,
      parcelas,
    });
  }, [percentualSinal, valorSinal, numeroParcelas, diaVencimento, parcelas]);

  const handlePercentualChange = (value: string) => {
    let num = parseInt(value) || 10;
    if (num < 10) {
      num = 10;
    }
    if (num > 100) {
      num = 100;
    }
    setPercentualSinal(num);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">
                Percentual do Sinal (mín. 10%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={percentualSinal}
                  onChange={(e) => handlePercentualChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              {percentualSinal < 10 && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Mínimo de 10%
                </p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Valor do Sinal</Label>
              <p className="font-semibold text-lg text-primary py-1">
                {formatCurrency(valorSinal)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Saldo Restante</Label>
              <p className="font-semibold text-lg py-1">
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
                      {n}x de {formatCurrency(saldoRestante / n)}
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
              <Label className="text-muted-foreground text-sm mb-2 block">
                Cronograma de Parcelas
              </Label>
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
                {parcelas.map((parcela) => (
                  <div
                    key={parcela.numero}
                    className="flex items-center gap-2 p-2 bg-secondary/30 rounded"
                  >
                    <span className="font-medium text-sm w-20">
                      Parcela {parcela.numero}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Vencimento: {formatDate(parcela.dataVencimento)}
                    </span>
                    <span className="font-semibold ml-auto">
                      {formatCurrency(parcela.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
