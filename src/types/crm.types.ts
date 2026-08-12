/**
 * TIPOS DO CRM DE ATENDIMENTO
 *
 * O CRM não controla apenas a etapa do funil: ele controla todo o processo de
 * atendimento — o que fazer com cada lead, quando fazer, e o ciclo de
 * follow-up quando o lead some.
 *
 * As etapas são configuráveis. Para que o motor continue inteligente sem
 * depender de rótulos, cada resultado de etapa carrega uma SEMÂNTICA.
 */

// ==========================================
// SEMÂNTICA DOS RESULTADOS
// ==========================================

export const SEMANTICAS = [
  "aguardando",
  "respondeu",
  "silencio",
  "agendou",
  "pendencia",
  "recusou",
  "ganhou",
  "voltou_fup",
] as const;

export type Semantica = (typeof SEMANTICAS)[number];

export const SEMANTICA_LABELS: Record<Semantica, string> = {
  aguardando: "Mensagem enviada, aguardando resposta",
  respondeu: "Respondeu, o atendimento segue",
  silencio: "Sumiu — abre o ciclo de follow-up",
  agendou: "Agendou um compromisso",
  pendencia: "A bola está com você",
  recusou: "Encerra como perdido",
  ganhou: "Encerra como contratado",
  voltou_fup: "Voltou pelo follow-up",
};

// ==========================================
// CONFIGURAÇÃO
// ==========================================

export interface CrmSettings {
  id: string;
  user_id: string;
  dias_silencio: number;
  dias_confirmar_agendamento: number;
  dias_analise_final: number;
  fup_dias: number[];
}

export interface CrmOutcome {
  id: string;
  stage_id: string;
  label: string;
  semantica: Semantica;
  acao_label: string | null;
  ordem: number;
}

export interface CrmStage {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  outcomes: CrmOutcome[];
}

export interface CrmListItem {
  id: string;
  tipo: "origem" | "motivo";
  label: string;
  ordem: number;
  ativo: boolean;
}

export interface CrmConfig {
  settings: CrmSettings;
  stages: CrmStage[];
  origens: CrmListItem[];
  motivos: CrmListItem[];
}

// ==========================================
// LEAD
// ==========================================

export type Compareceu = "pendente" | "sim" | "nao" | "remarcou";

export const COMPARECEU_LABELS: Record<Compareceu, string> = {
  pendente: "Pendente",
  sim: "Sim",
  nao: "Não",
  remarcou: "Remarcou",
};

export type FollowupResultado =
  | "enviado"
  | "respondeu"
  | "sem_resposta"
  | "recusou";

export const FOLLOWUP_LABELS: Record<FollowupResultado, string> = {
  enviado: "Enviado",
  respondeu: "Respondeu",
  sem_resposta: "Sem resposta",
  recusou: "Recusou",
};

export interface CrmLeadStageResult {
  stage_id: string;
  outcome_id: string | null;
  registrado_em: string;
}

export interface CrmFollowup {
  id: string;
  ciclo: number;
  numero: number;
  resultado: FollowupResultado;
  registrado_em: string;
}

export interface CrmLead {
  id: string;
  client_id: string;
  entrada: string;
  origem: string | null;
  ultima_msg: string | null;
  ultima_msg_manual: boolean;
  data_agendamento: string | null;
  compareceu: Compareceu | null;
  fup_ciclo: number;
  data_evento: string | null;
  convidados: number | null;
  cidade: string | null;
  motivo_objecao: string | null;
  encerrado_em: string | null;
  observacoes: string | null;
  arquivado: boolean;
  created_at: string;

  // Dados do cliente (join)
  nome: string;
  telefone: string;
  email: string | null;

  // Coleções
  etapas: CrmLeadStageResult[];
  followups: CrmFollowup[];
}

// ==========================================
// DERIVADOS (o que a planilha calculava)
// ==========================================

export type Situacao =
  | "em_conversa"
  | "em_followup"
  | "perdido_fup"
  | "perdido_recusa"
  | "contratou";

export const SITUACAO_LABELS: Record<Situacao, string> = {
  em_conversa: "Em conversa",
  em_followup: "Em follow-up",
  perdido_fup: "Perdido nos follow-ups",
  perdido_recusa: "Encerrado — recusou",
  contratou: "Contratou",
};

export const SITUACAO_STYLES: Record<Situacao, string> = {
  em_conversa: "bg-primary/10 text-primary border-primary/20",
  em_followup: "bg-warning/15 text-warning-foreground border-warning/30",
  perdido_fup: "bg-muted text-muted-foreground border-border",
  perdido_recusa: "bg-destructive/10 text-destructive border-destructive/20",
  contratou: "bg-success/15 text-success border-success/30",
};

export type Urgencia = "atrasado" | "hoje" | "futuro";

/** Coluna do Kanban: uma etapa, ou uma das duas colunas de encerramento. */
export const COLUNA_GANHO = "__ganho";
export const COLUNA_PERDIDO = "__perdido";

export interface CrmDerived {
  situacao: Situacao;
  encerrado: boolean;
  /** id da etapa atual, ou COLUNA_GANHO / COLUNA_PERDIDO */
  coluna: string;
  etapaAtual: CrmStage | null;
  etapaTravada: CrmStage | null;
  silencioDesde: string | null;
  diasEmSilencio: number | null;
  /** Datas previstas de cada follow-up, na ordem de settings.fup_dias */
  fupPrevistos: (string | null)[];
  /** Próximo follow-up a disparar (1-based), ou null */
  proximoFup: number | null;
  proximoPasso: string | null;
  quando: string | null;
  urgencia: Urgencia | null;
  recuperadoNoFup: boolean;
}

export type CrmLeadComputed = CrmLead & { derived: CrmDerived };
