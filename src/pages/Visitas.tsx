import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  Plus,
  LayoutList,
  CalendarDays,
  Settings,
  Loader2
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { useVisitsOptimized as useVisits, Visit, VisitInsert } from "@/hooks/useVisitsOptimized";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { useToast } from "@/hooks/use-toast";

// Componentes modulares
import { VisitFilters } from "@/components/visits/VisitFilters";
import { VisitTableView } from "@/components/visits/VisitTableView";
import { VisitScheduleView } from "@/components/visits/VisitScheduleView";
import { VisitDetailsDialog } from "@/components/visits/VisitDetailsDialog";
import { VisitFormDialog } from "@/components/visits/VisitFormDialog";
import { VisitEditDialog } from "@/components/visits/VisitEditDialog";
import { VisitSettingsDialog } from "@/components/visits/VisitSettingsDialog";
import { DeleteVisitDialog } from "@/components/visits/DeleteVisitDialog";

type ViewMode = "table" | "calendar";
type SortOption = "date" | "time" | "status" | "name";

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

export default function Visitas() {
  const { visits, loading, createVisit, updateVisit, updateVisitStatus, deleteVisit } = useVisits();
  const { clients, searchClients, createClient } = useClients();
  const { toast } = useToast();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  
  // Calendar state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);
  
  // Initial form values quando agenda do calendário
  const [initialFormDate, setInitialFormDate] = useState<string | undefined>();
  const [initialFormTime, setInitialFormTime] = useState<string | undefined>();

  // Helper functions
  const formatDateLocal = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("pt-BR");
  };

  const getVisitorName = (visit: Visit) => {
    if (visit.client?.nome) {
      return visit.client.nome;
    }
    if (visit.notes && visit.notes.startsWith('VISITANTE: ')) {
      const lines = visit.notes.split('\n');
      return lines[0].replace('VISITANTE: ', '');
    }
    return "Visitante sem identificação";
  };

  const getWeddingDateDisplay = (visit: Visit) => {
    if (visit.wedding_date_status === "com_data" && visit.wedding_date) {
      return formatDateLocal(visit.wedding_date);
    }
    if (visit.wedding_month || visit.wedding_year) {
      const monthLabel = months.find(m => m.value === visit.wedding_month)?.label || "";
      return `Previsão: ${monthLabel} ${visit.wedding_year || ""}`.trim();
    }
    return "Data não definida";
  };

  // Calendar helpers
  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const getVisitsForSlot = (day: Date, time: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return visits.filter(visit => 
      visit.visit_date === dateStr && 
      visit.visit_time === time &&
      (statusFilter.length === 0 || statusFilter.includes(visit.status))
    );
  };

  // Filtered and sorted visits
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

  // Event handlers
  const handleViewDetails = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsDetailsOpen(true);
  };

  const handleEditVisit = () => {
    setIsDetailsOpen(false);
    setIsEditOpen(true);
  };

  const handleDeleteVisit = async () => {
    if (deletingVisit) {
      await deleteVisit(deletingVisit.id);
      setDeletingVisit(null);
      setIsDetailsOpen(false);
    }
  };

  const handleRescheduleVisit = async (visitId: string, newDate: string, newTime: string) => {
    const success = await updateVisit(visitId, {
      visit_date: newDate,
      visit_time: newTime,
    });
    
    if (success) {
      toast({
        title: "Visita reagendada",
        description: `Nova data: ${formatDateLocal(newDate)} às ${newTime}`,
      });
    }
  };

  // Seleciona data de hoje quando abre a view de horários
  useEffect(() => {
    if (viewMode === "calendar" && !dateFilter) {
      setDateFilter(new Date());
    }
  }, [viewMode]);

  const handleCreateVisit = async (visitData: VisitInsert, clientData?: any) => {
    try {
      let clientId = visitData.client_id;

      // Se tem dados de cliente novo, cria o cliente primeiro
      if (clientData && !clientId) {
        const newClient = await createClient(clientData);
        if (newClient) {
          clientId = newClient.id;
        }
      }

      // Cria a visita
      await createVisit({
        ...visitData,
        client_id: clientId,
      });

      toast({
        title: "Visita agendada",
        description: "A visita foi agendada com sucesso!",
      });
      
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível agendar a visita.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVisit = async (visitId: string, updates: Partial<VisitInsert>) => {
    const success = await updateVisit(visitId, updates);
    if (success) {
      toast({
        title: "Visita atualizada",
        description: "As alterações foram salvas com sucesso!",
      });
      setIsEditOpen(false);
    }
    return success;
  };

  const handleScheduleFromCalendar = (date: string, time: string) => {
    // Define valores iniciais
    setInitialFormDate(date);
    setInitialFormTime(time);
    // Abre o formulário
    setIsFormOpen(true);
  };

  const horarios = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

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
                  <span className="hidden sm:inline">Horários</span>
                </Button>
              </div>

              {/* Settings Button */}
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:inline ml-2">Configurações</span>
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-2">
            <Button 
              variant="gold" 
              size="lg" 
              className="gap-2"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Agendar Visita
            </Button>
          </div>
        </div>

        {/* Filters */}
        <VisitFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showDateFilter={viewMode === "table"}
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "table" ? (
          <VisitTableView
            visits={filteredVisits}
            formatDateLocal={formatDateLocal}
            getVisitorName={getVisitorName}
            getWeddingDateDisplay={getWeddingDateDisplay}
            onUpdateStatus={updateVisitStatus}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <VisitScheduleView
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
            horarios={horarios}
            visits={visits}
            statusFilter={statusFilter}
            getVisitorName={getVisitorName}
            getWeddingDateDisplay={getWeddingDateDisplay}  // ADICIONAR ESTA LINHA
            onViewDetails={handleViewDetails}
            onScheduleVisit={handleScheduleFromCalendar}
          />
        )}

        {/* Dialogs */}
        <VisitFormDialog 
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) {
              // Limpa valores iniciais ao fechar
              setInitialFormDate(undefined);
              setInitialFormTime(undefined);
            }
          }}
          onSubmit={handleCreateVisit}
          initialDate={initialFormDate}
          initialTime={initialFormTime}
          visits={visits}
        />

        <VisitEditDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          visit={selectedVisit}
          getVisitorName={getVisitorName}
          onSubmit={handleUpdateVisit}
        />

        <VisitDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          visit={selectedVisit}
          getVisitorName={getVisitorName}
          formatDateLocal={formatDateLocal}
          getWeddingDateDisplay={getWeddingDateDisplay}
          onEdit={handleEditVisit}
          onDelete={() => {
            setIsDetailsOpen(false);
            setDeletingVisit(selectedVisit);
          }}
        />

        <VisitSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />

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