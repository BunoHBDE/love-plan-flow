import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, Phone, User, Plus, Search, ArrowUpDown, Filter, X, Users, Heart, Mail, Loader2, Trash2, Check } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useVisitsOptimized as useVisits, VisitInsert, Visit } from "@/hooks/useVisitsOptimized";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { DeleteVisitDialog } from "@/components/visits/DeleteVisitDialog";

const statusStyles = {
  confirmada: "bg-success/10 text-success border-success/20",
  agendado: "bg-warning/10 text-warning border-warning/20",
  agendada: "bg-warning/10 text-warning border-warning/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
  realizada: "bg-primary/10 text-primary border-primary/20",
};

const statusLabels: Record<string, string> = {
  confirmada: "Confirmada",
  agendado: "Agendada",
  agendada: "Agendada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};

type SortOption = "date" | "time" | "status" | "name";

export default function Visitas() {
  const { visits, loading, createVisit, updateVisit, updateVisitStatus, deleteVisit } = useVisits();
  const { clients, searchClients } = useClients();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["confirmada", "agendado"]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Client search for new visit
  const [clientSearch, setClientSearch] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // State para o agendamento em grade
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; horario: string } | null>(null);
  const [visitNotes, setVisitNotes] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [weddingDateStatus, setWeddingDateStatus] = useState<"defined" | "undefined">("undefined");
  const [weddingDate, setWeddingDate] = useState("");
  const [weddingMonth, setWeddingMonth] = useState("");
  const [weddingYear, setWeddingYear] = useState("");
  
  const [newVisit, setNewVisit] = useState({
    clientName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
    guestCount: "",
    weddingDateStatus: "undefined" as "defined" | "undefined",
    weddingDate: "",
    weddingMonthEstimate: "",
    weddingYearEstimate: "",
  });
  const [weddingDatePickerOpen, setWeddingDatePickerOpen] = useState(false);
  
  // Details dialog state
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editVisit, setEditVisit] = useState({
    clientName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
    guestCount: "",
    weddingDateStatus: "undefined" as "defined" | "undefined",
    weddingDate: "",
    weddingMonthEstimate: "",
    weddingYearEstimate: "",
  });
  const [originalEditVisit, setOriginalEditVisit] = useState("");
  const [editWeddingDatePickerOpen, setEditWeddingDatePickerOpen] = useState(false);
  
  // Unsaved changes confirmation dialog
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);

  // Delete dialog state
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);

  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

  // Funções para grade de agendamento
  const getDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDays();
  const horarios = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const isAvailable = (day: Date, horario: string) => {
    // Verificar se já existe agendamento nesse horário
    const dateStr = format(day, 'yyyy-MM-dd');
    const hasVisit = visits.some(visit => 
      visit.visit_date === dateStr && 
      visit.visit_time === horario &&
      visit.status !== 'cancelada'
    );
    return !hasVisit;
  };

  const formatDateGrid = (date: Date) => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      diaSemana: dias[date.getDay()],
      dia: date.getDate(),
      mes: format(date, 'MMM', { locale: ptBR })
    };
  };

  const handleSlotClick = (day: Date, horario: string) => {
    if (isAvailable(day, horario)) {
      setSelectedSlot({ day, horario });
    }
  };

  const filteredVisits = visits
    .filter((visit) => {
      const clientName = visit.client?.nome || "";
      const clientEmail = visit.client?.email || "";
      const matchesSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(visit.status);
      const matchesDate = !dateFilter || visit.visit_date === format(dateFilter, "yyyy-MM-dd");
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime();
        case "time":
          return a.visit_time.localeCompare(b.visit_time);
        case "status":
          return a.status.localeCompare(b.status);
        case "name":
          return (a.client?.nome || "").localeCompare(b.client?.nome || "");
        default:
          return 0;
      }
    });

  const handleClientSearch = async (term: string) => {
    setClientSearch(term);
    if (term.length >= 2) {
      const results = await searchClients(term);
      setClientSearchResults(results);
    } else {
      setClientSearchResults([]);
    }
  };

  const selectClient = (client: any) => {
    setSelectedClientId(client.id);
    setNewVisit({
      ...newVisit,
      clientName: client.nome,
      email: client.email || "",
      phone: client.telefone || "",
    });
    setClientSearch(client.nome);
    setClientSearchResults([]);
  };

  const handleCreateVisit = async () => {
    if (!selectedSlot || !selectedClientId) {
      return;
    }

    const visitData: VisitInsert = {
      client_id: selectedClientId,
      visit_date: format(selectedSlot.day, 'yyyy-MM-dd'),
      visit_time: selectedSlot.horario,
      notes: visitNotes || null,
      guest_count: guestCount ? parseInt(guestCount) : null,
      wedding_date_status: weddingDateStatus === "defined" ? "com_data" : "sem_data",
      wedding_date: weddingDate || null,
      wedding_month: weddingMonth || null,
      wedding_year: weddingYear || null,
      status: "agendado",
    };

    const result = await createVisit(visitData);
    if (result) {
      // Reset form
      setSelectedSlot(null);
      setVisitNotes("");
      setGuestCount("");
      setWeddingDateStatus("undefined");
      setWeddingDate("");
      setWeddingMonth("");
      setWeddingYear("");
      setSelectedClientId(null);
      setClientSearch("");
      setIsDialogOpen(false);
    }
  };

  const handleOpenDetails = (visit: any) => {
    setSelectedVisit(visit);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = () => {
    if (!selectedVisit) return;
    setEditVisit({
      clientName: selectedVisit.client?.nome || "",
      email: selectedVisit.client?.email || "",
      phone: selectedVisit.client?.telefone || "",
      date: selectedVisit.visit_date,
      time: selectedVisit.visit_time,
      notes: selectedVisit.notes || "",
      guestCount: selectedVisit.guest_count?.toString() || "",
      weddingDateStatus: selectedVisit.wedding_date_status === "com_data" ? "defined" : "undefined",
      weddingDate: selectedVisit.wedding_date || "",
      weddingMonthEstimate: selectedVisit.wedding_month || "",
      weddingYearEstimate: selectedVisit.wedding_year || "",
    });
    setOriginalEditVisit(JSON.stringify({
      date: selectedVisit.visit_date,
      time: selectedVisit.visit_time,
      notes: selectedVisit.notes || "",
      guestCount: selectedVisit.guest_count?.toString() || "",
      weddingDateStatus: selectedVisit.wedding_date_status === "com_data" ? "defined" : "undefined",
      weddingDate: selectedVisit.wedding_date || "",
      weddingMonthEstimate: selectedVisit.wedding_month || "",
      weddingYearEstimate: selectedVisit.wedding_year || "",
    }));
    setIsDetailsOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    const currentEditData = JSON.stringify({
      date: editVisit.date,
      time: editVisit.time,
      notes: editVisit.notes,
      guestCount: editVisit.guestCount,
      weddingDateStatus: editVisit.weddingDateStatus,
      weddingDate: editVisit.weddingDate,
      weddingMonthEstimate: editVisit.weddingMonthEstimate,
      weddingYearEstimate: editVisit.weddingYearEstimate,
    });

    if (currentEditData !== originalEditVisit) {
      setIsUnsavedDialogOpen(true);
    } else {
      setIsEditDialogOpen(false);
    }
  };

  const handleBackToEdit = () => {
    setIsUnsavedDialogOpen(false);
  };

  const handleDiscardChanges = () => {
    setIsUnsavedDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleSaveAndClose = async () => {
    await handleSaveEdit();
    setIsUnsavedDialogOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedVisit) return;

    const updates: Partial<VisitInsert> = {
      visit_date: editVisit.date,
      visit_time: editVisit.time,
      notes: editVisit.notes || null,
      guest_count: editVisit.guestCount ? parseInt(editVisit.guestCount) : null,
      wedding_date_status: editVisit.weddingDateStatus === "defined" ? "com_data" : "sem_data",
      wedding_date: editVisit.weddingDate || null,
      wedding_month: editVisit.weddingMonthEstimate || null,
      wedding_year: editVisit.weddingYearEstimate || null,
    };

    const success = await updateVisit(selectedVisit.id, updates);
    if (success) {
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteVisit = async () => {
    if (deletingVisit) {
      await deleteVisit(deletingVisit.id);
      setDeletingVisit(null);
    }
  };

  const getWeddingDateDisplay = (visit: any) => {
    if (visit.wedding_date_status === "com_data" && visit.wedding_date) {
      return new Date(visit.wedding_date).toLocaleDateString("pt-BR");
    }
    if (visit.wedding_month || visit.wedding_year) {
      const monthLabel = months.find(m => m.value === visit.wedding_month)?.label || "";
      return `Previsão: ${monthLabel} ${visit.wedding_year || ""}`.trim();
    }
    return "Data não definida";
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Visitas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as visitas agendadas ao seu espaço
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="h-5 w-5" />
                Agendar Visita
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Agendar Nova Visita
                </DialogTitle>
                <DialogDescription>
                  Selecione o cliente, dia e horário desejado.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Seleção de Cliente */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Cliente *</Label>
                  </div>
                  
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onChange={(e) => handleClientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {clientSearchResults.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                      {clientSearchResults.map((client: any) => (
                        <button
                          key={client.id}
                          onClick={() => selectClient(client)}
                          className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors"
                        >
                          <div className="font-medium">{client.nome}</div>
                          {client.telefone && (
                            <div className="text-sm text-muted-foreground">{client.telefone}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedClientId && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Cliente selecionado</span>
                    </div>
                  )}
                </div>

                {/* Grade de Horários */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Selecione Data e Horário *</Label>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        <div className="grid gap-1 p-2" style={{ gridTemplateColumns: `80px repeat(${days.length}, minmax(90px, 1fr))` }}>
                          {/* Header - Dias */}
                          <div className="p-2"></div>
                          {days.map((day, idx) => {
                            const { diaSemana, dia, mes } = formatDateGrid(day);
                            const isToday = idx === 0;
                            return (
                              <div
                                key={idx}
                                className={`text-center p-2 rounded-t ${
                                  isToday ? 'bg-gold/10 border-2 border-gold' : 'bg-muted'
                                }`}
                              >
                                <div className={`text-xs font-semibold ${isToday ? 'text-gold' : 'text-muted-foreground'}`}>
                                  {diaSemana}
                                </div>
                                <div className={`text-lg font-bold ${isToday ? 'text-gold' : 'text-foreground'}`}>
                                  {dia}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">{mes}</div>
                              </div>
                            );
                          })}

                          {/* Linhas de Horários */}
                          {horarios.map((horario, hIdx) => (
                            <React.Fragment key={hIdx}>
                              {/* Coluna de Horário */}
                              <div className="flex items-center justify-center bg-muted rounded p-2 text-sm font-semibold text-foreground">
                                {horario}
                              </div>

                              {/* Células de Agendamento */}
                              {days.map((day, dIdx) => {
                                const available = isAvailable(day, horario);
                                const isSelected = selectedSlot?.day.getTime() === day.getTime() && selectedSlot?.horario === horario;

                                return (
                                  <button
                                    key={dIdx}
                                    onClick={() => handleSlotClick(day, horario)}
                                    disabled={!available}
                                    className={`p-3 rounded transition-all duration-200 border ${
                                      isSelected
                                        ? 'bg-gold border-gold text-white shadow-md scale-105'
                                        : available
                                        ? 'bg-white border-border hover:border-gold hover:bg-gold/5 hover:scale-105'
                                        : 'bg-muted border-border cursor-not-allowed opacity-40'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <Check className="w-4 h-4 mx-auto" />
                                    ) : available ? (
                                      <div className="w-4 h-4 mx-auto rounded-full border-2 border-muted-foreground/30"></div>
                                    ) : (
                                      <X className="w-4 h-4 mx-auto text-muted-foreground" />
                                    )}
                                  </button>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legenda */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-white border border-border rounded"></div>
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-gold rounded"></div>
                      <span>Selecionado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-muted border border-border rounded opacity-40"></div>
                      <span>Indisponível</span>
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                {selectedSlot && selectedClientId && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gold" />
                        <span className="font-semibold">
                          {format(selectedSlot.day, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedSlot.horario}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="guestCount">Número de Convidados</Label>
                        <Input
                          id="guestCount"
                          type="number"
                          min="1"
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                          placeholder="Ex: 150"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Data do Casamento</Label>
                        <Select value={weddingDateStatus} onValueChange={(val: "defined" | "undefined") => setWeddingDateStatus(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="undefined">Ainda não definida</SelectItem>
                            <SelectItem value="defined">Já tenho a data</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {weddingDateStatus === "defined" ? (
                        <div className="grid gap-2">
                          <Label htmlFor="weddingDate">Data do Casamento</Label>
                          <Input
                            id="weddingDate"
                            type="date"
                            value={weddingDate}
                            onChange={(e) => setWeddingDate(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Mês Previsto</Label>
                            <Select value={weddingMonth} onValueChange={setWeddingMonth}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                            <Label>Ano Previsto</Label>
                            <Select value={weddingYear} onValueChange={setWeddingYear}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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

                      <div className="grid gap-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Input
                          id="notes"
                          value={visitNotes}
                          onChange={(e) => setVisitNotes(e.target.value)}
                          placeholder="Anotações sobre a visita..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="gold" 
                  onClick={handleCreateVisit}
                  disabled={!selectedSlot || !selectedClientId}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Agendamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Status filter buttons */}
            <div className="flex flex-wrap gap-2">
              {(["confirmada", "agendado", "realizada", "cancelada"] as const).map((status) => {
                const isSelected = statusFilter.includes(status);
                const selectedStyles: Record<string, string> = {
                  confirmada: "bg-success text-success-foreground hover:bg-success/90 border-success",
                  agendado: "bg-warning text-warning-foreground hover:bg-warning/90 border-warning",
                  realizada: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
                  cancelada: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive",
                };
                return (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "transition-all",
                      isSelected && selectedStyles[status]
                    )}
                    onClick={() => {
                      setStatusFilter((prev) =>
                        prev.includes(status)
                          ? prev.filter((s) => s !== status)
                          : [...prev, status]
                      );
                    }}
                  >
                    {statusLabels[status]}
                  </Button>
                );
              })}
            </div>

            {/* Date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "min-w-[140px] justify-start",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {/* Clear filters */}
            {(statusFilter.length > 0 || dateFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter([]);
                  setDateFilter(undefined);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Ordenar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  Por Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("time")}>
                  Por Horário
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("status")}>
                  Por Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Por Nome
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Visits List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {filteredVisits.map((visit) => (
              <div
                key={visit.id}
                className="bg-card rounded-xl p-6 shadow-soft border border-border transition-all duration-200 hover:shadow-medium"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne flex-shrink-0">
                      <User className="h-6 w-6 text-gold" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">
                        {visit.client?.nome || "Cliente não vinculado"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(visit.visit_date).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {visit.visit_time}
                        </span>
                        {visit.client?.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {visit.client.telefone}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-gold" />
                          {getWeddingDateDisplay(visit)}
                        </span>
                        {visit.guest_count && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {visit.guest_count} convidados
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "capitalize border",
                            statusStyles[visit.status as keyof typeof statusStyles] || statusStyles.agendado
                          )}
                        >
                          {statusLabels[visit.status] || visit.status}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(["agendado", "confirmada", "realizada", "cancelada"] as const).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => updateVisitStatus(visit.id, status)}
                            className="capitalize"
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                status === "confirmada" ? "bg-success" :
                                status === "agendado" ? "bg-warning" :
                                status === "realizada" ? "bg-primary" :
                                "bg-destructive"
                              }`}
                            />
                            {statusLabels[status]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="elegant" size="sm" onClick={() => handleOpenDetails(visit)}>
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredVisits.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma visita encontrada</p>
              </div>
            )}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Detalhes da Visita
              </DialogTitle>
            </DialogHeader>

            {selectedVisit && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-champagne">
                    <User className="h-8 w-8 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedVisit.client?.nome || "Sem cliente"}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1 ${statusStyles[selectedVisit.status as keyof typeof statusStyles] || statusStyles.agendado}`}>
                      {statusLabels[selectedVisit.status] || selectedVisit.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                  {selectedVisit.client?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedVisit.client.email}</span>
                    </div>
                  )}
                  {selectedVisit.client?.telefone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedVisit.client.telefone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {new Date(selectedVisit.visit_date).toLocaleDateString("pt-BR")} às {selectedVisit.visit_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-gold" />
                    <span className="text-foreground">{getWeddingDateDisplay(selectedVisit)}</span>
                  </div>
                  {selectedVisit.guest_count && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gold" />
                      <span className="text-foreground">{selectedVisit.guest_count} convidados</span>
                    </div>
                  )}
                </div>

                {selectedVisit.notes && (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <Label className="text-sm text-muted-foreground mb-2 block">Observações</Label>
                    <p className="text-foreground">{selectedVisit.notes}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsDetailsOpen(false);
                  setDeletingVisit(selectedVisit);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <div className="flex gap-2 sm:ml-auto">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Fechar
                </Button>
                <Button variant="gold" onClick={handleOpenEdit}>
                  Editar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEdit}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Editar Visita
              </DialogTitle>
              <DialogDescription>
                Atualize os dados da visita.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editDate">Data *</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={editVisit.date}
                    onChange={(e) =>
                      setEditVisit({ ...editVisit, date: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editTime">Horário *</Label>
                  <Input
                    id="editTime"
                    type="time"
                    value={editVisit.time}
                    onChange={(e) =>
                      setEditVisit({ ...editVisit, time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editGuestCount">Número de Convidados</Label>
                <Input
                  id="editGuestCount"
                  type="number"
                  min="1"
                  value={editVisit.guestCount}
                  onChange={(e) =>
                    setEditVisit({ ...editVisit, guestCount: e.target.value })
                  }
                  placeholder="Ex: 150"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editNotes">Observações</Label>
                <Input
                  id="editNotes"
                  value={editVisit.notes}
                  onChange={(e) =>
                    setEditVisit({ ...editVisit, notes: e.target.value })
                  }
                  placeholder="Anotações sobre a visita..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseEdit}>
                Cancelar
              </Button>
              <Button variant="gold" onClick={handleSaveEdit}>
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={isUnsavedDialogOpen} onOpenChange={setIsUnsavedDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem alterações não salvas. O que deseja fazer?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleBackToEdit}>
                Voltar e Editar
              </Button>
              <Button variant="outline" onClick={handleDiscardChanges}>
                Descartar
              </Button>
              <Button variant="gold" onClick={handleSaveAndClose}>
                Salvar e Fechar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Visit Dialog */}
        <DeleteVisitDialog
          open={!!deletingVisit}
          onOpenChange={(open) => !open && setDeletingVisit(null)}
          visit={deletingVisit}
          onConfirm={handleDeleteVisit}
        />
      </div>
    </MainLayout>
  );
}