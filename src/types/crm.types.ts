/**
 * TIPOS DO CRM DE ATENDIMENTO
 *
 * O CRM não controla apenas a etapa do funil: ele controla todo o processo de
 * atendimento — o que fazer com cada lead e quando fazer.
 *
 * O lead está SEMPRE em uma etapa só, e são três as coisas que podem
 * acontecer com ele:
 *
 *   Avançar   — venceu esta etapa e entra na próxima
 *   Voltar    — desfaz o progresso (é o "faltou na visita", que remarca)
 *   Encerrar  — acabou, com motivo e com a etapa onde acabou
 *
 * Ficar parado não é uma quarta ação: é a ausência delas. O tempo parado é
 * calculado, não registrado — foi a troca que fez a lista de quem precisa ser
 * chamado de volta parar de depender de alguém lembrar de marcar.
 */

// ==========================================
// CONFIGURAÇÃO
// ==========================================

export interface CrmSettings {
  id: string;
  user_id: string;
  /** Prazo de fallback. O prazo em vigor é o da etapa (`dias_prazo`). */
  dias_silencio: number;
  dias_confirmar_agendamento: number;
  dias_analise_final: number;
}

export interface CrmStage {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  /**
   * Quantos dias o lead pode ficar nesta etapa antes de contar como sumido.
   * É por etapa porque sumir depois da Saudação não é a mesma coisa que sumir
   * depois da visita — quem já veio até aqui merece mais corda.
   */
  dias_prazo: number;
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

/** Uma passagem do lead por uma etapa: quando ele entrou nela. */
export interface CrmLeadEntrada {
  stage_id: string;
  entrou_em: string;
}

/**
 * Como o atendimento acabou. Mora no lead, e não no resultado de uma etapa,
 * porque um lead pode ser perdido em QUALQUER ponto — inclusive na Saudação,
 * onde antes não havia onde registrar isso.
 */
export type Encerramento = "contratou" | "recusou" | "desqualificado";

/** A data do casamento pode estar fechada ou ainda ser só um mês/ano. */
export type DataEventoStatus = "com_data" | "sem_data";

/** Quem mandou a mensagem mais recente da conversa: nós ("outbound") ou o lead ("inbound"). */
export type DirecaoMensagem = "inbound" | "outbound";

/** A última mensagem trocada no WhatsApp com o lead — o que decide a Situação. */
export interface CrmUltimaMensagem {
  direcao: DirecaoMensagem;
  em: string;
}

export interface CrmLead {
  id: string;
  client_id: string;
  entrada: string;
  origem: string | null;
  ultima_msg: string | null;
  ultima_msg_manual: boolean;
  /** Null quando a conversa ainda não está ligada a este lead em `messages`. */
  ultimaMensagem: CrmUltimaMensagem | null;
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
  encerramento: Encerramento | null;
  /** Em que etapa o lead estava quando acabou. É o dado do gargalo. */
  encerrado_stage_id: string | null;
  encerrado_em: string | null;
  observacoes: string | null;
  arquivado: boolean;
  created_at: string;

  // Dados do cliente (join)
  nome: string;
  telefone: string;
  email: string | null;

  // Coleções
  etapas: CrmLeadEntrada[];
}

// ==========================================
// DERIVADOS (o que a planilha calculava)
// ==========================================

export type Situacao =
  /** Mandamos a mensagem e a resposta ainda está dentro do prazo da etapa. */
  | "aguardando"
  /** Mandamos a mensagem, passou o prazo da etapa e o lead não respondeu. */
  | "em_silencio"
  /** O lead respondeu por último: a bola está com a gente. */
  | "respondeu"
  /** Há uma visita marcada (ou por remarcar/confirmar): a agenda manda, não a conversa. */
  | "agendou"
  | "perdido_recusa"
  | "desqualificado"
  | "contratou";

export const SITUACAO_LABELS: Record<Situacao, string> = {
  aguardando: "Aguardando",
  em_silencio: "Silêncio",
  respondeu: "Respondeu",
  agendou: "Agendou",
  perdido_recusa: "Encerrado — recusou",
  // Quem descartou foi você, não o lead: são perdas de natureza diferente e
  // o painel precisa saber distinguir uma da outra.
  desqualificado: "Não qualificado",
  contratou: "Contratou",
};

/**
 * Cor do texto e do ponto que marcam a Situação na lista — sem pílula de
 * fundo, só o indicador. Os dois separados porque o ponto precisa da cor
 * cheia (`bg-warning`) para não sumir num círculo de 6px, enquanto o texto
 * usa a variante pensada para ficar legível direto no fundo da página.
 */
export const SITUACAO_TEXT_STYLES: Record<Situacao, string> = {
  aguardando: "text-warning-foreground",
  em_silencio: "text-destructive",
  respondeu: "text-primary",
  agendou: "text-success",
  perdido_recusa: "text-destructive",
  desqualificado: "text-muted-foreground",
  contratou: "text-success",
};

export const SITUACAO_DOT_STYLES: Record<Situacao, string> = {
  aguardando: "bg-warning",
  em_silencio: "bg-destructive",
  respondeu: "bg-primary",
  agendou: "bg-success",
  perdido_recusa: "bg-destructive",
  desqualificado: "bg-muted-foreground",
  contratou: "bg-success",
};

export type Urgencia = "atrasado" | "hoje" | "futuro";

/**
 * O controle que resolve o próximo passo. Sai do mesmo lugar que decide o
 * passo, para que a interface possa oferecer a ação sem repetir a lógica.
 */
export type AcaoProximoPasso =
  | { tipo: "avancar" }
  | { tipo: "compareceu" }
  | { tipo: "agendamento" }
  /** Última etapa: não há para onde avançar, o passo é fechar o negócio. */
  | { tipo: "fechar" };

/** Coluna do Kanban: uma etapa, ou uma das duas colunas de encerramento. */
export const COLUNA_GANHO = "__ganho";
export const COLUNA_PERDIDO = "__perdido";

export interface CrmDerived {
  situacao: Situacao;
  encerrado: boolean;
  /** id da etapa atual, ou COLUNA_GANHO / COLUNA_PERDIDO */
  coluna: string;
  etapaAtual: CrmStage | null;
  /** Para onde o botão "Avançar" leva. Null na última etapa. */
  proximaEtapa: CrmStage | null;
  /**
   * Desde quando o lead está parado: a mais recente entre a entrada na etapa,
   * a sua última mensagem e o compromisso realizado. Nunca é nula — quem não
   * tem mensagem registrada cai para a data de entrada do lead.
   */
  paradoDesde: string;
  diasParado: number;
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
