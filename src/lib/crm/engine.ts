/**
 * MOTOR DE DERIVAÇÃO DO CRM
 *
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
  type AcaoProximoPasso,
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

/**
 * Semânticas que contam como "a mensagem daquela etapa foi ignorada".
 * `voltou_fup` entra aqui porque o lead voltou, mas a mensagem original
 * ficou sem resposta uma vez — é isso que o painel precisa saber.
 */
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
  const recusou = listaResultados.some(
    (r) => r.outcome.semantica === "recusou",
  );

  let situacao: Situacao;
  if (contratou) {
    situacao = "contratou";
  } else if (recusou) {
    situacao = "perdido_recusa";
  } else if (etapaTravada) {
    situacao = "em_silencio";
  } else {
    situacao = "em_conversa";
  }

  const encerrado = situacao === "contratou" || situacao === "perdido_recusa";

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

  // --- Próximo passo e quando ---
  const { proximoPasso, quando: quandoCalculado, acao } = calcularProximoPasso({
    lead,
    stages,
    settings,
    situacao,
    encerrado,
    resultados,
    listaResultados,
    agendamento,
    etapaTravada,
    etapaPosAgendamento,
    hojeISO,
  });

  // A data pode ser ajustada na mão — remarcar um retorno, adiar uma cobrança.
  // O override só vale enquanto houver um passo pendente.
  const quandoManual = proximoPasso !== null && lead.quando_manual !== null;
  const quando = quandoManual ? lead.quando_manual : quandoCalculado;

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
    aguardandoResposta:
      !encerrado &&
      listaResultados.some((r) => r.outcome.semantica === "aguardando"),
    proximoPasso,
    acao,
    quando,
    quandoManual,
    quandoCalculado,
    urgencia,
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
  etapaTravada: CrmStage | null;
  etapaPosAgendamento: CrmStage | null;
  hojeISO: string;
}

/**
 * A cascata de decisão, na mesma ordem de precedência da planilha.
 * A primeira condição que bate define o próximo passo, a sua data e — o que
 * a planilha não tinha — qual controle resolve esse passo.
 */
function calcularProximoPasso(ctx: ContextoPasso): {
  proximoPasso: string | null;
  quando: string | null;
  acao: AcaoProximoPasso | null;
} {
  const {
    lead,
    stages,
    settings,
    situacao,
    encerrado,
    resultados,
    listaResultados,
    agendamento,
    etapaTravada,
    etapaPosAgendamento,
    hojeISO,
  } = ctx;

  if (encerrado) {
    return { proximoPasso: null, quando: null, acao: null };
  }

  // Lead sumiu: o passo é retomar o contato. Sem cadência automática — a
  // data fica em aberto e você a empurra na mão quando quiser tentar de novo.
  if (situacao === "em_silencio" && etapaTravada) {
    return {
      proximoPasso: "Retomar o contato",
      quando: hojeISO,
      acao: { tipo: "etapa", stageId: etapaTravada.id },
    };
  }

  // 1. A bola está com você (ex.: o casal entrou em negociação).
  const pendencia = listaResultados.find(
    (r) => r.outcome.semantica === "pendencia",
  );
  if (pendencia) {
    return {
      proximoPasso:
        pendencia.outcome.acao_label ?? `Resolver: ${pendencia.outcome.label}`,
      quando: hojeISO,
      acao: { tipo: "etapa", stageId: pendencia.stage.id },
    };
  }

  // 2. Não compareceu ao compromisso.
  if (lead.compareceu === "nao") {
    return {
      proximoPasso: "Reagendar a visita",
      quando: hojeISO,
      acao: { tipo: "agendamento" },
    };
  }

  // 3. Remarcou e a nova data ainda não foi confirmada.
  if (lead.compareceu === "remarcou") {
    return {
      proximoPasso: "Confirmar a nova data",
      quando: hojeISO,
      acao: { tipo: "agendamento" },
    };
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
      acao: { tipo: "etapa", stageId: posAgendamento.stage.id },
    };
  }

  // 5. Compareceu, mas o desfecho ainda não foi registrado.
  if (
    lead.compareceu === "sim" &&
    etapaPosAgendamento &&
    !resultados.has(etapaPosAgendamento.id)
  ) {
    return {
      proximoPasso: "Registrar o pós-visita",
      quando: hojeISO,
      acao: { tipo: "etapa", stageId: etapaPosAgendamento.id },
    };
  }

  // 6. Compromisso marcado e ainda não realizado — confirmar antes.
  if (agendamento && lead.compareceu !== "sim") {
    return {
      proximoPasso: "Confirmar a visita",
      quando: lead.data_agendamento
        ? somarDias(lead.data_agendamento, -settings.dias_confirmar_agendamento)
        : null,
      acao: { tipo: "compareceu" },
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
      acao: { tipo: "etapa", stageId: aguardando.stage.id },
    };
  }

  // 8. O lead respondeu e espera a sua próxima mensagem: a ação é registrar
  //    o envio na primeira etapa ainda em branco.
  const proximaEmBranco = stages.find((stage) => !resultados.has(stage.id));
  return {
    proximoPasso: "Seguir o atendimento",
    quando: hojeISO,
    acao: proximaEmBranco ? { tipo: "etapa", stageId: proximaEmBranco.id } : null,
  };
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
  if (situacao === "perdido_recusa") return COLUNA_PERDIDO;

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
