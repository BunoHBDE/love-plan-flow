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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  Plus, 
  Search, 
  ArrowUpDown, 
  Filter, 
  X, 
  Users, 
  Heart, 
  Mail, 
  Loader2, 
  Trash2,
  LayoutList,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useVisitsOptimized as useVisits, VisitInsert, Visit } from "@/hooks/useVisitsOptimized";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { DeleteVisitDialog } from "@/components/visits/DeleteVisitDialog";
import { useToast } from "@/hooks/use-toast";

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
type ViewMode = "table" | "calendar";

export default function Visitas() {
  const { visits, loading, createVisit, updateVisit, updateVisitStatus, deleteVisit } = useVisits();
  const { clients, searchClients, createClient } = useClients();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["confirmada", "agendado"]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Calendar view state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
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

  // Função para formatar data corretamente (evita problema de timezone)
  const formatDateLocal = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("pt-BR");
  };

  // Função para formatar telefone (00) 00000-0000
  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numbers.length <= 10) {
      // Formato: (00) 0000-0000
      return numbers.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
    } else {
      // Formato: (00) 00000-0000
      return numbers.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
    }
  };

  // Função para obter nome do visitante (cliente ou extrair das observações)
  const getVisitorName = (visit: any) => {
    if (visit.client?.nome) {
      return visit.client.nome;
    }
    // Tenta extrair das observações se começar com "VISITANTE:"
    if (visit.notes && visit.notes.startsWith('VISITANTE: ')) {
      const lines = visit.notes.split('\n');
      return lines[0].replace('VISITANTE: ', '');
    }
    return "Visitante sem identificação";
  };

  // Get week days for calendar view
  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const weekDays = getWeekDays();
  const horarios = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // Get visits for a specific day and time
  const getVisitsForSlot = (day: Date, time: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return visits.filter(visit => 
      visit.visit_date === dateStr && 
      visit.visit_time === time &&
      (statusFilter.length === 0 || statusFilter.includes(visit.status))
    );
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

  const clearClientSelection = () => {
    setSelectedClientId(null);
    setClientSearch("");
    setNewVisit({
      ...newVisit,
      clientName: "",
      email: "",
      phone: "",
    });
    setClientSearchResults([]);
  };

  const handleCreateVisit = async () => {
    // Validações com mensagens específicas
    if (!newVisit.clientName || newVisit.clientName.trim() === "") {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!newVisit.date) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione a data da visita.",
        variant: "destructive",
      });
      return;
    }

    if (!newVisit.time) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione o horário da visita.",
        variant: "destructive",
      });
      return;
    }

    let clientId = selectedClientId;

    // Se não selecionou um cliente existente E preencheu email ou telefone, cria um novo cliente
    if (!selectedClientId && newVisit.clientName && (newVisit.email || newVisit.phone)) {
      const newClientData = {
        nome: newVisit.clientName,
        email: newVisit.email || null,
        telefone: newVisit.phone || null,
        cpf: null,
        cep: null,
        rua: null,
        numero: null,
        complemento: null,
        bairro: null,
        cidade: null,
        estado_uf: null,
      };

      const createdClient = await createClient(newClientData);
      if (createdClient) {
        clientId = createdClient.id;
      } else {
        // Se falhar ao criar cliente, não continua
        return;
      }
    }
    // Se não preencheu email nem telefone, clientId fica null (visita sem cliente cadastrado)
    // Neste caso, adiciona o nome nas observações
    let notesWithClientName = newVisit.notes || "";
    if (!clientId && newVisit.clientName) {
      notesWithClientName = `VISITANTE: ${newVisit.clientName}${newVisit.notes ? '\n\n' + newVisit.notes : ''}`;
    }

    const visitData: VisitInsert = {
      client_id: clientId,
      visit_date: newVisit.date,
      visit_time: newVisit.time,
      notes: notesWithClientName || null,
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
    
    // Obtém o nome do visitante (cliente ou das observações)
    const visitorName = getVisitorName(selectedVisit);
    
    setEditVisit({
      clientName: visitorName,
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
      clientName: visitorName,
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
      clientName: editVisit.clientName,
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

    // Validações
    if (!editVisit.clientName || editVisit.clientName.trim() === "") {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome do cliente/visitante.",
        variant: "destructive",
      });
      return;
    }

    if (!editVisit.date) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione a data da visita.",
        variant: "destructive",
      });
      return;
    }

    if (!editVisit.time) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione o horário da visita.",
        variant: "destructive",
      });
      return;
    }

    // Se é visitante (sem client_id), atualiza o nome nas observações
    let updatedNotes = editVisit.notes || "";
    if (!selectedVisit.client_id) {
      // Remove o nome antigo das observações se existir
      if (selectedVisit.notes && selectedVisit.notes.startsWith('VISITANTE: ')) {
        const oldNotes = selectedVisit.notes.split('\n\n').slice(1).join('\n\n');
        updatedNotes = oldNotes;
      }
      // Adiciona o novo nome
      updatedNotes = `VISITANTE: ${editVisit.clientName}${updatedNotes ? '\n\n' + updatedNotes : ''}`;
    }

    const updates: Partial<VisitInsert> = {
      visit_date: editVisit.date,
      visit_time: editVisit.time,
      notes: updatedNotes || null,
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
      return formatDateLocal(visit.wedding_date);
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
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Visitas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie as visitas agendadas ao seu espaço
              </p>
            </div>

            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="gap-2"
                >
                  <LayoutList className="h-4 w-4" />
                  <span className="hidden sm:inline">Tabela</span>
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className="gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </Button>
              </div>

              {/* Settings Button */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Settings className="h-5 w-5" />
                    <span className="hidden sm:inline ml-2">Configurações</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">
                      Configurações de Visitas
                    </DialogTitle>
                    <DialogDescription>
                      Configure as preferências para agendamento de visitas.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Horários de Atendimento</Label>
                      <p className="text-sm text-muted-foreground">
                        Configure os horários disponíveis para agendamento
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <Label className="text-sm">Horário Inicial</Label>
                          <Select defaultValue="08:00">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['08:00', '09:00', '10:00'].map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Horário Final</Label>
                          <Select defaultValue="19:00">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['17:00', '18:00', '19:00', '20:00'].map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Duração Padrão</Label>
                      <Select defaultValue="60">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="90">1h 30min</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Notificações</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-normal">Lembrete 24h antes</Label>
                          <input type="checkbox" defaultChecked className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-normal">Lembrete 1h antes</Label>
                          <input type="checkbox" defaultChecked className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="gold" onClick={() => setIsSettingsOpen(false)}>
                      Salvar Configurações
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Action Bar - Agendar Visita moved here */}
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" size="lg" className="gap-2">
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
                    <Label>Cliente <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite o nome do cliente ou busque existente..."
                        value={clientSearch}
                        onChange={(e) => {
                          handleClientSearch(e.target.value);
                          setNewVisit({ ...newVisit, clientName: e.target.value });
                        }}
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
                      <p className="text-sm text-green-700">
                        ✓ Cliente cadastrado
                      </p>
                    ) : newVisit.clientName && (newVisit.email || newVisit.phone) ? (
                      <p className="text-sm text-blue-700">
                        ✓ Novo cliente
                      </p>
                    ) : null}
                  </div>

                  {/* Additional fields for non-registered clients */}
                  {!selectedClientId && newVisit.clientName && (
                    <div className="grid gap-4 p-4 bg-muted/30 rounded-lg border">
                      <p className="text-sm font-medium text-muted-foreground">
                        Informações de contato (opcional)
                      </p>
                      <div className="grid gap-2">
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          placeholder="email@exemplo.com"
                          value={newVisit.email}
                          onChange={(e) => setNewVisit({ ...newVisit, email: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="clientPhone">Telefone</Label>
                        <Input
                          id="clientPhone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={newVisit.phone}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setNewVisit({ ...newVisit, phone: formatted });
                          }}
                          maxLength={15}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Data <span className="text-destructive">*</span></Label>
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
                      <Label htmlFor="time">Horário <span className="text-destructive">*</span></Label>
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

                  <div className="grid gap-2">
                    <Label>Data do Casamento</Label>
                    <Select
                      value={newVisit.weddingDateStatus}
                      onValueChange={(value: "defined" | "undefined") =>
                        setNewVisit({ ...newVisit, weddingDateStatus: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undefined">Ainda não definida</SelectItem>
                        <SelectItem value="defined">Já tenho a data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newVisit.weddingDateStatus === "defined" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="weddingDate">Data do Casamento</Label>
                      <Popover open={weddingDatePickerOpen} onOpenChange={setWeddingDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !newVisit.weddingDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {newVisit.weddingDate ? format(new Date(newVisit.weddingDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
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
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros</span>
          </div>

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

            {viewMode === "table" && (
              <>
                <div className="relative min-w-[180px]">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={dateFilter ? format(dateFilter, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDateFilter(new Date(e.target.value + 'T12:00:00'));
                      } else {
                        setDateFilter(undefined);
                      }
                    }}
                    className="pl-10"
                    placeholder="Filtrar por data"
                  />
                </div>

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
              </>
            )}

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
          </div>
        </div>

        {/* Content - Table or Calendar View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW - Gestão e Controle */
          <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Casamento</TableHead>
                    <TableHead className="text-center">Convidados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-champagne flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gold" />
                          </div>
                          <div>
                            <div>{getVisitorName(visit)}</div>
                            {visit.client?.telefone && (
                              <div className="text-xs text-muted-foreground">{visit.client.telefone}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDateLocal(visit.visit_date)}
                      </TableCell>
                      <TableCell>{visit.visit_time}</TableCell>
                      <TableCell>
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
                          <DropdownMenuContent align="start">
                            {(["agendado", "confirmada", "realizada", "cancelada"] as const).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => updateVisitStatus(visit.id, status)}
                                className="capitalize"
                              >
                                <div className={`w-2 h-2 rounded-full mr-2 ${
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
                      </TableCell>
                      <TableCell className="text-sm">
                        {getWeddingDateDisplay(visit)}
                      </TableCell>
                      <TableCell className="text-center">
                        {visit.guest_count || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(visit)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVisits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma visita encontrada</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* CALENDAR VIEW - Planejamento Visual */
          <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up overflow-hidden">
            {/* Week Navigation */}
            <div className="flex items-center justify-between p-4 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold">
                {format(weekDays[0], "dd MMM", { locale: ptBR })} - {format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="grid" style={{ gridTemplateColumns: `100px repeat(7, minmax(140px, 1fr))` }}>
                  {/* Header - Days */}
                  <div className="sticky left-0 bg-card z-10 p-3 border-r border-b"></div>
                  {weekDays.map((day, idx) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "text-center p-3 border-b",
                          isToday && "bg-gold/10"
                        )}
                      >
                        <div className={cn(
                          "text-xs font-semibold uppercase",
                          isToday ? "text-gold" : "text-muted-foreground"
                        )}>
                          {format(day, "EEE", { locale: ptBR })}
                        </div>
                        <div className={cn(
                          "text-2xl font-bold mt-1",
                          isToday ? "text-gold" : "text-foreground"
                        )}>
                          {format(day, "dd")}
                        </div>
                      </div>
                    );
                  })}

                  {/* Time Slots */}
                  {horarios.map((horario, hIdx) => (
                    <React.Fragment key={hIdx}>
                      {/* Time Label */}
                      <div className="sticky left-0 bg-card z-10 flex items-center justify-center p-3 border-r border-b text-sm font-semibold text-muted-foreground">
                        {horario}
                      </div>

                      {/* Day Cells */}
                      {weekDays.map((day, dIdx) => {
                        const visitsInSlot = getVisitsForSlot(day, horario);

                        return (
                          <div
                            key={dIdx}
                            className={cn(
                              "min-h-[80px] p-2 border-b border-r",
                              isSameDay(day, new Date()) && "bg-gold/5"
                            )}
                          >
                            {visitsInSlot.map((visit) => (
                              <button
                                key={visit.id}
                                onClick={() => handleOpenDetails(visit)}
                                className={cn(
                                  "w-full text-left p-2 rounded mb-1 text-xs transition-all hover:scale-105",
                                  statusStyles[visit.status as keyof typeof statusStyles] || statusStyles.agendado
                                )}
                              >
                                <div className="font-semibold truncate">
                                  {getVisitorName(visit)}
                                </div>
                                <div className="text-[10px] opacity-75 capitalize">
                                  {statusLabels[visit.status]}
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
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
                    <h3 className="text-lg font-semibold text-foreground">{getVisitorName(selectedVisit)}</h3>
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
                      {formatDateLocal(selectedVisit.visit_date)} às {selectedVisit.visit_time}
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
                    <p className="text-foreground whitespace-pre-wrap">
                      {selectedVisit.notes.startsWith('VISITANTE: ') 
                        ? selectedVisit.notes.split('\n\n').slice(1).join('\n\n') 
                        : selectedVisit.notes}
                    </p>
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
              {/* Nome do Cliente/Visitante */}
              <div className="grid gap-2">
                <Label htmlFor="editClientName">Nome do Cliente/Visitante <span className="text-destructive">*</span></Label>
                <Input
                  id="editClientName"
                  value={editVisit.clientName}
                  onChange={(e) =>
                    setEditVisit({ ...editVisit, clientName: e.target.value })
                  }
                  placeholder="Nome do cliente ou visitante"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedVisit?.client_id ? "✓ Cliente cadastrado no sistema" : "Visitante sem cadastro"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editDate">Data <span className="text-destructive">*</span></Label>
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
                  <Label htmlFor="editTime">Horário <span className="text-destructive">*</span></Label>
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