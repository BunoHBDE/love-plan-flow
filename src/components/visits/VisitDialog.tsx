import React, { useState, useEffect, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, User, Clock, AlertCircle, Info, Loader2, Users, Heart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useVisitForm, getYearsArray, months } from "@/hooks/useVisitForm";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { useVisitSettings } from "@/hooks/useVisitSettings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VisitInsert, Visit } from "@/hooks/useVisitsOptimized";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WEDDING_DATE_STATUS } from "@/constants/visits";

// ==========================================
// TIPOS
// ==========================================

type DialogMode = "create" | "edit";

interface VisitDialogProps {
  /** Modo do dialog: "create" para nova visita, "edit" para edição */
  mode: DialogMode;
  /** Controla se o dialog está aberto */
  open: boolean;
  /** Callback para mudança de estado do dialog */
  onOpenChange: (open: boolean) => void;
  
  // Props para modo "create"
  /** Callback para criar nova visita */
  onCreateSubmit?: (visitData: VisitInsert, clientData?: any) => Promise<void>;
  /** Data inicial (quando agenda via calendário) */
  initialDate?: string;
  /** Hora inicial (quando agenda via calendário) */
  initialTime?: string;
  /** Lista de visitas existentes (para verificar conflitos de horário) */
  visits?: Visit[];
  
  // Props para modo "edit"
  /** Visita a ser editada */
  visit?: Visit | null;
  /** Função para obter nome do visitante */
  getVisitorName?: (visit: Visit) => string;
  /** Callback para atualizar visita */
  onEditSubmit?: (visitId: string, updates: Partial<VisitInsert>) => Promise<boolean>;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function VisitDialog({
  mode,
  open,
  onOpenChange,
  // Props create
  onCreateSubmit,
  initialDate,
  initialTime,
  visits = [],
  // Props edit
  visit,
  getVisitorName,
  onEditSubmit,
}: VisitDialogProps) {
  const { formData, updateField, updatePhone, resetForm, setForm, validateForm } = useVisitForm();
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

  // Estados locais
  const [clientSearch, setClientSearch] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [calculatedEndTime, setCalculatedEndTime] = useState<string>("");
  const [isTimeOutOfRange, setIsTimeOutOfRange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Indica se está em modo de edição
  const isEditMode = mode === "edit";

  // Anos disponíveis para seleção
  const years = getYearsArray();

  // Configurações de horários
  const availableSlots = generateAvailableSlots(settings);
  const currentSettings = settings || defaultSettings;

  // ==========================================
  // FILTRO DE HORÁRIOS (modo create)
  // ==========================================
  
  // Mapa de horários com contagem de visitas na data selecionada
  const slotVisitCounts = useMemo(() => {
    if (!formData.date || isEditMode) return new Map<string, number>();
    
    const counts = new Map<string, number>();
    visits
      .filter(v => v.visit_date === formData.date)
      .forEach(v => {
        const time = v.visit_time.substring(0, 5);
        counts.set(time, (counts.get(time) || 0) + 1);
      });
    return counts;
  }, [visits, formData.date, isEditMode]);

  // Função para obter contagem de visitas em um horário
  const getVisitCount = (time: string): number => {
    return slotVisitCounts.get(time) || 0;
  };

  // Horários sugeridos livres (gerados pelo sistema e sem visitas)
  const availableSlotsFiltered = useMemo(() => {
    return availableSlots.filter(slot => !slotVisitCounts.has(slot));
  }, [availableSlots, slotVisitCounts]);

  // Horários sugeridos com visitas (gerados pelo sistema e já tem visita)
  const occupiedSlotsInRange = useMemo(() => {
    return availableSlots.filter(slot => slotVisitCounts.has(slot));
  }, [availableSlots, slotVisitCounts]);

  // Gerar TODOS os horários do dia (a cada 15min)
  const allDaySlots = useMemo(() => {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return times;
  }, []);

  // Horários "quebrados" dentro do expediente (não são os sugeridos, mas estão no range)
  const otherSlotsInRange = useMemo(() => {
    return allDaySlots.filter(time => 
      // Está dentro do expediente
      isTimeInRange(time) && 
      // Mas NÃO é um dos horários sugeridos
      !availableSlots.includes(time)
    );
  }, [allDaySlots, availableSlots, isTimeInRange]);

  // Horários fora do expediente (antes do start_time ou depois do end_time)
  const outOfRangeSlots = useMemo(() => {
    return allDaySlots.filter(time => !isTimeInRange(time));
  }, [allDaySlots, isTimeInRange]);

  // Contagem de visitas no horário selecionado (para mostrar aviso)
  const selectedTimeVisitCount = useMemo(() => {
    if (!formData.time) return 0;
    return getVisitCount(formData.time);
  }, [formData.time, slotVisitCounts]);

  // ==========================================
  // EFEITOS
  // ==========================================

  /**
   * Reseta o formulário quando abre em modo criação
   * Garante que não há dados residuais de uma sessão anterior
   */
  useEffect(() => {
    if (open && !isEditMode) {
      // Reseta estados locais (formData será resetado pelo useVisitForm ou preenchido com initialDate/initialTime)
      setClientSearch("");
      setSelectedClientId(null);
      setClientSearchResults([]);
      setCalculatedEndTime("");
      setIsTimeOutOfRange(false);
      setIsSubmitting(false);
    }
  }, [open, isEditMode]);

  /**
   * Carrega dados da visita no modo edição
   */
  useEffect(() => {
    if (isEditMode && visit && open && getVisitorName) {
      const visitorName = getVisitorName(visit);
      
      // Extrai notas (remove prefixo VISITANTE: se existir)
      let cleanNotes = visit.notes || "";
      if (cleanNotes.startsWith('VISITANTE: ')) {
        cleanNotes = cleanNotes.split('\n\n').slice(1).join('\n\n');
      }
      
      setForm({
        clientName: visitorName,
        date: visit.visit_date,
        time: visit.visit_time,
        notes: cleanNotes,
        guestCount: visit.guest_count?.toString() || "",
        weddingDateStatus: visit.wedding_date_status === WEDDING_DATE_STATUS.COM_DATA 
          ? "defined" 
          : "undefined",
        weddingDate: visit.wedding_date || "",
        weddingMonthEstimate: visit.wedding_month || "",
        weddingYearEstimate: visit.wedding_year || "",
      });
      
      // Define cliente selecionado se existir
      if (visit.client_id) {
        setSelectedClientId(visit.client_id);
        setClientSearch(visitorName);
      }
    }
  }, [visit, open, isEditMode, getVisitorName, setForm]);

  /**
   * Preenche data e hora iniciais no modo criação
   */
  useEffect(() => {
    if (!isEditMode && open) {
      if (initialDate) {
        updateField("date", initialDate);
      }
      if (initialTime) {
        updateField("time", initialTime);
      }
    }
  }, [open, initialDate, initialTime, isEditMode, updateField]);

  /**
   * Calcula horário de término quando o horário muda
   */
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

  // ==========================================
  // HANDLERS - BUSCA DE CLIENTE
  // ==========================================

  const handleClientSearch = async (term: string) => {
    setClientSearch(term);
    updateField("clientName", term);
    
    // CORREÇÃO: Limpa o cliente selecionado quando o usuário modifica o texto
    // Isso garante que se o usuário apagar ou modificar o nome após selecionar
    // um cliente existente, o vínculo será desfeito
    if (selectedClientId) {
      setSelectedClientId(null);
      // Limpa também email e telefone que foram preenchidos do cliente selecionado
      updateField("email", "");
      updateField("phone", "");
    }
    
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

  const handleTimeSelect = (value: string) => {
    updateField("time", value);
  };

  // ==========================================
  // HANDLERS - SUBMIT
  // ==========================================

  /**
   * Processa o submit do formulário
   * Diferencia entre criar nova visita ou atualizar existente
   */
  const handleSubmit = async () => {
    // Validação comum
    const validation = validateForm();
    
    if (!validation.isValid) {
      toast({
        title: "Campo obrigatório",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && visit && onEditSubmit) {
        // ==========================================
        // MODO EDIÇÃO
        // ==========================================
        
        // Prepara as notas (adiciona prefixo se for visitante sem cliente vinculado)
        let updatedNotes = formData.notes;
        if (!visit.client_id && formData.clientName) {
          const existingNotes = formData.notes ? `\n\n${formData.notes}` : '';
          updatedNotes = `VISITANTE: ${formData.clientName}${existingNotes}`;
        }

        // Monta objeto de atualizações
        const updates: Partial<VisitInsert> = {
          visit_date: formData.date,
          visit_time: formData.time,
          notes: updatedNotes || null,
          guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
          wedding_date_status: formData.weddingDateStatus === "defined" 
            ? WEDDING_DATE_STATUS.COM_DATA 
            : WEDDING_DATE_STATUS.SEM_DATA,
          wedding_date: formData.weddingDate || null,
          wedding_month: formData.weddingMonthEstimate || null,
          wedding_year: formData.weddingYearEstimate || null,
        };

        const success = await onEditSubmit(visit.id, updates);
        
        if (success) {
          onOpenChange(false);
        }
        
      } else if (onCreateSubmit) {
        // ==========================================
        // MODO CRIAÇÃO
        // ==========================================
        
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
          visit_end_time: calculatedEndTime,
          duration: currentSettings.default_duration,
          notes: notes || null,
          guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
          wedding_date_status: formData.weddingDateStatus === "defined" ? "com_data" : "sem_data",
          wedding_date: formData.weddingDate || null,
          wedding_month: formData.weddingMonthEstimate || null,
          wedding_year: formData.weddingYearEstimate || null,
          status: "agendado",
        };

        await onCreateSubmit(visitData, newClientData);
        
        // Reset form após criar
        handleReset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reseta todos os estados do formulário
   * IMPORTANTE: Deve limpar TODOS os estados locais além do formData
   */
  const handleReset = () => {
    resetForm();
    // Estados de busca de cliente
    setClientSearch("");
    setSelectedClientId(null);
    setClientSearchResults([]);
    // Estados de horário
    setCalculatedEndTime("");
    setIsTimeOutOfRange(false);
    // Estado de submissão
    setIsSubmitting(false);
  };

  /**
   * Handler para fechamento do dialog
   * Reseta o formulário no modo criação
   */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isEditMode) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  // No modo edição, não renderiza se não houver visita
  if (isEditMode && !visit) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-display text-xl sm:text-2xl">
            {isEditMode ? "Editar Visita" : "Agendar Nova Visita"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditMode 
              ? "Atualize as informações da visita"
              : "Preencha os dados para agendar uma nova visita ao espaço"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:gap-6 py-4">
          {/* ==================== SEÇÃO: CLIENTE ==================== */}
          {isEditMode ? (
            // Modo edição: campo simples de nome
            <div className="grid gap-2">
              <Label htmlFor="clientName" className="text-sm">
                Nome do Cliente/Visitante <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                placeholder="Nome do cliente ou visitante"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                {visit?.client_id 
                  ? "Este visitante está vinculado a um cliente cadastrado."
                  : "Visitante sem cadastro no sistema."}
              </p>
            </div>
          ) : (
            // Modo criação: busca de cliente
            <div className="grid gap-2">
              <Label className="text-sm">Cliente <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou busque..."
                  value={clientSearch}
                  onChange={(e) => handleClientSearch(e.target.value)}
                  className="pl-10 h-10"
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
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{client.nome}</div>
                        {client.telefone && (
                          <div className="text-xs text-muted-foreground truncate">{client.telefone}</div>
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
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>Novo cliente será criado</span>
                </p>
              ) : null}
            </div>
          )}

          {/* ==================== SEÇÃO: EMAIL E TELEFONE (apenas criação) ==================== */}
          {!isEditMode && !selectedClientId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label className="text-sm">E-mail</Label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm">Telefone</Label>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => updatePhone(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* ==================== SEÇÃO: DATA E HORÁRIO ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Data */}
            <div className="grid gap-2">
              <Label className="text-sm flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data da Visita <span className="text-destructive">*</span>
              </Label>
              {isEditMode ? (
                // Modo edição: input simples
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="h-10"
                />
              ) : (
                // Modo criação: calendário popup
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.date ? (
                          format(new Date(formData.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          "Selecione a data"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.date ? new Date(formData.date + 'T12:00:00') : undefined}
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
              )}
            </div>

            {/* Horário */}
            <div className="grid gap-2">
              <Label className="text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Horário <span className="text-destructive">*</span>
              </Label>
              {isEditMode ? (
                // Modo edição: input simples
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  className="h-10"
                />
              ) : (
                // Modo criação: Select com horários
                <Select value={formData.time} onValueChange={handleTimeSelect}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o horário">
                      {formData.time && (
                        <span className="flex items-center gap-2">
                          <span>{formData.time}</span>
                          {calculatedEndTime && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              até {calculatedEndTime}
                            </Badge>
                          )}
                          {selectedTimeVisitCount > 0 && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs text-amber-600 border-amber-300">
                              {selectedTimeVisitCount} {selectedTimeVisitCount === 1 ? 'visita' : 'visitas'}
                            </Badge>
                          )}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Header informativo */}
                    <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
                      Expediente: {currentSettings.start_time} - {currentSettings.end_time}
                    </div>

                    {/* 1. Horários disponíveis */}
                    {availableSlotsFiltered.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Disponíveis ({availableSlotsFiltered.length})
                        </div>
                        {availableSlotsFiltered.map((time) => (
                          <SelectItem key={`available-${time}`} value={time}>
                            <span className="text-green-700">{time}</span>
                          </SelectItem>
                        ))}
                      </>
                    )}

                    {/* 2. Horários com visitas agendadas */}
                    {occupiedSlotsInRange.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-amber-600 flex items-center gap-1 border-t mt-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          Com visitas ({occupiedSlotsInRange.length})
                        </div>
                        {occupiedSlotsInRange.map((time) => {
                          const count = getVisitCount(time);
                          return (
                            <SelectItem key={`occupied-${time}`} value={time}>
                              <span className="flex items-center gap-2 text-amber-700">
                                <span>{time}</span>
                                <span className="text-[10px] text-amber-500">
                                  ({count} {count === 1 ? 'visita' : 'visitas'})
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </>
                    )}

                    {/* 3. Outros do expediente */}
                    {otherSlotsInRange.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 flex items-center gap-1 border-t mt-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          Outros do Expediente ({otherSlotsInRange.length})
                        </div>
                        {otherSlotsInRange.map((time) => {
                          const count = getVisitCount(time);
                          return (
                            <SelectItem key={`other-${time}`} value={time}>
                              <span className="flex items-center gap-2 text-blue-700">
                                <span>{time}</span>
                                {count > 0 && (
                                  <span className="text-[10px] text-amber-500">
                                    ({count} {count === 1 ? 'visita' : 'visitas'})
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </>
                    )}

                    {/* 4. Fora do expediente */}
                    {outOfRangeSlots.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 border-t mt-1">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                          Fora do Expediente
                        </div>
                        {outOfRangeSlots.map((time) => {
                          const count = getVisitCount(time);
                          return (
                            <SelectItem key={`out-${time}`} value={time}>
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <span>{time}</span>
                                {count > 0 && (
                                  <span className="text-[10px] text-amber-500">
                                    ({count} {count === 1 ? 'visita' : 'visitas'})
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Alerta de horário com visitas já agendadas */}
          {!isEditMode && selectedTimeVisitCount > 0 && formData.time && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                Já {selectedTimeVisitCount === 1 ? 'existe' : 'existem'} <strong>{selectedTimeVisitCount} {selectedTimeVisitCount === 1 ? 'visita agendada' : 'visitas agendadas'}</strong> para 
                este horário em {formData.date ? format(new Date(formData.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'esta data'}.
                Você pode continuar com o agendamento.
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta de horário fora do range (apenas criação) */}
          {!isEditMode && isTimeOutOfRange && formData.time && (
            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Horário fora do funcionamento ({currentSettings.start_time} - {currentSettings.end_time}). 
                Você pode continuar, mas considere ajustar nas configurações.
              </AlertDescription>
            </Alert>
          )}

          {/* ==================== SEÇÃO: NÚMERO DE CONVIDADOS ==================== */}
          <div className="grid gap-2">
            <Label className="text-sm flex items-center gap-1">
              <Users className="h-4 w-4" />
              Número de Convidados (estimado)
            </Label>
            <Input
              type="number"
              min="1"
              max="2000"
              value={formData.guestCount}
              onChange={(e) => updateField("guestCount", e.target.value)}
              placeholder="Ex: 150"
              className="h-10"
            />
          </div>

          {/* ==================== SEÇÃO: DATA DO CASAMENTO ==================== */}
          <div className="space-y-3">
            <Label className="text-sm flex items-center gap-1">
              <Heart className="h-4 w-4 text-rose-500" />
              Data do Casamento
            </Label>
            
            <RadioGroup
              value={formData.weddingDateStatus}
              onValueChange={(value) => {
                updateField("weddingDateStatus", value as "defined" | "undefined");
                if (value === "defined") {
                  updateField("weddingMonthEstimate", "");
                  updateField("weddingYearEstimate", "");
                } else {
                  updateField("weddingDate", "");
                }
              }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="defined" id="wedding-defined" />
                <Label htmlFor="wedding-defined" className="cursor-pointer text-sm">
                  Data definida
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="undefined" id="wedding-undefined" />
                <Label htmlFor="wedding-undefined" className="cursor-pointer text-sm">
                  Ainda sem data
                </Label>
              </div>
            </RadioGroup>

            {/* Data definida */}
            {formData.weddingDateStatus === "defined" && (
              <div className="grid gap-2">
                {isEditMode ? (
                  <Input
                    type="date"
                    value={formData.weddingDate}
                    onChange={(e) => updateField("weddingDate", e.target.value)}
                    className="h-10"
                  />
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !formData.weddingDate && "text-muted-foreground"
                        )}
                      >
                        <Heart className="mr-2 h-4 w-4 text-rose-500 flex-shrink-0" />
                        <span className="truncate">
                          {formData.weddingDate ? (
                            format(new Date(formData.weddingDate + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            "Selecione a data do casamento"
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.weddingDate ? new Date(formData.weddingDate + 'T12:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateField("weddingDate", format(date, "yyyy-MM-dd"));
                          }
                        }}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* Mês/Ano estimado */}
            {formData.weddingDateStatus === "undefined" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm">Mês (Previsão)</Label>
                  <Select
                    value={formData.weddingMonthEstimate}
                    onValueChange={(value) => updateField("weddingMonthEstimate", value)}
                  >
                    <SelectTrigger className="h-10">
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
                  <Label className="text-sm">Ano (Previsão)</Label>
                  <Select
                    value={formData.weddingYearEstimate}
                    onValueChange={(value) => updateField("weddingYearEstimate", value)}
                  >
                    <SelectTrigger className="h-10">
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
          </div>

          {/* ==================== SEÇÃO: OBSERVAÇÕES ==================== */}
          <div className="grid gap-2">
            <Label className="text-sm">Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre a visita..."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* ==================== FOOTER ==================== */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button 
            variant="gold" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditMode ? "Salvar Alterações" : "Agendar Visita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}