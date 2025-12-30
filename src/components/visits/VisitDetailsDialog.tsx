import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Heart, Mail, Phone, Trash2, User, Users, Pencil } from "lucide-react";
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

interface VisitDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  getVisitorName: (visit: Visit) => string;
  formatDateLocal: (dateString: string) => string;
  getWeddingDateDisplay: (visit: Visit) => string;
  onEdit: () => void;
  onDelete: () => void;
}

export function VisitDetailsDialog({
  open,
  onOpenChange,
  visit,
  getVisitorName,
  formatDateLocal,
  getWeddingDateDisplay,
  onEdit,
  onDelete,
}: VisitDetailsDialogProps) {
  
  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Detalhes da Visita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header com nome e status */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-champagne">
              <User className="h-8 w-8 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{getVisitorName(visit)}</h3>
              <span className={cn(
                "inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1",
                statusStyles[visit.status as keyof typeof statusStyles] || statusStyles.agendado
              )}>
                {statusLabels[visit.status] || visit.status}
              </span>
            </div>
          </div>

          {/* Informações principais */}
          <div className="grid gap-4 p-5 bg-muted/30 rounded-xl border border-border">
            {/* Data e Hora */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Data e Horário</p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {formatDateLocal(visit.visit_date)} às {visit.visit_time}
                </p>
                {visit.visit_end_time && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Término: {visit.visit_end_time} ({visit.duration} minutos)
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            {visit.client?.email && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                  <p className="text-base text-foreground mt-0.5">{visit.client.email}</p>
                </div>
              </div>
            )}

            {/* Telefone */}
            {visit.client?.telefone && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-base text-foreground mt-0.5">{visit.client.telefone}</p>
                </div>
              </div>
            )}

            {/* Convidados */}
            {visit.guest_count && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Número de Convidados</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">{visit.guest_count}</p>
                </div>
              </div>
            )}

            {/* Data do Casamento */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                <Heart className="h-5 w-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Data do Casamento</p>
                <p className="text-base text-foreground mt-0.5">{getWeddingDateDisplay(visit)}</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {visit.notes && !visit.notes.startsWith('VISITANTE: ') && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Observações
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                {visit.notes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}