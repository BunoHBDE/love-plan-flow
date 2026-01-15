/**
 * CONSTANTES DO MÓDULO DE CONTRATOS
 */

import type { ContractStatus } from "@/types/contract.types";

// ==========================================
// LABELS E ESTILOS DE STATUS
// ==========================================

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  assinado: "Assinado",
  em_execucao: "Em Execução",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const CONTRACT_STATUS_STYLES: Record<string, string> = {
  pendente: "bg-warning/10 text-warning border-warning/30",
  assinado: "bg-primary/10 text-primary border-primary/30",
  em_execucao: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  concluido: "bg-success/10 text-success border-success/30",
  cancelado: "bg-destructive/10 text-destructive border-destructive/30",
};

export const CONTRACT_STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "assinado", label: "Assinado" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];
