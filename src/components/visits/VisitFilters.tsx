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

const statusLabels: Record<string, string> = {
  confirmada: "Confirmada",
  agendado: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

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
  
  const toggleStatus = (status: string) => {
    onStatusFilterChange(
      statusFilter.includes(status)
        ? statusFilter.filter((s) => s !== status)
        : [...statusFilter, status]
    );
  };

  const clearFilters = () => {
    onStatusFilterChange([]);
    onDateFilterChange(undefined);
  };

  return (
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
          onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => toggleStatus(status)}
              >
                {statusLabels[status]}
              </Button>
            );
          })}
        </div>

        {showDateFilter && (
          <div className="relative min-w-[180px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={dateFilter ? format(dateFilter, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                if (e.target.value) {
                  onDateFilterChange(new Date(e.target.value + 'T12:00:00'));
                } else {
                  onDateFilterChange(undefined);
                }
              }}
              className="pl-10"
              placeholder="Filtrar por data"
            />
          </div>
        )}

        {showDateFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange("date")}>
                Por Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("time")}>
                Por Horário
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("status")}>
                Por Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("name")}>
                Por Nome
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {(statusFilter.length > 0 || dateFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}