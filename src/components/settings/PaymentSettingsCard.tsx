/**
 * COMPONENT: PaymentSettingsCard (UX/UI Melhorada)
 * Card para gerenciar configurações globais de pagamento
 * Layout: Card único com botão "Editar" (não tem lista)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Edit, 
  CreditCard, 
  X, 
  Plus, 
  Check,
  Calendar,
  TrendingUp,
  AlertCircle,
  Info,
  Percent,
  CalendarDays
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";

// ============================================================================
// CONSTANTES
// ============================================================================

const MIN_PERCENTUAL = 0;
const MAX_PERCENTUAL = 100;
const MIN_DIAS = 1;
const MAX_DIAS = 31;
const MIN_PARCELAS = 1;
const MAX_PARCELAS = 60;
const MIN_MESES_APOS = 1;
const MAX_MESES_APOS = 24;

// Dias sugeridos comuns
const DIAS_SUGERIDOS = [5, 10, 15, 20, 25];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PaymentSettingsCard() {
  const { toast } = useToast();
  const { settings, isLoading, saveSettings, isSaving } = usePaymentSettings();

  // Estados do formulário
  const [isEditing, setIsEditing] = useState(false);
  const [percentualMinimo, setPercentualMinimo] = useState<string>("");
  const [diasVencimento, setDiasVencimento] = useState<number[]>([]);
  const [novoDia, setNovoDia] = useState<string>("");
  const [diaVencimentoPadrao, setDiaVencimentoPadrao] = useState<string>("");
  const [tipoParcelamento, setTipoParcelamento] = useState<'ate_evento' | 'apos_evento' | 'fixo'>('ate_evento');
  const [mesesAposEvento, setMesesAposEvento] = useState<string>("");
  const [numeroParcelasFixo, setNumeroParcelasFixo] = useState<string>("");
  const [diasUltimaParcela, setDiasUltimaParcela] = useState<string>("");

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const startEdit = () => {
    setIsEditing(true);
    setPercentualMinimo(settings.percentual_minimo_sinal.toString());
    setDiasVencimento([...settings.dias_vencimento_opcoes]);
    setDiaVencimentoPadrao(settings.dia_vencimento_padrao.toString());
    setTipoParcelamento(settings.tipo_parcelamento);
    setMesesAposEvento(settings.meses_apos_evento?.toString() || "");
    setNumeroParcelasFixo(settings.numero_parcelas_fixo?.toString() || "");
    setDiasUltimaParcela(settings.dias_ultima_parcela_antes_evento.toString());
    setNovoDia("");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setPercentualMinimo("");
    setDiasVencimento([]);
    setNovoDia("");
    setDiaVencimentoPadrao("");
    setTipoParcelamento('ate_evento');
    setMesesAposEvento("");
    setNumeroParcelasFixo("");
    setDiasUltimaParcela("");
  };

  const addDiaVencimento = () => {
    const dia = parseInt(novoDia);
    if (isNaN(dia) || dia < MIN_DIAS || dia > MAX_DIAS) {
      toast({ 
        title: "Dia inválido", 
        description: `O dia deve estar entre ${MIN_DIAS} e ${MAX_DIAS}`, 
        variant: "destructive" 
      });
      return;
    }
    if (diasVencimento.includes(dia)) {
      toast({ 
        title: "Dia duplicado", 
        description: "Este dia já está na lista de vencimentos", 
        variant: "destructive" 
      });
      return;
    }
    setDiasVencimento([...diasVencimento, dia].sort((a, b) => a - b));
    setNovoDia("");
  };

  const addDiaSugerido = (dia: number) => {
    if (diasVencimento.includes(dia)) {
      toast({ 
        title: "Dia duplicado", 
        description: "Este dia já está na lista", 
        variant: "destructive" 
      });
      return;
    }
    setDiasVencimento([...diasVencimento, dia].sort((a, b) => a - b));
  };

  const removeDiaVencimento = (dia: number) => {
    if (diasVencimento.length <= 1) {
      toast({ 
        title: "Atenção", 
        description: "É necessário ter pelo menos um dia de vencimento", 
        variant: "destructive" 
      });
      return;
    }
    setDiasVencimento(diasVencimento.filter(d => d !== dia));
    
    // Se remover o dia padrão, ajustar para o primeiro disponível
    if (parseInt(diaVencimentoPadrao) === dia) {
      const novosDias = diasVencimento.filter(d => d !== dia);
      if (novosDias.length > 0) {
        setDiaVencimentoPadrao(novosDias[0].toString());
      }
    }
  };

  const handleSave = () => {
    // Validações
    const percentual = parseInt(percentualMinimo);
    if (isNaN(percentual) || percentual < MIN_PERCENTUAL || percentual > MAX_PERCENTUAL) {
      toast({ 
        title: "Percentual inválido", 
        description: `O percentual deve estar entre ${MIN_PERCENTUAL}% e ${MAX_PERCENTUAL}%`, 
        variant: "destructive" 
      });
      return;
    }

    if (diasVencimento.length === 0) {
      toast({ 
        title: "Dias de vencimento obrigatórios", 
        description: "Adicione pelo menos um dia de vencimento", 
        variant: "destructive" 
      });
      return;
    }

    const diaPadrao = parseInt(diaVencimentoPadrao);
    if (!diasVencimento.includes(diaPadrao)) {
      toast({ 
        title: "Dia padrão inválido", 
        description: "O dia padrão deve estar na lista de dias disponíveis", 
        variant: "destructive" 
      });
      return;
    }

    const diasUltima = parseInt(diasUltimaParcela);
    if (isNaN(diasUltima) || diasUltima < MIN_DIAS) {
      toast({ 
        title: "Dias da última parcela inválido", 
        description: "Informe quantos dias antes do evento a última parcela deve vencer", 
        variant: "destructive" 
      });
      return;
    }

    // Validações específicas por tipo
    let dadosAdicionais: any = {};
    
    if (tipoParcelamento === 'apos_evento') {
      const meses = parseInt(mesesAposEvento);
      if (isNaN(meses) || meses < MIN_MESES_APOS || meses > MAX_MESES_APOS) {
        toast({ 
          title: "Meses inválidos", 
          description: `O número de meses deve estar entre ${MIN_MESES_APOS} e ${MAX_MESES_APOS}`, 
          variant: "destructive" 
        });
        return;
      }
      dadosAdicionais.meses_apos_evento = meses;
      dadosAdicionais.numero_parcelas_fixo = null;
    } else if (tipoParcelamento === 'fixo') {
      const parcelas = parseInt(numeroParcelasFixo);
      if (isNaN(parcelas) || parcelas < MIN_PARCELAS || parcelas > MAX_PARCELAS) {
        toast({ 
          title: "Número de parcelas inválido", 
          description: `O número de parcelas deve estar entre ${MIN_PARCELAS} e ${MAX_PARCELAS}`, 
          variant: "destructive" 
        });
        return;
      }
      dadosAdicionais.numero_parcelas_fixo = parcelas;
      dadosAdicionais.meses_apos_evento = null;
    } else {
      // ate_evento
      dadosAdicionais.meses_apos_evento = null;
      dadosAdicionais.numero_parcelas_fixo = null;
    }

    // Salvar
    saveSettings(
      {
        percentual_minimo_sinal: percentual,
        dias_vencimento_opcoes: diasVencimento,
        dia_vencimento_padrao: diaPadrao,
        tipo_parcelamento: tipoParcelamento,
        dias_ultima_parcela_antes_evento: diasUltima,
        ...dadosAdicionais,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        }
      }
    );
  };

  // ============================================================================
  // HELPER: Formatar tipo de parcelamento
  // ============================================================================

  const formatTipoParcelamento = (tipo: string, meses?: number | null, parcelas?: number | null) => {
    switch (tipo) {
      case 'ate_evento':
        return 'Até a data do evento';
      case 'apos_evento':
        return `Até ${meses} ${meses === 1 ? 'mês' : 'meses'} após o evento`;
      case 'fixo':
        return `Máximo de ${parcelas} ${parcelas === 1 ? 'parcela' : 'parcelas'}`;
      default:
        return tipo;
    }
  };

  // ============================================================================
  // RENDER - LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando configurações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER - MODO VISUALIZAÇÃO
  // ============================================================================

  if (!isEditing) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                Configurações de Pagamento
              </CardTitle>
              <CardDescription className="text-base">
                Regras padrão aplicadas aos orçamentos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={startEdit}
              disabled={isSaving}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sinal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Percent className="h-4 w-4" />
              Sinal
            </div>
            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  {settings.percentual_minimo_sinal}%
                </span>
                <span className="text-sm text-muted-foreground">percentual mínimo</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vencimento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Dias de Vencimento
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {settings.dias_vencimento_opcoes.map((dia) => (
                  <Badge 
                    key={dia} 
                    variant={dia === settings.dia_vencimento_padrao ? "default" : "secondary"}
                    className="px-3 py-1.5 text-sm"
                  >
                    {dia === settings.dia_vencimento_padrao && (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Dia {dia}
                  </Badge>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  O dia <strong className="text-foreground">Dia {settings.dia_vencimento_padrao}</strong> é 
                  selecionado automaticamente nos novos orçamentos
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Parcelamento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Parcelamento
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-2">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {formatTipoParcelamento(
                      settings.tipo_parcelamento, 
                      settings.meses_apos_evento, 
                      settings.numero_parcelas_fixo
                    )}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    {settings.tipo_parcelamento === 'ate_evento' && 
                      'As parcelas podem ser distribuídas até a data do evento'}
                    {settings.tipo_parcelamento === 'apos_evento' && 
                      'As parcelas podem continuar após a realização do evento'}
                    {settings.tipo_parcelamento === 'fixo' && 
                      'Número máximo de parcelas independente da data do evento'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-amber-900 dark:text-amber-100">
                      Última Parcela
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Deve vencer <strong>{settings.dias_ultima_parcela_antes_evento} dias</strong> antes 
                      da data do evento
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER - MODO EDIÇÃO
  // ============================================================================

  return (
    <Card className="border-primary">
      <CardHeader className="pb-3 bg-primary/5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              Editar Configurações de Pagamento
            </CardTitle>
            <CardDescription className="text-base">
              Configure as regras aplicadas aos orçamentos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Sinal */}
        <div className="space-y-4 p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 font-medium">
            <Percent className="h-5 w-5 text-primary" />
            <h3 className="text-base">Sinal</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Percentual Mínimo *</Label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={percentualMinimo}
                  onChange={(e) => setPercentualMinimo(e.target.value)}
                  placeholder="10"
                  min={MIN_PERCENTUAL}
                  max={MAX_PERCENTUAL}
                  disabled={isSaving}
                  className="pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Valor mínimo que deve ser pago como entrada ({MIN_PERCENTUAL}% - {MAX_PERCENTUAL}%)
            </p>
          </div>
        </div>

        <Separator />

        {/* Vencimento */}
        <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base">Vencimento</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Dias de Vencimento Disponíveis *</Label>
              
              {/* Dias adicionados */}
              {diasVencimento.length > 0 && (
                <div className="flex flex-wrap gap-2 my-3">
                  {diasVencimento.map((dia) => (
                    <Badge 
                      key={dia} 
                      variant="secondary" 
                      className="gap-2 px-3 py-1.5 text-sm hover:bg-secondary/80 transition-colors"
                    >
                      Dia {dia}
                      <button
                        type="button"
                        onClick={() => removeDiaVencimento(dia)}
                        disabled={isSaving}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input para adicionar dia */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={novoDia}
                  onChange={(e) => setNovoDia(e.target.value)}
                  placeholder="Ex: 10"
                  min={MIN_DIAS}
                  max={MAX_DIAS}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDiaVencimento();
                    }
                  }}
                  disabled={isSaving}
                  className="w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addDiaVencimento}
                  disabled={!novoDia || isSaving}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Dias sugeridos */}
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Sugestões rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SUGERIDOS.filter(d => !diasVencimento.includes(d)).map((dia) => (
                    <Button
                      key={dia}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDiaSugerido(dia)}
                      disabled={isSaving}
                      className="h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Dia {dia}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Dia de Vencimento Padrão *</Label>
              <select
                value={diaVencimentoPadrao}
                onChange={(e) => setDiaVencimentoPadrao(e.target.value)}
                disabled={isSaving || diasVencimento.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              >
                <option value="">Selecione um dia</option>
                {diasVencimento.map((dia) => (
                  <option key={dia} value={dia.toString()}>
                    Dia {dia}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Dia selecionado automaticamente nos novos orçamentos
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Parcelamento */}
        <div className="space-y-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 font-medium">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base">Parcelamento</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Tipo de Parcelamento *</Label>
              <RadioGroup
                value={tipoParcelamento}
                onValueChange={(value) => setTipoParcelamento(value as 'ate_evento' | 'apos_evento' | 'fixo')}
                disabled={isSaving}
                className="space-y-3"
              >
                {/* Opção 1: Até o evento */}
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-input hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="ate_evento" id="ate_evento" className="mt-1" />
                  <div className="flex-1 cursor-pointer" onClick={() => setTipoParcelamento('ate_evento')}>
                    <Label htmlFor="ate_evento" className="font-medium cursor-pointer">
                      Até a data do evento
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Permite parcelas até a data do evento (sempre habilitado)
                    </p>
                  </div>
                </div>
                
                {/* Opção 2: Após o evento */}
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-input hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="apos_evento" id="apos_evento" className="mt-1" />
                  <div className="flex-1 cursor-pointer" onClick={() => setTipoParcelamento('apos_evento')}>
                    <Label htmlFor="apos_evento" className="font-medium cursor-pointer">
                      Após a data do evento
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Permite continuar parcelando por X meses após o evento
                    </p>
                  </div>
                </div>

                {/* Opção 3: Fixo */}
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-input hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="fixo" id="fixo" className="mt-1" />
                  <div className="flex-1 cursor-pointer" onClick={() => setTipoParcelamento('fixo')}>
                    <Label htmlFor="fixo" className="font-medium cursor-pointer">
                      Número fixo de parcelas
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Define um número máximo independente da data do evento
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Campo condicional: Meses após evento */}
            {tipoParcelamento === 'apos_evento' && (
              <div className="ml-7 p-4 bg-background rounded-lg border animate-in fade-in-50 slide-in-from-top-2 duration-200">
                <Label className="text-sm font-medium">Meses Após o Evento *</Label>
                <Input
                  type="number"
                  value={mesesAposEvento}
                  onChange={(e) => setMesesAposEvento(e.target.value)}
                  placeholder="6"
                  min={MIN_MESES_APOS}
                  max={MAX_MESES_APOS}
                  disabled={isSaving}
                  className="mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Quantos meses após o evento podem ser parcelados ({MIN_MESES_APOS}-{MAX_MESES_APOS})
                </p>
              </div>
            )}

            {/* Campo condicional: Número fixo */}
            {tipoParcelamento === 'fixo' && (
              <div className="ml-7 p-4 bg-background rounded-lg border animate-in fade-in-50 slide-in-from-top-2 duration-200">
                <Label className="text-sm font-medium">Número Máximo de Parcelas *</Label>
                <Input
                  type="number"
                  value={numeroParcelasFixo}
                  onChange={(e) => setNumeroParcelasFixo(e.target.value)}
                  placeholder="18"
                  min={MIN_PARCELAS}
                  max={MAX_PARCELAS}
                  disabled={isSaving}
                  className="mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Número máximo de parcelas independente do evento ({MIN_PARCELAS}-{MAX_PARCELAS})
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Regra fixa: Última parcela */}
        <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-sm font-medium">Última Parcela (Regra Fixa) *</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Define quantos dias antes do evento a última parcela deve vencer
                </p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={diasUltimaParcela}
                    onChange={(e) => setDiasUltimaParcela(e.target.value)}
                    placeholder="30"
                    min={MIN_DIAS}
                    disabled={isSaving}
                    className="w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-muted-foreground">dias antes do evento</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={cancelEdit}
            disabled={isSaving}
            className="min-w-[100px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[140px] gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}