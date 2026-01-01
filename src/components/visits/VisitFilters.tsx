import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ArrowUpDown, 
  Filter, 
  X,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarRange, DateRange } from "@/components/ui/CalendarRange";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  dateFilter: DateRange;
  onDateFilterChange: (range: DateRange) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showDateFilter?: boolean;
}

// ==========================================
// ESTILOS DOS BOTÕES DE STATUS (quando selecionados)
// ==========================================

const selectedButtonStyles: Record<string, string> = {
  agendada: "bg-warning text-warning-foreground border-warning [@media(hover:hover)]:hover:bg-warning/90 active:bg-warning/80",
  confirmada: "bg-success text-success-foreground border-success [@media(hover:hover)]:hover:bg-success/90 active:bg-success/80",
  realizada: "bg-primary text-primary-foreground border-primary [@media(hover:hover)]:hover:bg-primary/90 active:bg-primary/80",
  cancelada: "bg-destructive text-destructive-foreground border-destructive [@media(hover:hover)]:hover:bg-destructive/90 active:bg-destructive/80",
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
    onDateFilterChange({ from: null, to: null });
  };

  // Verifica se há algum filtro ativo
  const hasActiveFilters = statusFilter.length > 0 || dateFilter.from !== null || dateFilter.to !== null;

  // Formata o texto do botão de data
  const getDateButtonText = () => {
    if (dateFilter.from && dateFilter.to) {
      return `${format(dateFilter.from, "dd/MM/yy", { locale: ptBR })} - ${format(dateFilter.to, "dd/MM/yy", { locale: ptBR })}`;
    }
    if (dateFilter.from) {
      return `A partir de ${format(dateFilter.from, "dd/MM/yy", { locale: ptBR })}`;
    }
    return "Selecionar período";
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-slide-up space-y-4 overflow-visible">
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
                  "transition-all touch-manipulation focus-visible:ring-offset-0",
                  "[@media(hover:hover)]:hover:bg-accent [@media(hover:none)]:hover:bg-transparent",
                  isSelected && selectedButtonStyles[option.value]
                )}
                onClick={(e) => {
                  (e.currentTarget as HTMLButtonElement).blur();
                  toggleStatus(option.value);
                }}
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Filtro de Data com CalendarRange Component (condicional) */}
        {showDateFilter && (
          <Popover modal={true}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[200px] justify-start text-left font-normal",
                  !dateFilter.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateButtonText()}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 z-50" 
              align="start" 
              side="bottom" 
              sideOffset={8}
              avoidCollisions={false}
            >
              <CalendarRange
                size="xs"
                selected={dateFilter}
                onSelect={onDateFilterChange}
                showRangeInfo={false}
                showTodayButton={true}
                showYearNavigation={false}
              />
              {(dateFilter.from || dateFilter.to) && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onDateFilterChange({ from: null, to: null })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar período
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
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

// Re-exporta o tipo DateRange para uso externo
export type { DateRange };