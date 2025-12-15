import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, List, Users, Loader2, Plus, Ban, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, addMonths, setMonth, getMonth, getYear, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuotes } from "@/hooks/useQuotes";
import { useBlockedDates, type BlockedDate } from "@/hooks/useBlockedDates";

export default function Disponibilidade() {
  const navigate = useNavigate();
  const { quotes, loading: loadingQuotes } = useQuotes();
  const { blockedDates, loading: loadingBlocked, addBlockedDate, removeBlockedDate } = useBlockedDates();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<"mensal" | "estacao" | "anual">("mensal");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlockedDate | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<BlockedDate | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<Date | null>(null);
  const [blockFromCalendar, setBlockFromCalendar] = useState<Date | null>(null);
  const [blockFromCalendarReason, setBlockFromCalendarReason] = useState("");
  const [dateOptionsTarget, setDateOptionsTarget] = useState<Date | null>(null);
  const loading = loadingQuotes || loadingBlocked;

  // Get months to display based on view mode
  const monthsToDisplay = useMemo(() => {
    if (viewMode === "mensal") {
      return [selectedMonth];
    }
    
    if (viewMode === "estacao") {
      // Seasons in Brazil (Southern Hemisphere):
      // Verão: Dec, Jan, Feb | Outono: Mar, Apr, May | Inverno: Jun, Jul, Aug | Primavera: Sep, Oct, Nov
      const currentMonth = getMonth(selectedMonth);
      let seasonStart: number;
      
      if (currentMonth >= 11 || currentMonth <= 1) {
        // Verão
        seasonStart = 11; // December
      } else if (currentMonth >= 2 && currentMonth <= 4) {
        // Outono
        seasonStart = 2; // March
      } else if (currentMonth >= 5 && currentMonth <= 7) {
        // Inverno
        seasonStart = 5; // June
      } else {
        // Primavera
        seasonStart = 8; // September
      }
      
      const year = getYear(selectedMonth);
      const adjustedYear = currentMonth === 0 || currentMonth === 1 ? year : (seasonStart === 11 ? year : year);
      
      return [
        setMonth(setYear(new Date(), seasonStart === 11 && currentMonth <= 1 ? year - 1 : year), seasonStart),
        addMonths(setMonth(setYear(new Date(), seasonStart === 11 && currentMonth <= 1 ? year - 1 : year), seasonStart), 1),
        addMonths(setMonth(setYear(new Date(), seasonStart === 11 && currentMonth <= 1 ? year - 1 : year), seasonStart), 2),
      ];
    }
    
    // Annual - all 12 months of selected year
    return Array.from({ length: 12 }, (_, i) => setMonth(setYear(new Date(), selectedYear), i));
  }, [viewMode, selectedMonth, selectedYear]);

  const getSeasonName = () => {
    const currentMonth = getMonth(selectedMonth);
    if (currentMonth >= 11 || currentMonth <= 1) return "Verão";
    if (currentMonth >= 2 && currentMonth <= 4) return "Outono";
    if (currentMonth >= 5 && currentMonth <= 7) return "Inverno";
    return "Primavera";
  };

  // Filter only accepted quotes with event dates
  const eventosAceitos = useMemo(() => {
    return quotes
      .filter((q) => q.status === "aceito" && q.data_evento)
      .map((q) => ({
        id: q.id,
        date: q.data_evento!,
        clientName: q.client?.nome || "Cliente",
        guestCount: q.n_convidados,
        pacote: q.pacote,
        quoteNumber: q.quote_number,
        type: "evento" as const,
      }));
  }, [quotes]);

  // Get blocked dates as Date objects
  const datasBloqueadas = useMemo(() => {
    return blockedDates.map((b) => new Date(b.date + "T12:00:00"));
  }, [blockedDates]);

  // Get occupied dates (events + blocked)
  const datasOcupadas = useMemo(() => {
    return eventosAceitos.map((e) => new Date(e.date + "T12:00:00"));
  }, [eventosAceitos]);

  // All unavailable dates
  const allUnavailableDates = useMemo(() => {
    return [...datasOcupadas, ...datasBloqueadas];
  }, [datasOcupadas, datasBloqueadas]);

  // Get period range based on view mode
  const periodRange = useMemo(() => {
    if (viewMode === "mensal") {
      return { start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) };
    }
    if (viewMode === "estacao") {
      const firstMonth = monthsToDisplay[0];
      const lastMonth = monthsToDisplay[monthsToDisplay.length - 1];
      return { start: startOfMonth(firstMonth), end: endOfMonth(lastMonth) };
    }
    // Annual
    const firstMonth = setMonth(setYear(new Date(), selectedYear), 0);
    const lastMonth = setMonth(setYear(new Date(), selectedYear), 11);
    return { start: startOfMonth(firstMonth), end: endOfMonth(lastMonth) };
  }, [viewMode, selectedMonth, monthsToDisplay, selectedYear]);

  // Get events in selected period
  const eventosNoPeriodo = useMemo(() => {
    return eventosAceitos.filter((e) => {
      const eventDate = new Date(e.date + "T12:00:00");
      return eventDate >= periodRange.start && eventDate <= periodRange.end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [eventosAceitos, periodRange]);

  // Get blocked dates in selected period
  const bloqueadasNoPeriodo = useMemo(() => {
    return blockedDates.filter((b) => {
      const blockedDate = new Date(b.date + "T12:00:00");
      return blockedDate >= periodRange.start && blockedDate <= periodRange.end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [blockedDates, periodRange]);

  // Get available weekend dates in selected period
  const datasDisponiveis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allDays = eachDayOfInterval({ start: periodRange.start, end: periodRange.end });
    
    return allDays.filter((day) => {
      // Only weekends (Saturday and Sunday)
      if (!isWeekend(day)) return false;
      // Only future dates
      if (day < today) return false;
      // Not already occupied or blocked
      return !allUnavailableDates.some((unavailable) => isSameDay(unavailable, day));
    });
  }, [periodRange, allUnavailableDates]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00");
    return date.getDay() === 6 ? "Sábado" : "Domingo";
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate || !newBlockedReason.trim()) return;
    
    setIsSubmitting(true);
    const success = await addBlockedDate(newBlockedDate, newBlockedReason.trim());
    setIsSubmitting(false);
    
    if (success) {
      setIsAddDialogOpen(false);
      setNewBlockedDate("");
      setNewBlockedReason("");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await removeBlockedDate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleDateClick = (date: Date) => {
    // Check if it's an occupied date (event) - do nothing
    const isOccupied = datasOcupadas.some((d) => isSameDay(d, date));
    if (isOccupied) return;

    // Check if it's a blocked date - offer to release
    const blockedDate = blockedDates.find((b) => 
      isSameDay(new Date(b.date + "T12:00:00"), date)
    );
    if (blockedDate) {
      setReleaseTarget(blockedDate);
      return;
    }

    // Check if it's an available weekend date - offer to create quote
    const isAvailableWeekend = datasDisponiveis.some((d) => isSameDay(d, date));
    if (isAvailableWeekend) {
      setQuoteTarget(date);
      return;
    }

    // Otherwise, it's a weekday or other date - show options (block or make available)
    setDateOptionsTarget(date);
  };

  const handleChooseBlock = () => {
    if (!dateOptionsTarget) return;
    setBlockFromCalendar(dateOptionsTarget);
    setDateOptionsTarget(null);
  };

  const handleChooseAvailable = () => {
    if (!dateOptionsTarget) return;
    setQuoteTarget(dateOptionsTarget);
    setDateOptionsTarget(null);
  };

  const handleConfirmQuote = () => {
    if (!quoteTarget) return;
    const formattedDate = format(quoteTarget, "yyyy-MM-dd");
    navigate(`/orcamentos/novo?data_evento=${formattedDate}`);
  };

  const handleConfirmRelease = async () => {
    if (!releaseTarget) return;
    await removeBlockedDate(releaseTarget.id);
    setReleaseTarget(null);
  };

  const handleBlockFromCalendar = async () => {
    if (!blockFromCalendar || !blockFromCalendarReason.trim()) return;
    
    setIsSubmitting(true);
    const formattedDate = format(blockFromCalendar, "yyyy-MM-dd");
    const success = await addBlockedDate(formattedDate, blockFromCalendarReason.trim());
    setIsSubmitting(false);
    
    if (success) {
      setBlockFromCalendar(null);
      setBlockFromCalendarReason("");
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Disponibilidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Consulte datas disponíveis e eventos confirmados
            </p>
          </div>

          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Bloquear Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-display font-semibold">Calendário</h2>
                </div>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                  <TabsList>
                    <TabsTrigger value="mensal">Mensal</TabsTrigger>
                    <TabsTrigger value="estacao">Estação</TabsTrigger>
                    <TabsTrigger value="anual">Anual</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Navigation for view modes */}
              {viewMode === "mensal" && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[180px] text-center">
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {viewMode === "estacao" && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, -3))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[180px] text-center">
                    {getSeasonName()} {getYear(selectedMonth)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, 3))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {viewMode === "anual" && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedYear(selectedYear - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[100px] text-center">
                    {selectedYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedYear(selectedYear + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Calendars - Vertical layout */}
              <div className={`flex flex-col gap-6 items-center ${
                viewMode === "anual" ? "max-h-[600px] overflow-y-auto pr-2" : ""
              }`}>
                {monthsToDisplay.map((month, index) => (
                  <div key={index} className="flex flex-col items-center w-full max-w-[320px]">
                    {viewMode !== "mensal" && (
                      <h3 className="text-sm font-medium mb-2 capitalize">
                        {format(month, "MMMM yyyy", { locale: ptBR })}
                      </h3>
                    )}
                    <Calendar
                      mode="single"
                      selected={undefined}
                      onSelect={(date) => date && handleDateClick(date)}
                      month={month}
                      locale={ptBR}
                      className="rounded-md border pointer-events-auto w-full"
                      modifiers={{
                        occupied: datasOcupadas,
                        blocked: datasBloqueadas,
                        available: datasDisponiveis,
                      }}
                      modifiersClassNames={{
                        occupied: "bg-destructive/20 text-destructive font-semibold cursor-not-allowed",
                        blocked: "bg-warning/20 text-warning font-semibold hover:bg-warning/30 cursor-pointer",
                        available: "bg-success/20 text-success font-semibold hover:bg-success/30 cursor-pointer",
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      showOutsideDays={false}
                    />
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/30" />
                  <span className="text-muted-foreground">Evento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning/20 border border-warning/30" />
                  <span className="text-muted-foreground">Bloqueado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success/20 border border-success/30" />
                  <span className="text-muted-foreground">Disponível</span>
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <List className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold">
                  Eventos {viewMode === "mensal" ? `em ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}` : viewMode === "estacao" ? `- ${getSeasonName()} ${getYear(selectedMonth)}` : `de ${selectedYear}`}
                </h2>
              </div>

              {eventosNoPeriodo.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum evento confirmado neste período
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Convidados</TableHead>
                      <TableHead>Pacote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventosNoPeriodo.map((evento) => (
                      <TableRow key={evento.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(evento.date)}</span>
                            <span className="text-xs text-muted-foreground">
                              {getDayOfWeek(evento.date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{evento.clientName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {evento.guestCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {evento.pacote}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Blocked Dates List */}
            {bloqueadasNoPeriodo.length > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <Ban className="h-5 w-5 text-warning" />
                  <h2 className="text-lg font-display font-semibold">
                    Datas Bloqueadas {viewMode === "mensal" ? `em ${format(selectedMonth, "MMMM", { locale: ptBR })}` : viewMode === "estacao" ? `- ${getSeasonName()}` : `de ${selectedYear}`}
                  </h2>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="w-16">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bloqueadasNoPeriodo.map((blocked) => (
                      <TableRow key={blocked.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(blocked.date)}</span>
                            <span className="text-xs text-muted-foreground">
                              {getDayOfWeek(blocked.date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{blocked.reason}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(blocked)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {/* Period Stats */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <h3 className="font-display font-semibold mb-4">
                Resumo {viewMode === "mensal" ? "do Mês" : viewMode === "estacao" ? "da Estação" : "do Ano"}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <span className="text-sm font-medium">Eventos</span>
                  <span className="text-2xl font-bold text-destructive">
                    {eventosNoPeriodo.length}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <span className="text-sm font-medium">Bloqueados</span>
                  <span className="text-2xl font-bold text-warning">
                    {bloqueadasNoPeriodo.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <span className="text-sm font-medium">Disponíveis</span>
                  <span className="text-2xl font-bold text-success">
                    {datasDisponiveis.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Available Dates List */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-slide-up">
              <h3 className="font-display font-semibold mb-4">
                Próximas Datas Disponíveis
              </h3>
              
              {datasDisponiveis.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Sem datas disponíveis neste mês
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {datasDisponiveis.slice(0, 10).map((date, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className="w-full flex justify-between items-center p-2 bg-success/5 rounded border border-success/10 hover:bg-success/15 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium">
                        {format(date, "dd/MM", { locale: ptBR })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {date.getDay() === 6 ? "Sáb" : "Dom"}
                        </Badge>
                        <FileText className="h-3 w-3 text-success" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Blocked Date Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Data</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input
                placeholder="Ex: Feriado, Manutenção, Evento privado..."
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gold"
              onClick={handleAddBlockedDate}
              disabled={!newBlockedDate || !newBlockedReason.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear Data</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desbloquear a data{" "}
              <strong>{deleteTarget && formatDate(deleteTarget.date)}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Release Date Confirmation Dialog (from calendar click) */}
      <AlertDialog open={!!releaseTarget} onOpenChange={() => setReleaseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liberar Data</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja liberar a data{" "}
              <strong>{releaseTarget && formatDate(releaseTarget.date)}</strong>?
              <br />
              <span className="text-muted-foreground">
                Motivo do bloqueio: {releaseTarget?.reason}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRelease} className="bg-success hover:bg-success/90">
              Liberar Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Create Quote Dialog */}
      <AlertDialog open={!!quoteTarget} onOpenChange={() => setQuoteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja criar um novo orçamento para{" "}
              <strong>{quoteTarget && format(quoteTarget, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>?
              <br />
              <span className="text-muted-foreground">
                {quoteTarget && (quoteTarget.getDay() === 6 ? "Sábado" : "Domingo")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmQuote}>
              Criar Orçamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Date from Calendar Dialog */}
      <Dialog open={!!blockFromCalendar} onOpenChange={() => {
        setBlockFromCalendar(null);
        setBlockFromCalendarReason("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Data</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Bloquear <strong>{blockFromCalendar && format(blockFromCalendar, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
            </p>
            <div>
              <Label>Motivo</Label>
              <Input
                placeholder="Ex: Feriado, Manutenção, Evento privado..."
                value={blockFromCalendarReason}
                onChange={(e) => setBlockFromCalendarReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBlockFromCalendar(null);
              setBlockFromCalendarReason("");
            }}>
              Cancelar
            </Button>
            <Button
              variant="gold"
              onClick={handleBlockFromCalendar}
              disabled={!blockFromCalendarReason.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Options Dialog (Block or Make Available) */}
      <Dialog open={!!dateOptionsTarget} onOpenChange={() => setDateOptionsTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>O que deseja fazer?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Data selecionada: <strong>{dateOptionsTarget && format(dateOptionsTarget, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
            </p>
            
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="justify-start h-auto py-3 border-warning/50 hover:bg-warning/10"
                onClick={handleChooseBlock}
              >
                <Ban className="h-5 w-5 mr-3 text-warning" />
                <div className="text-left">
                  <div className="font-medium">Bloquear Data</div>
                  <div className="text-xs text-muted-foreground">Impedir eventos nesta data</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="justify-start h-auto py-3 border-success/50 hover:bg-success/10"
                onClick={handleChooseAvailable}
              >
                <FileText className="h-5 w-5 mr-3 text-success" />
                <div className="text-left">
                  <div className="font-medium">Criar Orçamento</div>
                  <div className="text-xs text-muted-foreground">Abrir evento para esta data</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
