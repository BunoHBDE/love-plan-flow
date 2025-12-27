import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Heart, Mail, Phone, Trash2, User, Users } from "lucide-react";
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Detalhes da Visita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          <div className="grid gap-3 p-4 bg-muted/50 rounded-lg border border-border">
            {visit.client?.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{visit.client.email}</span>
              </div>
            )}
            {visit.client?.telefone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{visit.client.telefone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {formatDateLocal(visit.visit_date)} às {visit.visit_time}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 text-gold" />
              <span className="text-foreground">{getWeddingDateDisplay(visit)}</span>
            </div>
            {visit.guest_count && (
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-gold" />
                <span className="text-foreground">{visit.guest_count} convidados</span>
              </div>
            )}
          </div>

          {visit.notes && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <Label className="text-sm text-muted-foreground mb-2 block">Observações</Label>
              <p className="text-foreground whitespace-pre-wrap">
                {visit.notes.startsWith('VISITANTE: ') 
                  ? visit.notes.split('\n\n').slice(1).join('\n\n') 
                  : visit.notes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="ghost" 
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button variant="gold" onClick={onEdit}>
              Editar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}