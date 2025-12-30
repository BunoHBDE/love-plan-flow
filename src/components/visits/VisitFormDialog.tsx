import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, User, Clock, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useVisitForm, getYearsArray, months } from "@/hooks/useVisitForm";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { useVisitSettings } from "@/hooks/useVisitSettings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VisitInsert } from "@/hooks/useVisitsOptimized";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface VisitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (visitData: VisitInsert, clientData?: any) => Promise<void>;
  initialDate?: string;
  initialTime?: string;
}

export function VisitFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialDate,
  initialTime,
}: VisitFormDialogProps) {
  const { formData, updateField, updatePhone, resetForm, validateForm } = useVisitForm();
  const { searchClients } = useClients();
  const { 
    settings, 
    loading: settingsLoading,
    generateAvailableSlots, 
    calculateEndTime,
    isTimeInRange,
    defaultSettings 
  } = useVisitSettings();
  const { toast } = useToast();

  const [clientSearch, setClientSearch] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [calculatedEndTime, setCalculatedEndTime] = useState<string>("");
  const [isTimeOutOfRange, setIsTimeOutOfRange] = useState(false);

  const years = getYearsArray();

  // Gerar horários disponíveis baseado nas configurações
  const availableSlots = generateAvailableSlots(settings);
  const currentSettings = settings || defaultSettings;

  // Preenche data e hora quando abre o dialog com valores iniciais
  useEffect(() => {
    if (open && initialDate) {
      updateField("date", initialDate);
    }
    if (open && initialTime) {
      updateField("time", initialTime);
      // Calcular end time automaticamente
      const endTime = calculateEndTime(initialTime);
      setCalculatedEndTime(endTime);
      setIsTimeOutOfRange(!isTimeInRange(initialTime));
    }
  }, [open, initialDate, initialTime]);

  // Calcular horário de término quando muda o horário de início
  useEffect(() => {
    if (formData.time) {
      const endTime = calculateEndTime(formData.time);
      setCalculatedEndTime(endTime);
      setIsTimeOutOfRange(!isTimeInRange(formData.time));
    } else {
      setCalculatedEndTime("");
      setIsTimeOutOfRange(false);
    }
  }, [formData.time, calculateEndTime, isTimeInRange]);

  const handleClientSearch = async (term: string) => {
    setClientSearch(term);
    updateField("clientName", term);
    
    if (term.length >= 2) {
      const results = await searchClients(term);
      setClientSearchResults(results);
    } else {
      setClientSearchResults([]);
    }
  };

  const selectClient = (client: any) => {
    setSelectedClientId(client.id);
    updateField("clientName", client.nome);
    updateField("email", client.email || "");
    updateField("phone", client.telefone || "");
    setClientSearch(client.nome);
    setClientSearchResults([]);
  };

  const handleTimeSelect = (time: string) => {
    updateField("time", time);
  };

  const handleSubmit = async () => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      toast({
        title: "Campo obrigatório",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Validar se horário está fora do range (apenas warning, não bloqueia)
    if (isTimeOutOfRange) {
      toast({
        title: "⚠️ Horário Incomum",
        description: `Este horário está fora do padrão configurado (${currentSettings.start_time} - ${currentSettings.end_time})`,
      });
    }

    let clientId = selectedClientId;
    let newClientData = null;

    // Se não selecionou cliente existente E preencheu email ou telefone
    if (!selectedClientId && formData.clientName && (formData.email || formData.phone)) {
      newClientData = {
        nome: formData.clientName,
        email: formData.email || null,
        telefone: formData.phone || null,
      };
    }

    // Prepara notes
    let notes = formData.notes || "";
    if (!clientId && !newClientData && formData.clientName) {
      notes = `VISITANTE: ${formData.clientName}${formData.notes ? '\n\n' + formData.notes : ''}`;
    }

    const visitData: VisitInsert = {
      client_id: clientId,
      visit_date: formData.date,
      visit_time: formData.time,
      visit_end_time: calculatedEndTime, // 🔥 NOVO
      duration: currentSettings.default_duration, // 🔥 NOVO
      notes: notes || null,
      guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
      wedding_date_status: formData.weddingDateStatus === "defined" ? "com_data" : "sem_data",
      wedding_date: formData.weddingDate || null,
      wedding_month: formData.weddingMonthEstimate || null,
      wedding_year: formData.weddingYearEstimate || null,
      status: "agendado",
    };

    await onSubmit(visitData, newClientData);
    
    // Reset form
    resetForm();
    setClientSearch("");
    setSelectedClientId(null);
    setClientSearchResults([]);
    setCalculatedEndTime("");
    setIsTimeOutOfRange(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            📅 Agendar Nova Visita
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma nova visita ao espaço
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Client Search */}
          <div className="grid gap-2">
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do cliente ou busque existente..."
                value={clientSearch}
                onChange={(e) => handleClientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {clientSearchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-32 overflow-y-auto bg-card shadow-lg">
                {clientSearchResults.map((client: any) => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{client.nome}</div>
                      {client.telefone && (
                        <div className="text-xs text-muted-foreground">{client.telefone}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedClientId ? (
              <p className="text-sm text-green-700 flex items-center gap-1">
                <span className="text-lg">✓</span> Cliente cadastrado
              </p>
            ) : formData.clientName && (formData.email || formData.phone) ? (
              <p className="text-sm text-blue-700 flex items-center gap-1">
                <Info className="h-4 w-4" />
                Novo cliente será criado
              </p>
            ) : null}
          </div>

          {/* Email & Phone - Only if new client */}
          {!selectedClientId && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => updatePhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Date & Time - Lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="grid gap-2">
              <Label>Data da Visita <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(new Date(formData.date), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateField("date", format(date, "yyyy-MM-dd"));
                      }
                    }}
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                Horário <span className="text-destructive">*</span>
                {isTimeOutOfRange && (
                  <Badge variant="outline" className="text-xs text-warning">
                    Fora do padrão
                  </Badge>
                )}
              </Label>
              <Select value={formData.time} onValueChange={handleTimeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Horários dentro do range configurado */}
                  {availableSlots.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Horários Disponíveis
                      </div>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-green-600" />
                            {slot}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {/* Todos os horários (incluindo fora do range) */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                    Outros Horários
                  </div>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
                    .filter(time => !availableSlots.includes(time))
                    .map((time) => (
                      <SelectItem key={time} value={time}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-warning" />
                          <span className="text-muted-foreground">{time}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview de Duração */}
          {formData.time && (
            <Alert className="bg-primary/5 border-primary/20">
              <Clock className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Duração estimada:</strong> {currentSettings.default_duration} minutos
                <br />
                <strong>Término previsto:</strong> {calculatedEndTime}
                {isTimeOutOfRange && (
                  <>
                    <br />
                    <span className="text-warning">⚠️ Este horário está fora do padrão configurado ({currentSettings.start_time} - {currentSettings.end_time})</span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Guest Count */}
          <div className="grid gap-2">
            <Label>Número de Convidados (Estimativa)</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 150"
              value={formData.guestCount}
              onChange={(e) => updateField("guestCount", e.target.value)}
            />
          </div>

          {/* Wedding Date Status */}
          <div className="grid gap-2">
            <Label>Data do Casamento</Label>
            <Select
              value={formData.weddingDateStatus}
              onValueChange={(value) => updateField("weddingDateStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undefined">Ainda não definida</SelectItem>
                <SelectItem value="defined">Já tem data definida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wedding Date - If defined */}
          {formData.weddingDateStatus === "defined" && (
            <div className="grid gap-2">
              <Label>Data do Casamento <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.weddingDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.weddingDate ? (
                      format(new Date(formData.weddingDate), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.weddingDate ? new Date(formData.weddingDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateField("weddingDate", format(date, "yyyy-MM-dd"));
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Wedding Month/Year Estimate - If not defined */}
          {formData.weddingDateStatus === "undefined" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Mês (Previsão)</Label>
                <Select
                  value={formData.weddingMonthEstimate}
                  onValueChange={(value) => updateField("weddingMonthEstimate", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Ano (Previsão)</Label>
                <Select
                  value={formData.weddingYearEstimate}
                  onValueChange={(value) => updateField("weddingYearEstimate", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre a visita..."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="gold" onClick={handleSubmit}>
            Agendar Visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}