import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
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
  Calendar as CalendarIcon,
  Ban,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, isSameDay, isWeekend, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, setMonth, setYear, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuotesOptimized as useQuotes } from "@/hooks/useQuotesOptimized";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useNavigate } from "react-router-dom";

type ViewPeriod = "mensal" | "estacao" | "anual";

export default function Disponibilidade() {
  const navigate = useNavigate();
  const { quotes, loading: loadingQuotes } = useQuotes();
  const { blockedDates, loading: loadingBlocked, addBlockedDate, removeBlockedDate } = useBlockedDates();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>("mensal");
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [dateToBlock, setDateToBlock] = useState<Date | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loading = loadingQuotes || loadingBlocked;

  // Calcular meses a exibir baseado no período
  const monthsToDisplay = useMemo(() => {
    if (viewPeriod === "mensal") {
      return [currentMonth];
    }
    
    if (viewPeriod === "estacao") {
      const currentMonthNum = getMonth(currentMonth);
      const year = getYear(currentMonth);
      let seasonStart: number;
      
      // Estações do Brasil (Hemisfério Sul)
      if (currentMonthNum >= 11 || currentMonthNum <= 1) {
        seasonStart = 11; // Verão (Dez, Jan, Fev)
      } else if (currentMonthNum >= 2 && currentMonthNum <= 4) {
        seasonStart = 2; // Outono (Mar, Abr, Mai)
      } else if (currentMonthNum >= 5 && currentMonthNum <= 7) {
        seasonStart = 5; // Inverno (Jun, Jul, Ago)
      } else {
        seasonStart = 8; // Primavera (Set, Out, Nov)
      }
      
      const adjustedYear = seasonStart === 11 && currentMonthNum <= 1 ? year - 1 : year;
      const firstMonth = setMonth(setYear(new Date(), adjustedYear), seasonStart);
      
      return [
        firstMonth,
        addMonths(firstMonth, 1),
        addMonths(firstMonth, 2),
      ];
    }
    
    // Anual - 12 meses
    const year = getYear(currentMonth);
    return Array.from({ length: 12 }, (_, i) => setMonth(setYear(new Date(), year), i));
  }, [viewPeriod, currentMonth]);

  // Nome da estação
  const getSeasonName = () => {
    const currentMonthNum = getMonth(currentMonth);
    if (currentMonthNum >= 11 || currentMonthNum <= 1) return "Verão";
    if (currentMonthNum >= 2 && currentMonthNum <= 4) return "Outono";
    if (currentMonthNum >= 5 && currentMonthNum <= 7) return "Inverno";
    return "Primavera";
  };

  // Processar eventos aceitos
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

  // Processar datas bloqueadas
  const datasBloqueadas = useMemo(() => {
    return blockedDates.map((b) => ({
      id: b.id,
      date: new Date(b.date + "T12:00:00"),
      reason: b.reason,
    }));
  }, [blockedDates]);

  // Calcular intervalo do período atual
  const periodRange = useMemo(() => {
    const firstMonth = monthsToDisplay[0];
    const lastMonth = monthsToDisplay[monthsToDisplay.length - 1];
    return {
      start: startOfMonth(firstMonth),
      end: endOfMonth(lastMonth),
    };
  }, [monthsToDisplay]);

  // Calcular todos os dias do período
  const diasDoPeriodo = useMemo(() => {
    return eachDayOfInterval({ 
      start: periodRange.start, 
      end: periodRange.end 
    });
  }, [periodRange]);

  // Estatísticas do período
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventos = eventosAceitos.filter(e => 
      e.date >= periodRange.start && e.date <= periodRange.end
    ).length;

    const bloqueados = datasBloqueadas.filter(b => 
      b.date >= periodRange.start && b.date <= periodRange.end
    ).length;

    const disponiveis = diasDoPeriodo.filter(day => {
      if (!isWeekend(day) || day < today) return false;
      
      const isOccupied = eventosAceitos.some(e => isSameDay(e.date, day));
      const isBlocked = datasBloqueadas.some(b => isSameDay(b.date, day));
      
      return !isOccupied && !isBlocked;
    }).length;

    return { eventos, bloqueados, disponiveis };
  }, [periodRange, diasDoPeriodo, eventosAceitos, datasBloqueadas]);

  // Obter informações de uma data
  const getDateInfo = (date: Date) => {
    const evento = eventosAceitos.find(e => isSameDay(e.date, date));
    const bloqueio = datasBloqueadas.find(b => isSameDay(b.date, date));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isAvailable = isWeekend(date) && 
      date >= today && 
      !evento && 
      !bloqueio;

    return { evento, bloqueio, isAvailable };
  };

  // Handler para clique em data
  const handleDateClick = (date: Date) => {
    const info = getDateInfo(date);
    
    // Se tem evento, navega para orçamentos
    if (info.evento) {
      navigate(`/orcamentos`);
      return;
    }
    
    // Se está bloqueado, confirma desbloqueio
    if (info.bloqueio) {
      if (confirm(`Desbloquear ${format(date, "dd/MM/yyyy")}?\nMotivo: ${info.bloqueio.reason}`)) {
        removeBlockedDate(info.bloqueio.id);
      }
      return;
    }
    
    // Se está disponível, mostra opções
    if (info.isAvailable) {
      const action = confirm(
        `${format(date, "dd/MM/yyyy")} - Data disponível\n\n` +
        `OK = Criar Orçamento\n` +
        `Cancelar = Bloquear Data`
      );
      
      if (action) {
        // Criar orçamento
        navigate(`/orcamentos/novo?data_evento=${format(date, "yyyy-MM-dd")}`);
      } else {
        // Bloquear
        setDateToBlock(date);
        setIsBlockDialogOpen(true);
      }
    }
  };

  // Bloquear data
  const handleBlockDate = async () => {
    if (!dateToBlock || !blockReason.trim()) return;
    
    setIsSubmitting(true);
    const success = await addBlockedDate(
      format(dateToBlock, "yyyy-MM-dd"),
      blockReason.trim()
    );
    setIsSubmitting(false);
    
    if (success) {
      setIsBlockDialogOpen(false);
      setDateToBlock(null);
      setBlockReason("");
    }
  };

  // Navegação de período
  const handlePreviousPeriod = () => {
    if (viewPeriod === "mensal") {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else if (viewPeriod === "estacao") {
      setCurrentMonth(subMonths(currentMonth, 3));
    } else {
      setCurrentMonth(setYear(currentMonth, getYear(currentMonth) - 1));
    }
  };

  const handleNextPeriod = () => {
    if (viewPeriod === "mensal") {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else if (viewPeriod === "estacao") {
      setCurrentMonth(addMonths(currentMonth, 3));
    } else {
      setCurrentMonth(setYear(currentMonth, getYear(currentMonth) + 1));
    }
  };

  // Texto do período atual
  const periodText = useMemo(() => {
    if (viewPeriod === "mensal") {
      return format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
    }
    if (viewPeriod === "estacao") {
      return `${getSeasonName()} ${getYear(currentMonth)}`;
    }
    return `${getYear(currentMonth)}`;
  }, [viewPeriod, currentMonth]);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold">Disponibilidade</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie datas disponíveis e eventos confirmados
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Período */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Visualizar:</Label>
              <Select value={viewPeriod} onValueChange={(v) => setViewPeriod(v as ViewPeriod)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Por Mês</SelectItem>
                  <SelectItem value="estacao">Por Estação</SelectItem>
                  <SelectItem value="anual">Por Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Navegação */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPeriod}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[180px] text-center capitalize">
                {periodText}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPeriod}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-3xl font-bold text-green-600">{stats.disponiveis}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos Confirmados</p>
                <p className="text-3xl font-bold text-red-600">{stats.eventos}</p>
              </div>
              <CalendarIcon className="h-10 w-10 text-red-600 opacity-50" />
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Datas Bloqueadas</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.bloqueados}</p>
              </div>
              <Ban className="h-10 w-10 text-yellow-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500"></div>
            <span className="text-sm">Disponível (clique para agendar ou bloquear)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500"></div>
            <span className="text-sm">Evento Confirmado (clique para ver)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500"></div>
            <span className="text-sm">Bloqueado (clique para desbloquear)</span>
          </div>
        </div>

        {/* Calendários */}
        <div className={`grid gap-6 ${
          viewPeriod === "mensal" 
            ? "grid-cols-1" 
            : viewPeriod === "estacao" 
            ? "grid-cols-1 md:grid-cols-3" 
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }`}>
          {monthsToDisplay.map((month, index) => (
            <div key={index} className="bg-card rounded-lg border p-4">
              {(viewPeriod === "estacao" || viewPeriod === "anual") && (
                <h3 className="text-sm font-medium mb-2 text-center capitalize">
                  {format(month, "MMMM yyyy", { locale: ptBR })}
                </h3>
              )}
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={(date) => date && handleDateClick(date)}
                month={month}
                locale={ptBR}
                className="w-full"
                modifiers={{
                  evento: eventosAceitos.map(e => e.date),
                  bloqueado: datasBloqueadas.map(b => b.date),
                  disponivel: diasDoPeriodo.filter(day => getDateInfo(day).isAvailable),
                }}
                modifiersClassNames={{
                  evento: "bg-red-500/20 text-red-700 font-bold hover:bg-red-500/30 cursor-pointer",
                  bloqueado: "bg-yellow-500/20 text-yellow-700 font-bold hover:bg-yellow-500/30 cursor-pointer",
                  disponivel: "bg-green-500/20 text-green-700 font-bold hover:bg-green-500/30 cursor-pointer",
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
            </div>
          ))}
        </div>

        {/* Listas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Eventos */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-red-600" />
              Eventos Confirmados no Período
            </h3>
            {eventosAceitos.filter(e => e.date >= periodRange.start && e.date <= periodRange.end).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum evento confirmado neste período
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {eventosAceitos
                  .filter(e => e.date >= periodRange.start && e.date <= periodRange.end)
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((evento) => (
                    <div
                      key={evento.id}
                      className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      onClick={() => navigate('/orcamentos')}
                    >
                      <div>
                        <p className="font-medium">{evento.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(evento.date, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          {evento.guestCount}
                        </div>
                        <Badge variant="secondary" className="capitalize">{evento.pacote}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Bloqueados */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Ban className="h-5 w-5 text-yellow-600" />
              Datas Bloqueadas no Período
            </h3>
            {datasBloqueadas.filter(b => b.date >= periodRange.start && b.date <= periodRange.end).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhuma data bloqueada neste período
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {datasBloqueadas
                  .filter(b => b.date >= periodRange.start && b.date <= periodRange.end)
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((bloqueio) => (
                    <div
                      key={bloqueio.id}
                      className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {format(bloqueio.date, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">{bloqueio.reason}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Desbloquear esta data?')) {
                            removeBlockedDate(bloqueio.id);
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBlockDialogOpen(false);
                setDateToBlock(null);
                setBlockReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBlockDate}
              disabled={!blockReason.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bloquear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}