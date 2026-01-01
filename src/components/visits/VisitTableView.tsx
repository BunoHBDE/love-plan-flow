import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, User, Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Importa tipos e constantes
import type { Visit } from "@/hooks/useVisitsOptimized";
import { STATUS_STYLES, STATUS_LABELS, STATUS_OPTIONS } from "@/constants/visits";

// ==========================================
// TIPOS
// ==========================================

interface VisitTableViewProps {
  visits: Visit[];
  formatDateLocal: (dateString: string) => string;
  getVisitorName: (visit: Visit) => string;
  getWeddingDateDisplay: (visit: Visit) => string;
  onUpdateStatus: (visitId: string, status: string) => void;
  onViewDetails: (visit: Visit) => void;
}

// ==========================================
// COMPONENTE DE CARD MOBILE
// ==========================================

function VisitCard({
  visit,
  formatDateLocal,
  getVisitorName,
  getWeddingDateDisplay,
  onUpdateStatus,
  onViewDetails,
}: {
  visit: Visit;
  formatDateLocal: (dateString: string) => string;
  getVisitorName: (visit: Visit) => string;
  getWeddingDateDisplay: (visit: Visit) => string;
  onUpdateStatus: (visitId: string, status: string) => void;
  onViewDetails: (visit: Visit) => void;
}) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-gold/30 transition-all cursor-pointer active:scale-[0.99]"
      onClick={() => onViewDetails(visit)}
    >
      {/* Header: Nome + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne flex-shrink-0">
            <User className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {getVisitorName(visit)}
            </p>
            {visit.client?.telefone && (
              <p className="text-xs text-muted-foreground">
                {visit.client.telefone}
              </p>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "font-medium border transition-all text-xs px-2 py-1 h-auto flex-shrink-0",
                STATUS_STYLES[visit.status] || STATUS_STYLES.agendada
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {STATUS_LABELS[visit.status] || "Agendada"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(visit.id, option.value);
                }}
                className={visit.status === option.value ? "bg-accent" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Data da visita</p>
          <p className="font-medium text-foreground">
            {formatDateLocal(visit.visit_date)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Horário</p>
          <p className="font-medium text-foreground">
            {visit.visit_time.slice(0, 5)}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground text-xs">Casamento</p>
          <p className="text-foreground">
            {getWeddingDateDisplay(visit)}
          </p>
        </div>
      </div>

      {/* Footer: Ver detalhes */}
      <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          Ver detalhes
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function VisitTableView({
  visits,
  formatDateLocal,
  getVisitorName,
  getWeddingDateDisplay,
  onUpdateStatus,
  onViewDetails,
}: VisitTableViewProps) {
  
  // Estado vazio - quando não há visitas
  if (visits.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 shadow-soft border border-border text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma visita encontrada
        </h3>
        <p className="text-muted-foreground">
          Não há visitas que correspondam aos filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* MOBILE: Cards */}
      <div className="md:hidden space-y-3">
        {visits.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            formatDateLocal={formatDateLocal}
            getVisitorName={getVisitorName}
            getWeddingDateDisplay={getWeddingDateDisplay}
            onUpdateStatus={onUpdateStatus}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* DESKTOP: Tabela */}
      <div className="hidden md:block bg-card rounded-xl shadow-soft border border-border overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Horário</TableHead>
              <TableHead className="font-semibold">Data Casamento</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.map((visit) => (
              <TableRow 
                key={visit.id} 
                className="hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => onViewDetails(visit)}
              >
                {/* Nome do Cliente */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-champagne">
                      <User className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {getVisitorName(visit)}
                      </p>
                      {visit.client?.telefone && (
                        <p className="text-xs text-muted-foreground">
                          {visit.client.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Data da Visita */}
                <TableCell>
                  <span className="text-foreground">
                    {formatDateLocal(visit.visit_date)}
                  </span>
                </TableCell>

                {/* Horário */}
                <TableCell>
                  <span className="text-foreground font-medium">
                    {visit.visit_time.slice(0, 5)}
                  </span>
                </TableCell>

                {/* Data do Casamento */}
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {getWeddingDateDisplay(visit)}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "font-medium border transition-all",
                          STATUS_STYLES[visit.status] || STATUS_STYLES.agendada
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STATUS_LABELS[visit.status] || "Agendada"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {STATUS_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(visit.id, option.value);
                          }}
                          className={visit.status === option.value ? "bg-accent" : ""}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(visit);
                    }}
                    className="hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}