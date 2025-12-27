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
import { Calendar, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Visit } from "@/hooks/useVisitsOptimized";

const statusStyles = {
  confirmada: "bg-success/10 text-success border-success/20",
  agendado: "bg-warning/10 text-warning border-warning/20",
  agendada: "bg-warning/10 text-warning border-warning/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
  realizada: "bg-primary/10 text-primary border-primary/20",
};

const statusLabels: Record<string, string> = {
  confirmada: "Confirmada",
  agendado: "Agendada",
  agendada: "Agendada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};

interface VisitTableViewProps {
  visits: Visit[];
  formatDateLocal: (dateString: string) => string;
  getVisitorName: (visit: Visit) => string;
  getWeddingDateDisplay: (visit: Visit) => string;
  onUpdateStatus: (visitId: string, status: string) => void;
  onViewDetails: (visit: Visit) => void;
}

export function VisitTableView({
  visits,
  formatDateLocal,
  getVisitorName,
  getWeddingDateDisplay,
  onUpdateStatus,
  onViewDetails,
}: VisitTableViewProps) {
  
  if (visits.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up overflow-hidden">
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma visita encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border animate-slide-up overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Casamento</TableHead>
              <TableHead className="text-center">Convidados</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.map((visit) => (
              <TableRow key={visit.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-champagne flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <div>{getVisitorName(visit)}</div>
                      {visit.client?.telefone && (
                        <div className="text-xs text-muted-foreground">{visit.client.telefone}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDateLocal(visit.visit_date)}
                </TableCell>
                <TableCell>{visit.visit_time}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "capitalize border",
                          statusStyles[visit.status as keyof typeof statusStyles] || statusStyles.agendado
                        )}
                      >
                        {statusLabels[visit.status] || visit.status}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(["agendado", "confirmada", "realizada", "cancelada"] as const).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onUpdateStatus(visit.id, status)}
                          className="capitalize"
                        >
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            status === "confirmada" ? "bg-success" :
                            status === "agendado" ? "bg-warning" :
                            status === "realizada" ? "bg-primary" :
                            "bg-destructive"
                          }`} />
                          {statusLabels[status]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-sm">
                  {getWeddingDateDisplay(visit)}
                </TableCell>
                <TableCell className="text-center">
                  {visit.guest_count || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(visit)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}