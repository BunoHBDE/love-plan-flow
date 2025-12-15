import { useState } from "react";
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
import { Calendar, Clock, Phone, User, Plus, Search, ArrowUpDown, Filter, X, Users, Heart, Mail, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useVisits, VisitInsert, Visit } from "@/hooks/useVisits";
import { useClients } from "@/hooks/useClients";
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
    if (!newVisit.date || !newVisit.time) {
      return;
    }

    const visitData: VisitInsert = {
      client_id: selectedClientId,
      visit_date: newVisit.date,
      visit_time: newVisit.time,
      notes: newVisit.notes || null,
      guest_count: newVisit.guestCount ? parseInt(newVisit.guestCount) : null,
      wedding_date_status: newVisit.weddingDateStatus === "defined" ? "com_data" : "sem_data",
      wedding_date: newVisit.weddingDate || null,
      wedding_month: newVisit.weddingMonthEstimate || null,
      wedding_year: newVisit.weddingYearEstimate || null,
      status: "agendado",
    };

    const result = await createVisit(visitData);
    if (result) {
      setNewVisit({
        clientName: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        notes: "",
        guestCount: "",
        weddingDateStatus: "undefined",
        weddingDate: "",
        weddingMonthEstimate: "",
        weddingYearEstimate: "",
      });
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
    }));
    setIsDetailsOpen(false);
    setIsEditDialogOpen(true);
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(editVisit) !== originalEditVisit;
  };

  const handleSaveEdit = async () => {
    if (!selectedVisit) return;
    
    if (!editVisit.date || !editVisit.time) {
      return;
    }

    const updates = {
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
      setSelectedVisit(null);
    }
  };

  const handleCloseEdit = () => {
    if (hasUnsavedChanges()) {
      setIsUnsavedDialogOpen(true);
    } else {
      setIsEditDialogOpen(false);
    }
  };

  const handleDiscardChanges = () => {
    setIsUnsavedDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleSaveAndClose = () => {
    handleSaveEdit();
    setIsUnsavedDialogOpen(false);
  };

  const handleBackToEdit = () => {
    setIsUnsavedDialogOpen(false);
  };

  const handleStatusChange = async (visitId: string, newStatus: string) => {
    await updateVisitStatus(visitId, newStatus);
  };

  const handleDeleteVisit = async () => {
    if (!deletingVisit) return;
    await deleteVisit(deletingVisit.id);
    setDeletingVisit(null);
  };

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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Agendar Nova Visita
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados para agendar uma visita ao espaço.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Client Search */}
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <div className="relative">
                    <Input
                      value={clientSearch}
                      onChange={(e) => handleClientSearch(e.target.value)}
                      placeholder="Buscar cliente existente..."
                    />
                    {clientSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {clientSearchResults.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => selectClient(client)}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                          >
                            <div className="font-medium">{client.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.telefone} {client.email && `• ${client.email}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedClientId && (
                    <p className="text-sm text-success">Cliente selecionado: {newVisit.clientName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newVisit.date}
                      onChange={(e) =>
                        setNewVisit({ ...newVisit, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newVisit.time}
                      onChange={(e) =>
                        setNewVisit({ ...newVisit, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Guest Count */}
                <div className="grid gap-2">
                  <Label htmlFor="guestCount">Número de Convidados</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    min="1"
                    value={newVisit.guestCount}
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, guestCount: e.target.value })
                    }
                    placeholder="Ex: 150"
                  />
                </div>

                {/* Wedding Date Section */}
                <div className="grid gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                  <Label className="font-medium">Data do Casamento</Label>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="weddingDateStatus"
                        checked={newVisit.weddingDateStatus === "defined"}
                        onChange={() =>
                          setNewVisit({ ...newVisit, weddingDateStatus: "defined", weddingMonthEstimate: "", weddingYearEstimate: "" })
                        }
                        className="accent-primary"
                      />
                      <span className="text-sm">Data já definida</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="weddingDateStatus"
                        checked={newVisit.weddingDateStatus === "undefined"}
                        onChange={() =>
                          setNewVisit({ ...newVisit, weddingDateStatus: "undefined", weddingDate: "" })
                        }
                        className="accent-primary"
                      />
                      <span className="text-sm">Ainda sem data definida</span>
                    </label>
                  </div>

                  {newVisit.weddingDateStatus === "defined" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="weddingDate">Data do Casamento *</Label>
                      <Popover open={weddingDatePickerOpen} onOpenChange={setWeddingDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !newVisit.weddingDate && "text-muted-foreground"
                            )}
                          >
                            <Heart className="mr-2 h-4 w-4" />
                            {newVisit.weddingDate
                              ? format(new Date(newVisit.weddingDate), "dd/MM/yyyy", { locale: ptBR })
                              : "Selecione a data do casamento"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newVisit.weddingDate ? new Date(newVisit.weddingDate) : undefined}
                            onSelect={(date) => {
                              setNewVisit({ ...newVisit, weddingDate: date ? format(date, "yyyy-MM-dd") : "" });
                              setWeddingDatePickerOpen(false);
                            }}
                            initialFocus
                            locale={ptBR}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Mês Previsto (opcional)</Label>
                        <Select
                          value={newVisit.weddingMonthEstimate}
                          onValueChange={(value) =>
                            setNewVisit({ ...newVisit, weddingMonthEstimate: value })
                          }
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
                        <Label>Ano Previsto (opcional)</Label>
                        <Select
                          value={newVisit.weddingYearEstimate}
                          onValueChange={(value) =>
                            setNewVisit({ ...newVisit, weddingYearEstimate: value })
                          }
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={newVisit.notes}
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, notes: e.target.value })
                    }
                    placeholder="Anotações sobre a visita..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="gold" onClick={handleCreateVisit}>
                  Agendar Visita
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
                  onClick={() => {
                    if (isSelected) {
                      setStatusFilter(statusFilter.filter((s) => s !== status));
                    } else {
                      setStatusFilter([...statusFilter, status]);
                    }
                  }}
                  className={cn(
                    "transition-all",
                    isSelected && selectedStyles[status]
                  )}
                >
                  {statusLabels[status]}
                </Button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search by name */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar por data"}
                  {dateFilter && (
                    <X
                      className="ml-auto h-4 w-4 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDateFilter(undefined);
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="time">Horário</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Visits Grid */}
        {!loading && (
          <div className="grid gap-4 animate-slide-up">
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
                            <Users className="h-4 w-4 text-gold" />
                            {visit.guest_count} convidados
                          </span>
                        )}
                      </div>
                      {visit.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {visit.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all hover:opacity-80 ${
                            statusStyles[visit.status as keyof typeof statusStyles] || statusStyles.agendado
                          }`}
                        >
                          {statusLabels[visit.status] || visit.status}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card">
                        {(["confirmada", "agendado", "realizada", "cancelada"] as const).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(visit.id, status)}
                            className={cn(
                              "cursor-pointer",
                              visit.status === status && "font-semibold"
                            )}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              status === "confirmada" ? "bg-success" :
                              status === "agendado" ? "bg-warning" :
                              status === "realizada" ? "bg-primary" :
                              "bg-destructive"
                            }`} />
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

              {/* Guest Count */}
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

              {/* Wedding Date Section */}
              <div className="grid gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                <Label className="font-medium">Data do Casamento</Label>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editWeddingDateStatus"
                      checked={editVisit.weddingDateStatus === "defined"}
                      onChange={() =>
                        setEditVisit({ ...editVisit, weddingDateStatus: "defined", weddingMonthEstimate: "", weddingYearEstimate: "" })
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm">Data já definida</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editWeddingDateStatus"
                      checked={editVisit.weddingDateStatus === "undefined"}
                      onChange={() =>
                        setEditVisit({ ...editVisit, weddingDateStatus: "undefined", weddingDate: "" })
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm">Ainda sem data definida</span>
                  </label>
                </div>

                {editVisit.weddingDateStatus === "defined" ? (
                  <div className="grid gap-2">
                    <Label>Data do Casamento *</Label>
                    <Popover open={editWeddingDatePickerOpen} onOpenChange={setEditWeddingDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !editVisit.weddingDate && "text-muted-foreground"
                          )}
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          {editVisit.weddingDate
                            ? format(new Date(editVisit.weddingDate), "dd/MM/yyyy", { locale: ptBR })
                            : "Selecione a data do casamento"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editVisit.weddingDate ? new Date(editVisit.weddingDate) : undefined}
                          onSelect={(date) => {
                            setEditVisit({ ...editVisit, weddingDate: date ? format(date, "yyyy-MM-dd") : "" });
                            setEditWeddingDatePickerOpen(false);
                          }}
                          initialFocus
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Mês Previsto (opcional)</Label>
                      <Select
                        value={editVisit.weddingMonthEstimate}
                        onValueChange={(value) =>
                          setEditVisit({ ...editVisit, weddingMonthEstimate: value })
                        }
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
                      <Label>Ano Previsto (opcional)</Label>
                      <Select
                        value={editVisit.weddingYearEstimate}
                        onValueChange={(value) =>
                          setEditVisit({ ...editVisit, weddingYearEstimate: value })
                        }
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
