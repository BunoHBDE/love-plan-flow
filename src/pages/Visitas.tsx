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
import { Calendar, Clock, Phone, User, Plus, Search, ArrowUpDown, Filter, X, Users, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Visit {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: "confirmada" | "agendada" | "cancelada" | "realizada";
  notes?: string;
  guestCount?: number;
  weddingDateStatus: "defined" | "undefined";
  weddingDate?: string;
  weddingMonthEstimate?: string;
  weddingYearEstimate?: string;
}

const initialVisits: Visit[] = [
  {
    id: "1",
    clientName: "Maria Silva",
    email: "maria@email.com",
    phone: "(11) 99999-0001",
    date: "2024-12-15",
    time: "14:00",
    status: "confirmada",
    notes: "Interessada em casamento para 80 convidados",
    guestCount: 80,
    weddingDateStatus: "defined",
    weddingDate: "2025-06-20",
  },
  {
    id: "2",
    clientName: "Ana Oliveira",
    email: "ana@email.com",
    phone: "(11) 99999-0002",
    date: "2024-12-16",
    time: "10:30",
    status: "agendada",
    guestCount: 150,
    weddingDateStatus: "undefined",
    weddingMonthEstimate: "03",
    weddingYearEstimate: "2025",
  },
  {
    id: "3",
    clientName: "Juliana Santos",
    email: "juliana@email.com",
    phone: "(11) 99999-0003",
    date: "2024-12-17",
    time: "16:00",
    status: "confirmada",
    notes: "Segunda visita - quer ver decoração",
    guestCount: 200,
    weddingDateStatus: "defined",
    weddingDate: "2025-09-15",
  },
  {
    id: "4",
    clientName: "Carla Costa",
    email: "carla@email.com",
    phone: "(11) 99999-0004",
    date: "2024-12-10",
    time: "11:00",
    status: "realizada",
    notes: "Muito interessada, aguardando orçamento",
    guestCount: 100,
    weddingDateStatus: "undefined",
  },
];

const statusStyles = {
  confirmada: "bg-success/10 text-success border-success/20",
  agendada: "bg-warning/10 text-warning border-warning/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
  realizada: "bg-primary/10 text-primary border-primary/20",
};

const statusLabels = {
  confirmada: "Confirmada",
  agendada: "Agendada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};

type SortOption = "date" | "time" | "status" | "name";

export default function Visitas() {
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["confirmada", "agendada"]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const { toast } = useToast();

  const filteredVisits = visits
    .filter((visit) => {
      const matchesSearch =
        visit.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(visit.status);
      const matchesDate = !dateFilter || visit.date === format(dateFilter, "yyyy-MM-dd");
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "time":
          return a.time.localeCompare(b.time);
        case "status":
          return a.status.localeCompare(b.status);
        case "name":
          return a.clientName.localeCompare(b.clientName);
        default:
          return 0;
      }
    });

  const handleCreateVisit = () => {
    if (!newVisit.clientName || !newVisit.date || !newVisit.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome, data e horário.",
        variant: "destructive",
      });
      return;
    }

    if (newVisit.weddingDateStatus === "defined" && !newVisit.weddingDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, informe a data do casamento.",
        variant: "destructive",
      });
      return;
    }

    const visit: Visit = {
      id: Date.now().toString(),
      clientName: newVisit.clientName,
      email: newVisit.email,
      phone: newVisit.phone,
      date: newVisit.date,
      time: newVisit.time,
      notes: newVisit.notes,
      guestCount: newVisit.guestCount ? parseInt(newVisit.guestCount) : undefined,
      weddingDateStatus: newVisit.weddingDateStatus,
      weddingDate: newVisit.weddingDate || undefined,
      weddingMonthEstimate: newVisit.weddingMonthEstimate || undefined,
      weddingYearEstimate: newVisit.weddingYearEstimate || undefined,
      status: "agendada",
    };

    setVisits([visit, ...visits]);
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
    setIsDialogOpen(false);

    toast({
      title: "Visita agendada!",
      description: `Visita de ${visit.clientName} agendada para ${new Date(
        visit.date
      ).toLocaleDateString("pt-BR")} às ${visit.time}.`,
    });
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

  const getWeddingDateDisplay = (visit: Visit) => {
    if (visit.weddingDateStatus === "defined" && visit.weddingDate) {
      return new Date(visit.weddingDate).toLocaleDateString("pt-BR");
    }
    if (visit.weddingMonthEstimate || visit.weddingYearEstimate) {
      const monthLabel = months.find(m => m.value === visit.weddingMonthEstimate)?.label || "";
      return `Previsão: ${monthLabel} ${visit.weddingYearEstimate || ""}`.trim();
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
                <div className="grid gap-2">
                  <Label htmlFor="clientName">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    value={newVisit.clientName}
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, clientName: e.target.value })
                    }
                    placeholder="Nome completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newVisit.email}
                      onChange={(e) =>
                        setNewVisit({ ...newVisit, email: e.target.value })
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newVisit.phone}
                      onChange={(e) =>
                        setNewVisit({ ...newVisit, phone: e.target.value })
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
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
            {(["confirmada", "agendada", "realizada", "cancelada"] as const).map((status) => {
              const isSelected = statusFilter.includes(status);
              const selectedStyles = {
                confirmada: "bg-success text-success-foreground hover:bg-success/90 border-success",
                agendada: "bg-warning text-warning-foreground hover:bg-warning/90 border-warning",
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

        {/* Visits Grid */}
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
                      {visit.clientName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(visit.date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {visit.time}
                      </span>
                      {visit.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {visit.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-gold" />
                        {getWeddingDateDisplay(visit)}
                      </span>
                      {visit.guestCount && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gold" />
                          {visit.guestCount} convidados
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
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                      statusStyles[visit.status]
                    }`}
                  >
                    {statusLabels[visit.status]}
                  </span>
                  <Button variant="elegant" size="sm">
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
      </div>
    </MainLayout>
  );
}
