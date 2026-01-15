import { useState, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { SubscriptionGate } from "@/components/subscription";
import { 
  Plus,
  Loader2,
  FileText,
  Download,
} from "lucide-react";

// Hooks
import { useContracts } from "@/hooks/useContracts";
import { useContractTemplates } from "@/hooks/useContractTemplates";

// Componentes de contratos
import { ContractFilters } from "@/components/contracts/ContractFilters";
import { ContractTableView } from "@/components/contracts/ContractTableView";
import { ContractStatusDialog } from "@/components/contracts/ContractStatusDialog";
import { ContractPreviewDialog } from "@/components/contracts/ContractPreviewDialog";
import { CreateContractDialog } from "@/components/contracts/CreateContractDialog";
import { DeleteContractDialog } from "@/components/contracts/DeleteContractDialog";

// Tipos
import type { Contract, ContractStatus, ContractInsertData } from "@/types/contract.types";

// Lib
import { generateContractPDF } from "@/lib/generateContractPDF";

// ==========================================
// TIPOS LOCAIS
// ==========================================

type SortOption = "date" | "status" | "name" | "value";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function Contratos() {
  // Hooks de dados
  const { 
    contracts, 
    isLoading, 
    createContract, 
    updateContractStatus, 
    deleteContract 
  } = useContracts();
  
  // ==========================================
  // ESTADOS
  // ==========================================
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  
  // Estados dos dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);

  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // ==========================================
  // DADOS FILTRADOS E ORDENADOS
  // ==========================================

  const filteredContracts = useMemo(() => {
    return contracts
      .filter((contract) => {
        const matchesSearch = 
          contract.dados_cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(contract.status);
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date":
            const dateA = a.data_evento ? new Date(a.data_evento).getTime() : 0;
            const dateB = b.data_evento ? new Date(b.data_evento).getTime() : 0;
            return dateA - dateB;
          case "status":
            return a.status.localeCompare(b.status);
          case "name":
            return a.dados_cliente.nome.localeCompare(b.dados_cliente.nome);
          case "value":
            return b.dados_pagamento.valor_total - a.dados_pagamento.valor_total;
          default:
            return 0;
        }
      });
  }, [contracts, searchTerm, statusFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = contracts.length;
    const pendentes = contracts.filter(c => c.status === 'pendente').length;
    const assinados = contracts.filter(c => c.status === 'assinado' || c.status === 'em_execucao' || c.status === 'concluido').length;
    const valorTotal = contracts.reduce((acc, c) => acc + c.dados_pagamento.valor_total, 0);
    return { total, pendentes, assinados, valorTotal };
  }, [contracts]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleViewDetails = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setIsPreviewOpen(true);
  }, []);

  const handleOpenStatusDialog = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setIsStatusDialogOpen(true);
  }, []);

  const handleUpdateStatus = useCallback((contractId: string, status: ContractStatus) => {
    updateContractStatus.mutate({ id: contractId, status });
  }, [updateContractStatus]);

  const handleSaveStatus = useCallback((data: { 
    id: string; 
    status: ContractStatus; 
    data_assinatura?: string;
    assinado_por?: string;
  }) => {
    updateContractStatus.mutate(data, {
      onSuccess: () => {
        setIsStatusDialogOpen(false);
      }
    });
  }, [updateContractStatus]);

  const handleCreateContract = useCallback((data: ContractInsertData) => {
    createContract.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      }
    });
  }, [createContract]);

  const handleDeleteContract = useCallback(() => {
    if (deletingContract) {
      deleteContract.mutate(deletingContract.id, {
        onSuccess: () => {
          setDeletingContract(null);
        }
      });
    }
  }, [deletingContract, deleteContract]);

  const handleGeneratePDF = useCallback((contract: Contract) => {
    generateContractPDF(contract);
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
                  Contratos
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie os contratos dos seus eventos
                </p>
              </div>
            </div>

            {/* Botão de Ação Principal */}
            <div className="flex gap-2">
              <Button 
                variant="gold" 
                size="lg" 
                className="gap-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Novo Contrato
              </Button>
            </div>
          </div>

          {/* ==================== STATS ==================== */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
            <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-display font-bold text-warning">
                {stats.pendentes}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
              <p className="text-sm text-muted-foreground">Assinados</p>
              <p className="text-2xl font-display font-bold text-success">
                {stats.assinados}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-display font-bold text-primary truncate">
                {formatCurrency(stats.valorTotal)}
              </p>
            </div>
          </div>

          {/* ==================== FILTROS ==================== */}
          <ContractFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* ==================== CONTEÚDO PRINCIPAL ==================== */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ContractTableView
              contracts={filteredContracts}
              onUpdateStatus={handleUpdateStatus}
              onViewDetails={handleViewDetails}
            />
          )}

          {/* ==================== DIALOGS ==================== */}
          
          {/* Criar Contrato */}
          <CreateContractDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onCreate={handleCreateContract}
            isLoading={createContract.isPending}
          />

          {/* Atualizar Status */}
          <ContractStatusDialog
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
            contract={selectedContract}
            onSave={handleSaveStatus}
            isLoading={updateContractStatus.isPending}
          />

          {/* Preview do Contrato */}
          <ContractPreviewDialog
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            contract={selectedContract}
            onGeneratePDF={handleGeneratePDF}
          />

          {/* Confirmação de Exclusão */}
          <DeleteContractDialog
            open={!!deletingContract}
            onOpenChange={(open) => !open && setDeletingContract(null)}
            contract={deletingContract}
            onConfirm={handleDeleteContract}
            isLoading={deleteContract.isPending}
          />
        </div>
      </SubscriptionGate>
    </MainLayout>
  );
}
