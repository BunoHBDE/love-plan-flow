/**
 * MOTOR DE DERIVAÇÃO DO CRM
 *
 * Reproduz — e generaliza — as fórmulas da planilha de atendimento.
 * São funções puras: recebem o lead e a configuração, devolvem os campos
 * calculados. Nada disso é gravado no banco, então mudar um prazo nos
 * parâmetros recalcula todo o histórico na hora, igual à planilha.
 *
 * O motor nunca olha para o RÓTULO de um resultado, só para a sua SEMÂNTICA.
 * É isso que permite renomear, criar e apagar etapas sem quebrar a lógica.
 */

import {
  COLUNA_GANHO,
  COLUNA_PERDIDO,
  type CrmDerived,
  type CrmLead,
  type CrmOutcome,
  type CrmSettings,
  type CrmStage,
  type Semantica,
  type Situacao,
  type Urgencia,
} from "@/types/crm.types";
import { diffDias, hoje, maiorData, somarDias } from "./dates";

/** Semânticas que contam como "o lead respondeu à mensagem daquela etapa". */
const SEMANTICAS_RESPOSTA: Semantica[] = [
  "respondeu",
  "agendou",
  "ganhou",
  "pendencia",
];

/** Semânticas que contam como "a mensagem daquela etapa foi ignorada". */
const SEMANTICAS_SILENCIO: Semantica[] = ["silencio", "voltou_fup"];

export function ehResposta(s: Semantica): boolean {
  return SEMANTICAS_RESPOSTA.includes(s);
}

export function ehSilencio(s: Semantica): boolean {
  return SEMANTICAS_SILENCIO.includes(s);
}

// ==========================================
// ÍNDICE DE RESULTADOS
// ==========================================

export interface ResultadoEtapa {
  stage: CrmStage;
  outcome: CrmOutcome;
  indice: number;
}

/**
 * Monta o mapa etapa → resultado do lead, na ordem das etapas.
 * Etapas sem resultado ficam de fora.
 */
export function indexarResultados(
  lead: CrmLead,
  stages: CrmStage[],
): Map<string, ResultadoEtapa> {
  const mapa = new Map<string, ResultadoEtapa>();

  stages.forEach((stage, indice) => {
    const registro = lead.etapas.find((e) => e.stage_id === stage.id);
    if (!registro?.outcome_id) return;

    const outcome = stage.outcomes.find((o) => o.id === registro.outcome_id);
    if (!outcome) return;

    mapa.set(stage.id, { stage, outcome, indice });
  });

  return mapa;
}

// ==========================================
// O MOTOR
// ==========================================

export function derivar(
  lead: CrmLead,
  stages: CrmStage[],
  settings: CrmSettings,
): CrmDerived {
  const hojeISO = hoje();
  const resultados = indexarResultados(lead, stages);
  const listaResultados = [...resultados.values()];

  // --- Etapa que agendou o compromisso, e a etapa seguinte a ela ---
  const agendamento = listaResultados.find(
    (r) => r.outcome.semantica === "agendou",
  );
  const etapaPosAgendamento = agendamento
    ? (stages[agendamento.indice + 1] ?? null)
    : null;

  // --- Etapa travada ---
  // A primeira etapa (de trás para frente) que ficou em silêncio e cuja
  // etapa seguinte ainda não foi registrada.
  let etapaTravada: CrmStage | null = null;
  let indiceTravada = -1;

  for (let i = stages.length - 1; i >= 0; i--) {
    const resultado = resultados.get(stages[i].id);
    if (resultado?.outcome.semantica !== "silencio") continue;

    const proxima = stages[i + 1];
    if (!proxima || !resultados.has(proxima.id)) {
      etapaTravada = stages[i];
      indiceTravada = i;
      break;
    }
  }

  // --- Situação ---
  const contratou = listaResultados.some(
    (r) => r.outcome.semantica === "ganhou",
  );
  const recusou =
    listaResultados.some((r) => r.outcome.semantica === "recusou") ||
    lead.followups.some((f) => f.resultado === "recusou");

  const totalFups = settings.fup_dias.length;
  const fupsDoCiclo = lead.followups.filter((f) => f.ciclo === lead.fup_ciclo);
  const ultimoFup = fupsDoCiclo.find((f) => f.numero === totalFups);

  let situacao: Situacao;
  if (contratou) {
    situacao = "contratou";
  } else if (recusou) {
    situacao = "perdido_recusa";
  } else if (!etapaTravada) {
    situacao = "em_conversa";
  } else if (ultimoFup?.resultado === "sem_resposta") {
    situacao = "perdido_fup";
  } else {
    situacao = "em_followup";
  }

  const encerrado =
    situacao === "contratou" ||
    situacao === "perdido_recusa" ||
    situacao === "perdido_fup";

  // --- Silêncio desde ---
  // Regra normal: a data da última mensagem de etapa.
  // Exceção: se o lead travou DEPOIS de um compromisso realizado, o relógio
  // conta a partir do compromisso (ou da sua mensagem posterior, se houver).
  let silencioDesde: string | null = null;
  if (etapaTravada) {
    const travouAposAgendamento =
      agendamento !== undefined && indiceTravada > agendamento.indice;

    silencioDesde =
      travouAposAgendamento && lead.data_agendamento
        ? maiorData(lead.ultima_msg, lead.data_agendamento)
        : (lead.ultima_msg ?? null);
  }

  // --- Datas previstas dos follow-ups ---
  // Todas contadas a partir do silêncio, nunca do follow-up anterior.
  const fupPrevistos = settings.fup_dias.map((dias) =>
    silencioDesde ? somarDias(silencioDesde, dias) : null,
  );

  // --- Próximo follow-up a disparar ---
  let proximoFup: number | null = null;
  if (situacao === "em_followup") {
    for (let n = 1; n <= totalFups; n++) {
      if (!fupsDoCiclo.some((f) => f.numero === n)) {
        proximoFup = n;
        break;
      }
    }
  }

  // --- Próximo passo e quando ---
  const { proximoPasso, quando } = calcularProximoPasso({
    lead,
    stages,
    settings,
    situacao,
    encerrado,
    resultados,
    listaResultados,
    agendamento,
    etapaPosAgendamento,
    proximoFup,
    fupPrevistos,
    hojeISO,
  });

  // --- Urgência ---
  let urgencia: Urgencia | null = null;
  if (quando) {
    urgencia = quando < hojeISO ? "atrasado" : quando === hojeISO ? "hoje" : "futuro";
  }

  // --- Coluna do Kanban ---
  const coluna = calcularColuna({ situacao, stages, resultados });
  const etapaAtual = stages.find((s) => s.id === coluna) ?? null;

  return {
    situacao,
    encerrado,
    coluna,
    etapaAtual,
    etapaTravada,
    silencioDesde,
    diasEmSilencio: silencioDesde ? diffDias(silencioDesde, hojeISO) : null,
    fupPrevistos,
    proximoFup,
    proximoPasso,
    quando,
    urgencia,
    recuperadoNoFup: lead.followups.some((f) => f.resultado === "respondeu"),
  };
}

// ==========================================
// PRÓXIMO PASSO
// ==========================================

interface ContextoPasso {
  lead: CrmLead;
  stages: CrmStage[];
  settings: CrmSettings;
  situacao: Situacao;
  encerrado: boolean;
  resultados: Map<string, ResultadoEtapa>;
  listaResultados: ResultadoEtapa[];
  agendamento: ResultadoEtapa | undefined;
  etapaPosAgendamento: CrmStage | null;
  proximoFup: number | null;
  fupPrevistos: (string | null)[];
  hojeISO: string;
}

/**
 * A cascata de decisão, na mesma ordem de precedência da planilha.
 * A primeira condição que bate define o próximo passo e a sua data.
 */
function calcularProximoPasso(ctx: ContextoPasso): {
  proximoPasso: string | null;
  quando: string | null;
} {
  const {
    lead,
    settings,
    situacao,
    encerrado,
    resultados,
    listaResultados,
    agendamento,
    etapaPosAgendamento,
    proximoFup,
    fupPrevistos,
    hojeISO,
  } = ctx;

  if (encerrado) {
    return { proximoPasso: null, quando: null };
  }

  // Lead em silêncio: a fila é a cadência de follow-up.
  if (situacao === "em_followup") {
    if (proximoFup === null) {
      return { proximoPasso: null, quando: null };
    }
    return {
      proximoPasso: `Enviar FUP ${proximoFup}`,
      quando: fupPrevistos[proximoFup - 1],
    };
  }

  // 1. A bola está com você (ex.: o casal pediu um ajuste no contrato).
  const pendencia = listaResultados.find(
    (r) => r.outcome.semantica === "pendencia",
  );
  if (pendencia) {
    return {
      proximoPasso:
        pendencia.outcome.acao_label ?? `Resolver: ${pendencia.outcome.label}`,
      quando: hojeISO,
    };
  }

  // 2. Não compareceu ao compromisso.
  if (lead.compareceu === "nao") {
    return { proximoPasso: "Reagendar a visita", quando: hojeISO };
  }

  // 3. Remarcou e a nova data ainda não foi confirmada.
  if (lead.compareceu === "remarcou") {
    return { proximoPasso: "Confirmar a nova data", quando: hojeISO };
  }

  // 4. Compareceu e está analisando o desfecho — o relógio conta do compromisso.
  const posAgendamento = etapaPosAgendamento
    ? resultados.get(etapaPosAgendamento.id)
    : undefined;

  if (posAgendamento?.outcome.semantica === "aguardando") {
    const base = maiorData(lead.ultima_msg, lead.data_agendamento);
    return {
      proximoPasso: "Conferir se assinaram",
      quando: base ? somarDias(base, settings.dias_analise_final) : null,
    };
  }

  // 5. Compareceu, mas o desfecho ainda não foi registrado.
  if (
    lead.compareceu === "sim" &&
    etapaPosAgendamento &&
    !resultados.has(etapaPosAgendamento.id)
  ) {
    return { proximoPasso: "Registrar o pós-visita", quando: hojeISO };
  }

  // 6. Compromisso marcado e ainda não realizado — confirmar antes.
  if (agendamento && lead.compareceu !== "sim") {
    return {
      proximoPasso: "Confirmar a visita",
      quando: lead.data_agendamento
        ? somarDias(lead.data_agendamento, -settings.dias_confirmar_agendamento)
        : null,
    };
  }

  // 7. Alguma mensagem enviada esperando resposta.
  const aguardando = listaResultados.find(
    (r) => r.outcome.semantica === "aguardando",
  );
  if (aguardando) {
    return {
      proximoPasso: "Conferir se respondeu",
      quando: lead.ultima_msg
        ? somarDias(lead.ultima_msg, settings.dias_silencio)
        : null,
    };
  }

  // 8. O lead respondeu e está esperando a sua próxima mensagem.
  return { proximoPasso: "Seguir o atendimento", quando: hojeISO };
}

// ==========================================
// COLUNA DO KANBAN
// ==========================================

/**
 * O lead fica na coluna da última etapa registrada. Se essa etapa já foi
 * vencida (o lead respondeu ou voltou pelo follow-up), ele avança para a
 * etapa seguinte, que é justamente a que espera a sua próxima mensagem.
 */
function calcularColuna(args: {
  situacao: Situacao;
  stages: CrmStage[];
  resultados: Map<string, ResultadoEtapa>;
}): string {
  const { situacao, stages, resultados } = args;

  if (situacao === "contratou") return COLUNA_GANHO;
  if (situacao === "perdido_recusa" || situacao === "perdido_fup") {
    return COLUNA_PERDIDO;
  }

  if (stages.length === 0) return COLUNA_PERDIDO;

  let ultimo: ResultadoEtapa | null = null;
  for (const stage of stages) {
    const resultado = resultados.get(stage.id);
    if (resultado) ultimo = resultado;
  }

  if (!ultimo) return stages[0].id;

  const venceuEtapa =
    ultimo.outcome.semantica === "respondeu" ||
    ultimo.outcome.semantica === "voltou_fup";

  if (venceuEtapa) {
    const proxima = stages[ultimo.indice + 1];
    if (proxima) return proxima.id;
  }

  return ultimo.stage.id;
}

// ==========================================
// ORDENAÇÃO DA FILA
// ==========================================

/**
 * Ordena a fila do dia: quem tem data mais antiga primeiro; quem não tem
 * próximo passo vai para o fim.
 */
export function compararFila(
  a: { derived: CrmDerived; nome: string },
  b: { derived: CrmDerived; nome: string },
): number {
  const qa = a.derived.quando;
  const qb = b.derived.quando;

  if (!qa && !qb) return a.nome.localeCompare(b.nome, "pt-BR");
  if (!qa) return 1;
  if (!qb) return -1;
  if (qa !== qb) return qa < qb ? -1 : 1;

  return a.nome.localeCompare(b.nome, "pt-BR");
}
