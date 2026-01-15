import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ArrowUpDown, 
  Filter, 
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CONTRACT_STATUS_OPTIONS } from "@/constants/contracts";
import type { ContractStatus } from "@/types/contract.types";

// ==========================================
// TIPOS
// ==========================================

type SortOption = "date" | "status" | "name" | "value";

interface ContractFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: ContractStatus[];
  onStatusFilterChange: (statuses: ContractStatus[]) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

// ==========================================
// ESTILOS DOS BOTÕES DE STATUS (quando selecionados)
// ==========================================

const selectedButtonStyles: Record<string, string> = {
  pendente: "bg-warning text-warning-foreground border-warning",
  assinado: "bg-primary text-primary-foreground border-primary",
  em_execucao: "bg-blue-500 text-white border-blue-500",
  concluido: "bg-success text-success-foreground border-success",
  cancelado: "bg-destructive text-destructive-foreground border-destructive",
};

// ==========================================
// COMPONENTE
// ==========================================

export function ContractFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: ContractFiltersProps) {
  
  const toggleStatus = (status: ContractStatus) => {
    onStatusFilterChange(
      statusFilter.includes(status)
        ? statusFilter.filter((s) => s !== status)
        : [...statusFilter, status]
    );
  };

  const clearFilters = () => {
    onStatusFilterChange([]);
  };

  const hasActiveFilters = statusFilter.length > 0;

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up space-y-4 overflow-visible">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
        </div>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Campo de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente ou número..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros e Ordenação */}
      <div className="flex flex-wrap gap-3">
        {/* Botões de Status */}
        <div className="flex flex-wrap gap-2">
          {CONTRACT_STATUS_OPTIONS.map((option) => {
            const isSelected = statusFilter.includes(option.value);
            return (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                className={cn(
                  "transition-all touch-manipulation",
                  isSelected && selectedButtonStyles[option.value]
                )}
                onClick={() => toggleStatus(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Dropdown de Ordenação */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Ordenar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onSortChange("date")}
              className={sortBy === "date" ? "bg-accent" : ""}
            >
              Por Data do Evento
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onSortChange("status")}
              className={sortBy === "status" ? "bg-accent" : ""}
            >
              Por Status
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onSortChange("name")}
              className={sortBy === "name" ? "bg-accent" : ""}
            >
              Por Nome
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onSortChange("value")}
              className={sortBy === "value" ? "bg-accent" : ""}
            >
              Por Valor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
