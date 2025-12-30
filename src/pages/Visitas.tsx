import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  Plus,
  LayoutList,
  CalendarDays,
  Settings,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

// Hooks
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
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  
  // Estados dos dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
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
    
    // Se tem notas com prefixo VISITANTE:, extrai o nome
    if (visit.notes && visit.notes.startsWith('VISITANTE: ')) {
      const lines = visit.notes.split('\n');
      return lines[0].replace('VISITANTE: ', '');
    }
    
    // Fallback
    return "Visitante sem identificação";
  }, []);

  /**
   * Formata a exibição da data do casamento
   * Pode ser data definida, previsão (mês/ano) ou indefinida
   */
  const getWeddingDateDisplay = useCallback((visit: Visit): string => {
    // Se tem data definida
    if (visit.wedding_date_status === "com_data" && visit.wedding_date) {
      return formatDateLocal(visit.wedding_date);
    }
    
    // Se tem previsão de mês/ano
    if (visit.wedding_month || visit.wedding_year) {
      const monthLabel = MONTHS.find(m => m.value === visit.wedding_month)?.label || "";
      const yearLabel = visit.wedding_year || "";
      return `Previsão: ${monthLabel} ${yearLabel}`.trim();
    }
    
    // Indefinida
    return "Data não definida";
  }, [formatDateLocal]);

  // ==========================================
  // FILTROS E ORDENAÇÃO
  // ==========================================

  /**
   * Aplica filtros e ordenação na lista de visitas
   */
  const filteredVisits = visits
    .filter((visit) => {
      // Filtro por busca (nome ou email)
      const clientName = visit.client?.nome || "";
      const clientEmail = visit.client?.email || "";
      const matchesSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por status
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(visit.status);
      
      // Filtro por data
      const matchesDate = !dateFilter || visit.visit_date === format(dateFilter, "yyyy-MM-dd");
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      // Aplica ordenação baseada na opção selecionada
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
    if (viewMode === "calendar" && !dateFilter) {
      setDateFilter(new Date());
    }
  }, [viewMode, dateFilter]);

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
    setIsEditOpen(true);
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
      
      setIsFormOpen(false);
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
      setIsEditOpen(false);
    }
    return success;
  }, [updateVisit, toast]);

  /**
   * Abre formulário de agendamento a partir do calendário
   * Preenche data e hora automaticamente
   */
  const handleScheduleFromCalendar = useCallback((date: string, time: string) => {
    setInitialFormDate(date);
    setInitialFormTime(time);
    setIsFormOpen(true);
  }, []);

  /**
   * Limpa valores iniciais quando fecha o formulário
   */
  const handleFormOpenChange = useCallback((open: boolean) => {
    setIsFormOpen(open);
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
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Agendar Visita
            </Button>
          </div>
        </div>

        {/* ==================== FILTROS ==================== */}
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
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
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
        
        {/* Formulário de Nova Visita */}
        <VisitFormDialog 
          open={isFormOpen}
          onOpenChange={handleFormOpenChange}
          onSubmit={handleCreateVisit}
          initialDate={initialFormDate}
          initialTime={initialFormTime}
          visits={visits}
        />

        {/* Formulário de Edição */}
        <VisitEditDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          visit={selectedVisit}
          getVisitorName={getVisitorName}
          onSubmit={handleUpdateVisit}
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
    </MainLayout>
  );
}