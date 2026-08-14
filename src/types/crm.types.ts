/**
 * TIPOS DO CRM DE ATENDIMENTO
 *
 * O CRM não controla apenas a etapa do funil: ele controla todo o processo de
 * atendimento — o que fazer com cada lead e quando fazer.
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
  "desqualificado",
  "ganhou",
  "voltou_fup",
  "recuou",
] as const;

export type Semantica = (typeof SEMANTICAS)[number];

export const SEMANTICA_LABELS: Record<Semantica, string> = {
  aguardando: "Mensagem enviada, aguardando resposta",
  respondeu: "Respondeu, o atendimento segue",
  silencio: "Sumiu — o lead fica em silêncio",
  agendou: "Agendou um compromisso",
  pendencia: "A bola está com você",
  recusou: "Encerra: o lead recusou",
  desqualificado: "Encerra: o lead não serve para você",
  ganhou: "Encerra como contratado",
  voltou_fup: "Estava em silêncio e voltou",
  // Desfaz o progresso: o lead volta para esta etapa e o que veio depois é
  // apagado. É o "Faltou" — a visita não aconteceu, então recomeça daqui.
  recuou: "Voltou para esta etapa e apaga o que veio depois",
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

export interface CrmLeadStageResult {
  stage_id: string;
  outcome_id: string | null;
  registrado_em: string;
}

/** A data do casamento pode estar fechada ou ainda ser só um mês/ano. */
export type DataEventoStatus = "com_data" | "sem_data";

export interface CrmLead {
  id: string;
  client_id: string;
  entrada: string;
  origem: string | null;
  ultima_msg: string | null;
  ultima_msg_manual: boolean;
  /** Data do próximo passo definida na mão, que sobrepõe a calculada. */
  quando_manual: string | null;
  data_agendamento: string | null;
  compareceu: Compareceu | null;
  data_evento_status: DataEventoStatus;
  data_evento: string | null;
  mes_evento: string | null;
  ano_evento: string | null;
  convidados: number | null;
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
}

// ==========================================
// DERIVADOS (o que a planilha calculava)
// ==========================================

export type Situacao =
  | "em_conversa"
  | "em_silencio"
  | "perdido_recusa"
  | "desqualificado"
  | "contratou";

export const SITUACAO_LABELS: Record<Situacao, string> = {
  em_conversa: "Em conversa",
  em_silencio: "Em silêncio",
  perdido_recusa: "Encerrado — recusou",
  // Quem descartou foi você, não o lead: são perdas de natureza diferente e
  // o painel precisa saber distinguir uma da outra.
  desqualificado: "Não qualificado",
  contratou: "Contratou",
};

export const SITUACAO_STYLES: Record<Situacao, string> = {
  em_conversa: "bg-primary/10 text-primary",
  em_silencio: "bg-warning/25 text-warning-foreground",
  perdido_recusa: "bg-destructive/10 text-destructive",
  desqualificado: "bg-muted text-muted-foreground",
  contratou: "bg-success/20 text-success",
};

export type Urgencia = "atrasado" | "hoje" | "futuro";

/**
 * O controle que resolve o próximo passo. Sai do mesmo lugar que decide o
 * passo, para que a interface possa oferecer a ação sem repetir a lógica.
 */
export type AcaoProximoPasso =
  | { tipo: "etapa"; stageId: string }
  | { tipo: "compareceu" }
  | { tipo: "agendamento" };

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
  /**
   * Você mandou uma mensagem e ainda não registrou o retorno. É a lista de
   * quem pode ter respondido no WhatsApp sem você ter passado no sistema.
   */
  aguardandoResposta: boolean;
  proximoPasso: string | null;
  /** O que resolve o próximo passo, para a ação rápida na gaveta. */
  acao: AcaoProximoPasso | null;
  quando: string | null;
  /** A data em vigor foi definida na mão, não calculada. */
  quandoManual: boolean;
  /** A data que o motor calcularia — útil para voltar ao automático. */
  quandoCalculado: string | null;
  urgencia: Urgencia | null;
}

export type CrmLeadComputed = CrmLead & { derived: CrmDerived };
