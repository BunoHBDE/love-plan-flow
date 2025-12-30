import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ArrowUpDown, 
  Filter, 
  X,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Importa constantes centralizadas
import { STATUS_LABELS, STATUS_OPTIONS } from "@/constants/visits";

// ==========================================
// TIPOS
// ==========================================

type SortOption = "date" | "time" | "status" | "name";

interface VisitFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (statuses: string[]) => void;
  dateFilter: Date | undefined;
  onDateFilterChange: (date: Date | undefined) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showDateFilter?: boolean;
}

// ==========================================
// ESTILOS DOS BOTÕES DE STATUS (quando selecionados)
// ==========================================

const selectedButtonStyles: Record<string, string> = {
  agendada: "bg-warning text-warning-foreground hover:bg-warning/90 border-warning",
  confirmada: "bg-success text-success-foreground hover:bg-success/90 border-success",
  realizada: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
  cancelada: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive",
};

// ==========================================
// COMPONENTE
// ==========================================

export function VisitFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  sortBy,
  onSortChange,
  showDateFilter = true
}: VisitFiltersProps) {
  
  /**
   * Adiciona ou remove um status do filtro
   */
  const toggleStatus = (status: string) => {
    onStatusFilterChange(
      statusFilter.includes(status)
        ? statusFilter.filter((s) => s !== status)
        : [...statusFilter, status]
    );
  };

  /**
   * Limpa todos os filtros aplicados
   */
  const clearFilters = () => {
    onStatusFilterChange([]);
    onDateFilterChange(undefined);
  };

  // Verifica se há algum filtro ativo
  const hasActiveFilters = statusFilter.length > 0 || dateFilter !== undefined;

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
        </div>
        
        {/* Botão Limpar Filtros (só aparece se tiver filtro ativo) */}
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
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros e Ordenação */}
      <div className="flex flex-wrap gap-3">
        {/* Botões de Status */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = statusFilter.includes(option.value);
            return (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                className={cn(
                  "transition-all",
                  isSelected && selectedButtonStyles[option.value]
                )}
                onClick={() => toggleStatus(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Filtro de Data (condicional) */}
        {showDateFilter && (
          <div className="relative min-w-[180px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={dateFilter ? format(dateFilter, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const value = e.target.value;
                onDateFilterChange(value ? new Date(value + "T00:00:00") : undefined);
              }}
              className="pl-10"
            />
          </div>
        )}

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
              Por Data
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onSortChange("time")}
              className={sortBy === "time" ? "bg-accent" : ""}
            >
              Por Horário
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}