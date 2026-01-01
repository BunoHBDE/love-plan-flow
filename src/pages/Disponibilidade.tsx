import { useState, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Calendar,
  Ban,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Pencil,
  CalendarPlus,
  CalendarMinus,
} from "lucide-react";
import { 
  format, 
  isSameDay, 
  isWeekend, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  setMonth, 
  setYear, 
  getMonth, 
  getYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuotesOptimized as useQuotes } from "@/hooks/useQuotesOptimized";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useAvailableDates } from "@/hooks/useAvailableDates";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DayWithTooltip } from "@/components/disponibilidade/DayWithTooltip";
import { DayContentProps } from "react-day-picker";

type ViewMode = "mensal" | "estacao" | "anual";

export default function Disponibilidade() {
  const navigate = useNavigate();
  const { quotes, loading: loadingQuotes } = useQuotes();
  const { blockedDates, loading: loadingBlocked, addBlockedDate, updateBlockedDate, removeBlockedDate } = useBlockedDates();
  const { availableDates, loading: loadingAvailable, addAvailableDate, removeAvailableDate } = useAvailableDates();
  
  const [viewMode, setViewMode] = useState<ViewMode>("mensal");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [editedReason, setEditedReason] = useState("");
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateToBlock, setDateToBlock] = useState<Date | null>(null);
  const [dateToUnblock, setDateToUnblock] = useState<{ id: string; date: Date; reason: string } | null>(null);
  const [dateToMakeAvailable, setDateToMakeAvailable] = useState<Date | null>(null);
  const [dateToMakeUnavailable, setDateToMakeUnavailable] = useState<{ id: string; date: Date } | null>(null);
  const [isMakeAvailableDialogOpen, setIsMakeAvailableDialogOpen] = useState(false);
  const [isMakeUnavailableDialogOpen, setIsMakeUnavailableDialogOpen] = useState(false);
  const [isWeekdayActionDialogOpen, setIsWeekdayActionDialogOpen] = useState(false);
  const [availableReason, setAvailableReason] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loading = loadingQuotes || loadingBlocked || loadingAvailable;

  // Calcular meses a exibir
  const monthsToDisplay = useMemo(() => {
    if (viewMode === "mensal") {
      return [currentDate];
    }
    
    if (viewMode === "estacao") {
      const monthNum = getMonth(currentDate);
      const year = getYear(currentDate);
      let seasonStart: number;
      
      if (monthNum >= 11 || monthNum <= 1) seasonStart = 11;
      else if (monthNum >= 2 && monthNum <= 4) seasonStart = 2;
      else if (monthNum >= 5 && monthNum <= 7) seasonStart = 5;
      else seasonStart = 8;
      
      const adjustedYear = seasonStart === 11 && monthNum <= 1 ? year - 1 : year;
      const first = setMonth(setYear(new Date(), adjustedYear), seasonStart);
      
      return [first, addMonths(first, 1), addMonths(first, 2)];
    }
    
    const year = getYear(currentDate);
    return Array.from({ length: 12 }, (_, i) => setMonth(setYear(new Date(), year), i));
  }, [viewMode, currentDate]);

  // Eventos aceitos
  const eventosAceitos = useMemo(() => {
    return quotes
      .filter((q) => q.status === "aceito" && q.data_evento)
      .map((q) => ({
        id: q.id,
        date: new Date(q.data_evento! + "T12:00:00"),
        clientName: q.client?.nome || "Cliente",
        guestCount: q.n_convidados,
        pacote: q.pacote,
      }));
  }, [quotes]);

  // Datas bloqueadas
  const datasBloqueadas = useMemo(() => {
    return blockedDates.map((b) => ({
      id: b.id,
      date: new Date(b.date + "T12:00:00"),
      reason: b.reason,
    }));
  }, [blockedDates]);

  // Datas manualmente disponíveis (dias de semana que foram habilitados)
  const datasDisponiveis = useMemo(() => {
    return availableDates.map((a) => ({
      id: a.id,
      date: new Date(a.date + "T12:00:00"),
      reason: a.reason,
    }));
  }, [availableDates]);

  // Período atual
  const periodRange = useMemo(() => {
    const first = monthsToDisplay[0];
    const last = monthsToDisplay[monthsToDisplay.length - 1];
    return {
      start: startOfMonth(first),
      end: endOfMonth(last),
    };
  }, [monthsToDisplay]);

  // Todos os dias do período
  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: periodRange.start, end: periodRange.end });
  }, [periodRange]);

  // Informações de uma data
  const getDateInfo = (date: Date) => {
    const evento = eventosAceitos.find(e => isSameDay(e.date, date));
    const bloqueio = datasBloqueadas.find(b => isSameDay(b.date, date));
    const extraDisponivel = datasDisponiveis.find(d => isSameDay(d.date, date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Uma data é disponível se:
    // 1. É fim de semana OU foi marcada manualmente como disponível
    // 2. Não está no passado
    // 3. Não tem evento
    // 4. Não está bloqueada
    const isNaturallyAvailable = isWeekend(date);
    const isManuallyAvailable = !!extraDisponivel;
    const isAvailable = (isNaturallyAvailable || isManuallyAvailable) && date >= today && !evento && !bloqueio;
    
    return { evento, bloqueio, extraDisponivel, isAvailable, isNaturallyAvailable, isManuallyAvailable };
  };

  // Estatísticas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventos = eventosAceitos.filter(e => 
      e.date >= periodRange.start && e.date <= periodRange.end
    ).length;

    const bloqueados = datasBloqueadas.filter(b => 
      b.date >= periodRange.start && b.date <= periodRange.end
    ).length;

    const disponiveis = allDays.filter(day => {
      if (day < today) return false;
      const info = getDateInfo(day);
      return info.isAvailable;
    }).length;

    return { eventos, bloqueados, disponiveis };
  }, [periodRange, allDays, eventosAceitos, datasBloqueadas, datasDisponiveis]);

  // Estatísticas por mês (para anual)
  const monthlyStats = useMemo(() => {
    if (viewMode !== "anual") return [];
    
    return monthsToDisplay.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const days = eachDayOfInterval({ start, end });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const eventos = eventosAceitos.filter(e => 
        e.date >= start && e.date <= end
      ).length;

      const bloqueados = datasBloqueadas.filter(b => 
        b.date >= start && b.date <= end
      ).length;

      const disponiveis = days.filter(day => {
        if (day < today) return false;
        const info = getDateInfo(day);
        return info.isAvailable;
      }).length;

      return { month, eventos, bloqueados, disponiveis };
    });
  }, [viewMode, monthsToDisplay, eventosAceitos, datasBloqueadas, datasDisponiveis]);

  // Nome do período
  const periodName = useMemo(() => {
    if (viewMode === "mensal") {
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
    if (viewMode === "estacao") {
      const m = getMonth(currentDate);
      let season = "";
      if (m >= 11 || m <= 1) season = "Verão";
      else if (m >= 2 && m <= 4) season = "Outono";
      else if (m >= 5 && m <= 7) season = "Inverno";
      else season = "Primavera";
      return `${season} ${getYear(currentDate)}`;
    }
    return String(getYear(currentDate));
  }, [viewMode, currentDate]);

  // Navegação
  const handlePrevious = () => {
    if (viewMode === "mensal") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "estacao") setCurrentDate(subMonths(currentDate, 3));
    else setCurrentDate(setYear(currentDate, getYear(currentDate) - 1));
  };

  const handleNext = () => {
    if (viewMode === "mensal") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "estacao") setCurrentDate(addMonths(currentDate, 3));
    else setCurrentDate(setYear(currentDate, getYear(currentDate) + 1));
  };

  // Clique em data
  const handleDateClick = (date: Date) => {
    const info = getDateInfo(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Data no passado - ignorar
    if (date < today) return;
    
    // Data com evento - ir para orçamentos
    if (info.evento) {
      navigate(`/orcamentos`);
      return;
    }
    
    // Data bloqueada - mostrar dialog de desbloqueio
    if (info.bloqueio) {
      setDateToUnblock({
        id: info.bloqueio.id,
        date: date,
        reason: info.bloqueio.reason,
      });
      setIsUnblockDialogOpen(true);
      return;
    }
    
    // Data manualmente disponível (dia de semana) - opção de remover disponibilidade
    if (info.isManuallyAvailable && info.extraDisponivel) {
      setDateToMakeUnavailable({
        id: info.extraDisponivel.id,
        date: date,
      });
      setIsMakeUnavailableDialogOpen(true);
      return;
    }
    
    // Data naturalmente disponível (fim de semana) - mostrar opções padrão
    if (info.isAvailable) {
      setSelectedDate(date);
      setIsActionDialogOpen(true);
      return;
    }
    
    // Dia de semana não disponível - opção de tornar disponível
    if (!info.isNaturallyAvailable && !info.isAvailable) {
      setDateToMakeAvailable(date);
      setIsWeekdayActionDialogOpen(true);
    }
  };

  // Ações do popup
  const handleNewQuote = () => {
    if (selectedDate) {
      setIsActionDialogOpen(false);
      navigate(`/orcamentos/novo?data_evento=${format(selectedDate, "yyyy-MM-dd")}`);
    }
  };

  const handleBlockDate = () => {
    if (selectedDate) {
      setIsActionDialogOpen(false);
      setDateToBlock(selectedDate);
      setIsBlockDialogOpen(true);
    }
  };

  // Desbloquear data
  const handleUnblock = async () => {
    if (!dateToUnblock) return;
    
    setIsSubmitting(true);
    await removeBlockedDate(dateToUnblock.id);
    setIsSubmitting(false);
    setIsUnblockDialogOpen(false);
    setIsEditingReason(false);
    toast.success("Data desbloqueada", {
      description: format(dateToUnblock.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    });
    setDateToUnblock(null);
  };

  // Editar motivo
  const handleEditReason = async () => {
    if (!dateToUnblock || !editedReason.trim()) return;
    
    setIsSubmitting(true);
    const success = await updateBlockedDate(dateToUnblock.id, editedReason.trim());
    setIsSubmitting(false);
    
    if (success) {
      setIsUnblockDialogOpen(false);
      setIsEditingReason(false);
      toast.success("Motivo atualizado", {
        description: format(dateToUnblock.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      });
      setDateToUnblock(null);
      setEditedReason("");
    }
  };

  // Iniciar edição
  const startEditingReason = () => {
    if (dateToUnblock) {
      setEditedReason(dateToUnblock.reason);
      setIsEditingReason(true);
    }
  };

  // Bloquear
  const handleBlock = async () => {
    if (!dateToBlock || !blockReason.trim()) return;
    
    setIsSubmitting(true);
    const success = await addBlockedDate(
      format(dateToBlock, "yyyy-MM-dd"),
      blockReason.trim()
    );
    setIsSubmitting(false);
    
    if (success) {
      setIsBlockDialogOpen(false);
      toast.success("Data bloqueada", {
        description: format(dateToBlock, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      });
      setDateToBlock(null);
      setBlockReason("");
    }
  };

  // Tornar data disponível
  const handleMakeAvailable = async () => {
    if (!dateToMakeAvailable) return;
    
    setIsSubmitting(true);
    const success = await addAvailableDate(
      format(dateToMakeAvailable, "yyyy-MM-dd"),
      availableReason.trim() || undefined
    );
    setIsSubmitting(false);
    
    if (success) {
      setIsMakeAvailableDialogOpen(false);
      setIsWeekdayActionDialogOpen(false);
      toast.success("Data disponibilizada", {
        description: format(dateToMakeAvailable, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      });
      setDateToMakeAvailable(null);
      setAvailableReason("");
    }
  };

  // Tornar data indisponível (remover disponibilidade manual)
  const handleMakeUnavailable = async () => {
    if (!dateToMakeUnavailable) return;
    
    setIsSubmitting(true);
    const success = await removeAvailableDate(dateToMakeUnavailable.id);
    setIsSubmitting(false);
    
    if (success) {
      setIsMakeUnavailableDialogOpen(false);
      toast.success("Data tornada indisponível", {
        description: format(dateToMakeUnavailable.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      });
      setDateToMakeUnavailable(null);
    }
  };

  // Abrir dialog de tornar disponível
  const openMakeAvailableDialog = () => {
    setIsWeekdayActionDialogOpen(false);
    setIsMakeAvailableDialogOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Disponibilidade do Espaço
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulte datas disponíveis e gerencie sua agenda
          </p>
        </div>

        {/* Cards de Resumo - Versão Compacta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-slide-up max-w-4xl mx-auto">
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-4 shadow-soft hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Disponíveis</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{stats.disponiveis}</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950 dark:to-rose-900/50 border-2 border-rose-200 dark:border-rose-800 rounded-lg p-4 shadow-soft hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-700 dark:text-rose-400 mb-0.5">Eventos</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-500">{stats.eventos}</p>
              </div>
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-rose-600 dark:text-rose-500" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 shadow-soft hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Bloqueadas</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{stats.bloqueados}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Ban className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Controles Centralizados */}
        <div className="flex flex-col items-center gap-4">
          {/* Segmented Control para Visualização */}
          <div className="inline-flex items-center bg-muted/50 p-1 rounded-xl border shadow-sm">
            <button
              onClick={() => setViewMode("mensal")}
              className={`
                px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${viewMode === "mensal" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }
              `}
            >
              📅 Mensal
            </button>
            <button
              onClick={() => setViewMode("estacao")}
              className={`
                px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${viewMode === "estacao" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }
              `}
            >
              🍂 Estação
            </button>
            <button
              onClick={() => setViewMode("anual")}
              className={`
                px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${viewMode === "anual" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }
              `}
            >
              📊 Anual
            </button>
          </div>

          {/* Navegação de Período */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrevious} 
              className="hover:scale-110 transition-transform hover:border-primary/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold capitalize min-w-[200px] text-center">
              {periodName}
            </h2>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNext} 
              className="hover:scale-110 transition-transform hover:border-primary/50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        {viewMode === "anual" ? (
          <div className="bg-card rounded-xl border shadow-soft p-4 sm:p-6 animate-slide-up">
            <div className="space-y-2">
              {monthlyStats.map(({ month, eventos, bloqueados, disponiveis }) => (
                <div 
                  key={month.toISOString()}
                  onClick={() => {
                    setCurrentDate(month);
                    setViewMode("mensal");
                  }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <span className="font-semibold capitalize text-base sm:text-lg sm:w-32">
                    {format(month, "MMMM", { locale: ptBR })}
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                      <span className="font-medium">{disponiveis} Disponíveis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                      <span className="font-medium">{eventos} Eventos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                      <span className="font-medium">{bloqueados} Bloqueados</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === "mensal" 
                ? "grid-cols-1 max-w-fit mx-auto" 
                : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            }`}>
              {monthsToDisplay.map((month, idx) => (
                <div key={idx} className="bg-card rounded-xl border shadow-soft p-6 hover:shadow-lg transition-shadow duration-300 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  {viewMode === "estacao" && (
                    <div className="text-center mb-4 font-semibold text-lg capitalize text-primary">
                      {format(month, "MMMM", { locale: ptBR })}
                    </div>
                  )}
                  <div className="flex justify-center">
                    <CalendarComponent
                      showCaption={false}
                      showMonthNavigation={false}
                      showYearNavigation={false}
                      mode="single"
                      month={month}
                      onDayClick={handleDateClick}
                      modifiers={{
                        evento: eventosAceitos.map(e => e.date),
                        bloqueado: datasBloqueadas.map(b => b.date),
                        disponivel: allDays.filter(d => {
                          const info = getDateInfo(d);
                          return info.isAvailable && info.isNaturallyAvailable && !info.isManuallyAvailable;
                        }),
                        disponivelExtra: datasDisponiveis.map(d => d.date),
                      }}
                      modifiersClassNames={{
                        evento: "bg-rose-500 text-white hover:bg-rose-600 font-bold cursor-pointer transition-colors",
                        bloqueado: "bg-amber-500 text-white hover:bg-amber-600 font-bold cursor-pointer transition-colors",
                        disponivel: "bg-emerald-500 text-white hover:bg-emerald-600 font-bold cursor-pointer transition-colors",
                        disponivelExtra: "bg-blue-500 text-white hover:bg-blue-600 font-bold cursor-pointer transition-colors ring-2 ring-blue-300 dark:ring-blue-700",
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      renderDayContent={(dayContentProps: DayContentProps) => (
                        <DayWithTooltip
                          day={dayContentProps.date}
                          eventosAceitos={eventosAceitos}
                          datasBloqueadas={datasBloqueadas}
                          datasDisponiveis={datasDisponiveis}
                        >
                          <span>{dayContentProps.date.getDate()}</span>
                        </DayWithTooltip>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>


          </>
        )}
      </div>

      {/* Dialog de Ações para Data */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription className="text-center">
              O que você deseja fazer com esta data?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-6">
            <Button
              variant="default"
              size="lg"
              onClick={handleNewQuote}
              className="h-24 flex-col gap-2 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="h-6 w-6" />
              <span className="font-semibold">Novo Orçamento</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleBlockDate}
              className="h-24 flex-col gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:border-amber-500 dark:hover:bg-amber-950/30 transition-all duration-300"
            >
              <Ban className="h-6 w-6" />
              <span className="font-semibold">Bloquear Data</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Bloqueio */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Data</DialogTitle>
            <DialogDescription>
              {dateToBlock && format(dateToBlock, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Motivo do Bloqueio</Label>
            <Input
              placeholder="Ex: Feriado, Manutenção, Evento privado..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlock} disabled={!blockReason.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bloquear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Desbloqueio/Edição */}
      <Dialog 
        open={isUnblockDialogOpen} 
        onOpenChange={(open) => {
          setIsUnblockDialogOpen(open);
          if (!open) {
            setIsEditingReason(false);
            setEditedReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {isEditingReason ? "Editar Motivo" : "Data Bloqueada"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {dateToUnblock && format(dateToUnblock.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isEditingReason ? (
              <div className="space-y-2">
                <Label>Novo motivo do bloqueio</Label>
                <Input
                  placeholder="Ex: Feriado, Manutenção, Evento privado..."
                  value={editedReason}
                  onChange={(e) => setEditedReason(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Motivo do bloqueio:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startEditingReason}
                      className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300">{dateToUnblock?.reason}</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  Deseja liberar esta data para novos eventos?
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-center gap-3">
            {isEditingReason ? (
              <>
                <Button variant="outline" onClick={() => setIsEditingReason(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEditReason} 
                  disabled={!editedReason.trim() || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsUnblockDialogOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  onClick={handleUnblock} 
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Desbloquear
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Ações para Dia de Semana (não disponível) */}
      <Dialog open={isWeekdayActionDialogOpen} onOpenChange={setIsWeekdayActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {dateToMakeAvailable && format(dateToMakeAvailable, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription className="text-center">
              Este dia de semana não está disponível por padrão. Deseja torná-lo disponível?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-6">
            <Button
              variant="default"
              size="lg"
              onClick={openMakeAvailableDialog}
              className="h-24 w-full max-w-xs flex-col gap-2 bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CalendarPlus className="h-6 w-6" />
              <span className="font-semibold">Tornar Disponível</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Tornar Disponível */}
      <Dialog 
        open={isMakeAvailableDialogOpen} 
        onOpenChange={(open) => {
          setIsMakeAvailableDialogOpen(open);
          if (!open) setAvailableReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tornar Data Disponível</DialogTitle>
            <DialogDescription>
              {dateToMakeAvailable && format(dateToMakeAvailable, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Motivo (opcional)</Label>
            <Input
              placeholder="Ex: Evento especial, Dia extra para casamentos..."
              value={availableReason}
              onChange={(e) => setAvailableReason(e.target.value)}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMakeAvailableDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMakeAvailable} 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tornar Disponível
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Remover Disponibilidade - Estilo similar ao de data disponível */}
      <Dialog open={isMakeUnavailableDialogOpen} onOpenChange={setIsMakeUnavailableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {dateToMakeUnavailable && format(dateToMakeUnavailable.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription className="text-center">
              O que você deseja fazer com esta data?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-6">
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                if (dateToMakeUnavailable) {
                  setIsMakeUnavailableDialogOpen(false);
                  setSelectedDate(dateToMakeUnavailable.date);
                  navigate(`/orcamentos/novo?data_evento=${format(dateToMakeUnavailable.date, "yyyy-MM-dd")}`);
                }
              }}
              className="h-24 flex-col gap-2 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="h-6 w-6" />
              <span className="font-semibold">Novo Orçamento</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleMakeUnavailable}
              disabled={isSubmitting}
              className="h-24 flex-col gap-2 border-slate-500/50 text-slate-600 hover:bg-slate-50 hover:border-slate-500 dark:text-slate-400 dark:hover:bg-slate-950/30 transition-all duration-300"
            >
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <CalendarMinus className="h-6 w-6" />
              )}
              <span className="font-semibold">Tornar Indisponível</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}