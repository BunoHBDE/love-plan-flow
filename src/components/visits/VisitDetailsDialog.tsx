import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Heart, 
  Mail, 
  Phone, 
  Trash2, 
  User, 
  Users, 
  Pencil,
  Clock,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

// Importa tipos e constantes
import type { Visit } from "@/hooks/useVisitsOptimized";
import { STATUS_STYLES, STATUS_LABELS } from "@/constants/visits";

// ==========================================
// TIPOS
// ==========================================

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

// ==========================================
// COMPONENTE
// ==========================================

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
  
  // Não renderiza se não houver visita selecionada
  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Detalhes da Visita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cabeçalho com nome e status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-champagne">
                <User className="h-7 w-7 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {getVisitorName(visit)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Visita agendada
                </p>
              </div>
            </div>
            
            {/* Badge de Status */}
            <span
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border",
                STATUS_STYLES[visit.status] || STATUS_STYLES.agendada
              )}
            >
              {STATUS_LABELS[visit.status] || "Agendada"}
            </span>
          </div>

          {/* Informações da Visita */}
          <div className="grid gap-4">
            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-4">
              {/* Data */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Data</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {formatDateLocal(visit.visit_date)}
                  </p>
                </div>
              </div>

              {/* Horário */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Horário</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {visit.visit_time.slice(0, 5)}
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            {visit.client?.email && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
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
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-base text-foreground mt-0.5">{visit.client.telefone}</p>
                </div>
              </div>
            )}

            {/* Número de Convidados */}
            {visit.guest_count && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Número de Convidados</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {visit.guest_count} convidados
                  </p>
                </div>
              </div>
            )}

            {/* Data do Casamento */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                <Heart className="h-5 w-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Data do Casamento</p>
                <p className="text-base text-foreground mt-0.5">
                  {getWeddingDateDisplay(visit)}
                </p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {visit.notes && !visit.notes.startsWith('VISITANTE: ') && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Observações
                </p>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                {visit.notes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
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