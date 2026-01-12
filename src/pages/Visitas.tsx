import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { SubscriptionGate } from "@/components/subscription";
import { 
  Plus,
  LayoutList,
  CalendarDays,
  Settings,
  Loader2
} from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";

// Hooks
import { useVisitsOptimized as useVisits, Visit, VisitInsert } from "@/hooks/useVisitsOptimized";
import { useClientsOptimized as useClients } from "@/hooks/useClientsOptimized";
import { useToast } from "@/hooks/use-toast";

// Componentes modulares
import { VisitFilters, DateRange } from "@/components/visits/VisitFilters";
import { VisitTableView } from "@/components/visits/VisitTableView";
import { VisitScheduleView } from "@/components/visits/VisitScheduleView";
import { VisitDetailsDialog } from "@/components/visits/VisitDetailsDialog";
import { VisitDialog } from "@/components/visits/VisitDialog";
import { VisitSettingsDialog } from "@/components/visits/VisitSettingsDialog";
import { DeleteVisitDialog } from "@/components/visits/DeleteVisitDialog";

// Constantes centralizadas
import { MONTHS, DEFAULT_TIME_SLOTS } from "@/constants/visits";

// ==========================================
// TIPOS
// ==========================================

type ViewMode = "table" | "calendar";
type SortOption = "date" | "time" | "status" | "name";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function Visitas() {
  // Hooks de dados
  const { visits, loading, createVisit, updateVisit, updateVisitStatus, deleteVisit } = useVisits();
  const { createClient } = useClients();
  const { toast } = useToast();
  
  // ==========================================
  // ESTADOS
  // ==========================================
  
  // Modo de visualização (tabela ou calendário)
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  
  // Filtros - ATUALIZADO: dateFilter agora é DateRange
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["agendada", "confirmada"]);
  const [dateFilter, setDateFilter] = useState<DateRange>({ from: null, to: null });
  const [sortBy, setSortBy] = useState<SortOption>("date");
  
  // Data selecionada para o modo calendário (separado do filtro de range)
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  
  // Estados dos dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);
  
  // Valores iniciais para formulário (quando agenda via calendário)
  const [initialFormDate, setInitialFormDate] = useState<string | undefined>();
  const [initialFormTime, setInitialFormTime] = useState<string | undefined>();

  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================

  /**
   * Formata uma data no padrão brasileiro (DD/MM/AAAA)
   * Evita problemas de timezone ao criar a data localmente
   */
  const formatDateLocal = useCallback((dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    return new Date(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day)
    ).toLocaleDateString("pt-BR");
  }, []);

  /**
   * Obtém o nome do visitante
   * Pode vir do cliente vinculado ou das notas (visitante sem cadastro)
   */
  const getVisitorName = useCallback((visit: Visit): string => {
    // Se tem cliente vinculado, usa o nome dele
    if (visit.client?.nome) {
      return visit.client.nome;
    }
    
    // Se não tem cliente, tenta extrair das notas
    if (visit.notes?.startsWith('VISITANTE: ')) {
      const firstLine = visit.notes.split('\n')[0];
      return firstLine.replace('VISITANTE: ', '');
    }
    
    return "Visitante";
  }, []);

  /**
   * Formata a exibição da data do casamento
   */
  const getWeddingDateDisplay = useCallback((visit: Visit): string => {
    if (visit.wedding_date) {
      return formatDateLocal(visit.wedding_date);
    }
    
    if (visit.wedding_month && visit.wedding_year) {
      const monthNames: Record<string, string> = {
        "01": "Janeiro", "02": "Fevereiro", "03": "Março",
        "04": "Abril", "05": "Maio", "06": "Junho",
        "07": "Julho", "08": "Agosto", "09": "Setembro",
        "10": "Outubro", "11": "Novembro", "12": "Dezembro"
      };
      return `${monthNames[visit.wedding_month] || visit.wedding_month}/${visit.wedding_year}`;
    }
    
    return "Não definida";
  }, [formatDateLocal]);

  /**
   * Verifica se uma data está dentro do range selecionado
   */
  const isDateInRange = useCallback((dateString: string, range: DateRange): boolean => {
    if (!range.from && !range.to) return true; // Sem filtro = mostra tudo
    
    const date = parseISO(dateString);
    
    if (range.from && range.to) {
      return isWithinInterval(date, { start: range.from, end: range.to });
    }
    
    if (range.from) {
      return date >= range.from;
    }
    
    return true;
  }, []);

  // ==========================================
  // DADOS FILTRADOS E ORDENADOS
  // ==========================================

  const filteredVisits = visits
    .filter((visit) => {
      const visitorName = getVisitorName(visit);
      const matchesSearch = 
        visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (visit.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(visit.status);
      
      // ATUALIZADO: Usa range de datas
      const matchesDate = isDateInRange(visit.visit_date, dateFilter);
      
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

  // ==========================================
  // EFEITOS
  // ==========================================

  /**
   * Define a data de hoje quando muda para o modo calendário
   */
  useEffect(() => {
    if (viewMode === "calendar" && !calendarDate) {
      setCalendarDate(new Date());
    }
  }, [viewMode, calendarDate]);

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Abre o dialog de detalhes de uma visita
   */
  const handleViewDetails = useCallback((visit: Visit) => {
    setSelectedVisit(visit);
    setIsDetailsOpen(true);
  }, []);

  /**
   * Abre o dialog de edição (a partir dos detalhes)
   */
  const handleEditVisit = useCallback(() => {
    setIsDetailsOpen(false);
    setDialogMode("edit");
    setIsDialogOpen(true);
  }, []);

  /**
   * Abre o dialog para criar nova visita
   */
  const handleOpenCreateDialog = useCallback(() => {
    setSelectedVisit(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  }, []);

  /**
   * Exclui a visita selecionada
   */
  const handleDeleteVisit = useCallback(async () => {
    if (deletingVisit) {
      await deleteVisit(deletingVisit.id);
      setDeletingVisit(null);
      setIsDetailsOpen(false);
    }
  }, [deletingVisit, deleteVisit]);

  /**
   * Cria uma nova visita
   */
  const handleCreateVisit = useCallback(async (visitData: VisitInsert, clientData?: any) => {
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
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível agendar a visita.",
        variant: "destructive",
      });
    }
  }, [createClient, createVisit, toast]);

  /**
   * Atualiza uma visita existente
   */
  const handleUpdateVisit = useCallback(async (visitId: string, updates: Partial<VisitInsert>): Promise<boolean> => {
    const success = await updateVisit(visitId, updates);
    if (success) {
      toast({
        title: "Visita atualizada",
        description: "As alterações foram salvas com sucesso!",
      });
      setIsDialogOpen(false);
    }
    return success;
  }, [updateVisit, toast]);

  /**
   * Atualiza o status de uma visita (usado no VisitDetailsDialog)
   * Retorna Promise<boolean> para permitir feedback visual
   */
  const handleUpdateVisitStatus = useCallback(async (visitId: string, status: string): Promise<boolean> => {
    const success = await updateVisitStatus(visitId, status);
    if (success) {
      toast({
        title: "Status atualizado",
        description: `Visita marcada como "${status}"`,
      });
      // Atualiza o selectedVisit localmente para refletir a mudança
      if (selectedVisit && selectedVisit.id === visitId) {
        setSelectedVisit({ ...selectedVisit, status });
      }
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
    return success;
  }, [updateVisitStatus, toast, selectedVisit]);

  /**
   * Abre formulário de agendamento a partir do calendário
   * Preenche data e hora automaticamente
   */
  const handleScheduleFromCalendar = useCallback((date: string, time: string) => {
    setInitialFormDate(date);
    setInitialFormTime(time);
    setSelectedVisit(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  }, []);

  /**
   * Handler para mudança de estado do dialog
   * Limpa valores iniciais quando fecha
   */
  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setInitialFormDate(undefined);
      setInitialFormTime(undefined);
    }
  }, []);

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <MainLayout>
      <SubscriptionGate>
      <div className="space-y-8">
        {/* ==================== HEADER ==================== */}
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Título */}
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Visitas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie as visitas agendadas ao seu espaço
              </p>
            </div>

            {/* Controles */}
            <div className="flex gap-2">
              {/* Toggle de Modo de Visualização */}
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

              {/* Botão de Configurações */}
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

          {/* Botão de Ação Principal */}
          <div className="flex gap-2">
            <Button 
              variant="gold" 
              size="lg" 
              className="gap-2"
              onClick={handleOpenCreateDialog}
            >
              <Plus className="h-5 w-5" />
              Agendar Visita
            </Button>
          </div>
        </div>

        {/* ==================== FILTROS ==================== */}
        {viewMode === "table" && (
          <VisitFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showDateFilter={true}
          />
        )}

        {/* ==================== CONTEÚDO PRINCIPAL ==================== */}
        {loading ? (
          // Estado de Carregamento
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "table" ? (
          // Visualização em Tabela
          <VisitTableView
            visits={filteredVisits}
            formatDateLocal={formatDateLocal}
            getVisitorName={getVisitorName}
            getWeddingDateDisplay={getWeddingDateDisplay}
            onUpdateStatus={updateVisitStatus}
            onViewDetails={handleViewDetails}
          />
        ) : (
          // Visualização em Calendário/Agenda
          <VisitScheduleView
            dateFilter={calendarDate}
            onDateChange={setCalendarDate}
            horarios={DEFAULT_TIME_SLOTS}
            visits={visits}
            statusFilter={statusFilter}
            getVisitorName={getVisitorName}
            getWeddingDateDisplay={getWeddingDateDisplay}
            onViewDetails={handleViewDetails}
            onScheduleVisit={handleScheduleFromCalendar}
          />
        )}

        {/* ==================== DIALOGS ==================== */}
        
        {/* Dialog Unificado: Criar/Editar Visita */}
        <VisitDialog
          mode={dialogMode}
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          onCreateSubmit={handleCreateVisit}
          initialDate={initialFormDate}
          initialTime={initialFormTime}
          visits={visits}
          visit={selectedVisit}
          getVisitorName={getVisitorName}
          onEditSubmit={handleUpdateVisit}
        />

        {/* Detalhes da Visita */}
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
          onUpdateStatus={handleUpdateVisitStatus}
        />

        {/* Configurações */}
        <VisitSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />

        {/* Confirmação de Exclusão */}
        <DeleteVisitDialog
          open={!!deletingVisit}
          onOpenChange={(open) => !open && setDeletingVisit(null)}
          visit={deletingVisit}
          onConfirm={handleDeleteVisit}
        />
      </div>
      </SubscriptionGate>
    </MainLayout>
  );
}