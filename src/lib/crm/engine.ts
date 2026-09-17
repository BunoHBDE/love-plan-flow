/**
 * MOTOR DE DERIVAÇÃO DO CRM
 *
 * São funções puras: recebem o lead e a configuração, devolvem os campos
 * calculados. Nada disso é gravado no banco, então mudar um prazo nos
 * parâmetros recalcula todo o histórico na hora, igual à planilha.
 *
 * A regra que organiza tudo: o lead está na etapa em que ENTROU por último, e
 * o relógio corre desde que ele entrou lá. Passou do prazo daquela etapa sem
 * avançar, está em silêncio — sem ninguém precisar marcar nada.
 */

import {
  COLUNA_GANHO,
  COLUNA_PERDIDO,
  type AcaoProximoPasso,
  type CrmDerived,
  type CrmLead,
  type CrmSettings,
  type CrmStage,
  type Situacao,
  type Urgencia,
} from "@/types/crm.types";
import { diffDias, hoje, maiorData, somarDias } from "./dates";

// ==========================================
// ONDE O LEAD ESTÁ
// ==========================================

export interface Posicao {
  stage: CrmStage;
  indice: number;
  entrouEm: string;
}

/**
 * A etapa atual do lead: a de maior ordem entre as que ele entrou.
 *
 * `stages` chega ordenado por `ordem`, então o índice na lista É a posição no
 * funil — é isso que permite responder "quem chegou até aqui" comparando
 * índices, sem consultar o banco de novo.
 */
export function posicaoAtual(
  lead: CrmLead,
  stages: CrmStage[],
): Posicao | null {
  // De trás para frente: a primeira etapa com entrada é a de maior ordem.
  for (let i = stages.length - 1; i >= 0; i--) {
    const entrada = lead.etapas.find((e) => e.stage_id === stages[i].id);
    if (entrada) {
      return { stage: stages[i], indice: i, entrouEm: entrada.entrou_em };
    }
  }

  return null;
}

/**
 * Até onde o lead chegou, como índice de etapa. É a base do funil por alcance
 * acumulado: quem está na etapa 5 passou pela 3, mesmo que a 3 nunca tenha
 * sido registrada porque a conversa pulou direto.
 */
export function indiceAlcancado(lead: CrmLead, stages: CrmStage[]): number {
  return posicaoAtual(lead, stages)?.indice ?? -1;
}

// ==========================================
// O MOTOR
// ==========================================

export function derivar(
  lead: CrmLead,
  stages: CrmStage[],
  settings: CrmSettings,
  // Quem deriva a base inteira calcula o "hoje" uma vez e passa adiante.
  hojeISO: string = hoje(),
): CrmDerived {
  const posicao = posicaoAtual(lead, stages);
  const etapaAtual = posicao?.stage ?? stages[0] ?? null;
  // Lead novo ainda não tem entrada em crm_lead_stages: `posicao` é nulo, mas
  // ele está implicitamente na primeira etapa, então a próxima é a segunda —
  // não pular direto para "sem próxima etapa", que acionaria o fechamento.
  const indiceAtual = posicao?.indice ?? (stages.length > 0 ? 0 : -1);
  const proximaEtapa = indiceAtual >= 0 ? (stages[indiceAtual + 1] ?? null) : null;

  // --- Situação ---
  // O encerramento é um fato gravado no lead, não uma inferência: ele vence
  // qualquer cálculo de tempo. Um lead que contratou não fica "em silêncio"
  // porque ninguém mandou mensagem depois.
  const encerrado = lead.encerramento !== null;

  // --- O relógio ---
  // A entrada na etapa é o piso; sua última mensagem e a visita realizada
  // empurram o relógio para frente, porque os dois reiniciam a espera. A
  // `entrada` do lead fecha a conta: 79 leads não têm `ultima_msg`, e sem esse
  // último recurso eles ficariam parados para sempre, invisíveis na fila.
  const visitaRealizada = lead.compareceu === "sim" ? lead.data_agendamento : null;
  const paradoDesde =
    maiorData(
      maiorData(posicao?.entrouEm.slice(0, 10), lead.ultima_msg),
      maiorData(visitaRealizada, lead.entrada),
    ) ?? lead.entrada;

  const diasParado = diffDias(paradoDesde, hojeISO);
  const prazo = etapaAtual?.dias_prazo ?? settings.dias_silencio;

  // Uma visita marcada e não resolvida NÃO é silêncio do lead: a bola está
  // com você, que precisa confirmar se ela aconteceu. Sem esta ressalva, 14
  // leads com visita agendada apareciam como sumidos há 26 dias, quando o que
  // está parado é o registro do comparecimento. Eles continuam cobrando —
  // pela urgência da data da visita, na regra 3 do próximo passo.
  const visitaPendente =
    lead.compareceu === "nao" ||
    lead.compareceu === "remarcou" ||
    (lead.data_agendamento !== null && lead.compareceu !== "sim");

  // A situação sai da conversa de verdade, não de uma data editada na mão:
  // quem falou por último no WhatsApp decide se a bola está com a gente
  // (mandamos e esperamos) ou com o lead (ele respondeu, esperamos nós
  // mandarmos de novo). Sem mensagem ligada ao lead ainda, cai para o
  // cálculo antigo pela data do CRM — é o caso de quem entrou antes da
  // integração ou cuja conversa não foi casada com o lead.
  //
  // A visita marcada vence a conversa: enquanto há um compromisso para
  // confirmar, remarcar ou registrar comparecimento, é a agenda que manda —
  // não interessa quem falou por último no WhatsApp.
  let situacao: Situacao;
  if (lead.encerramento === "contratou") {
    situacao = "contratou";
  } else if (lead.encerramento === "recusou") {
    situacao = "perdido_recusa";
  } else if (lead.encerramento === "desqualificado") {
    situacao = "desqualificado";
  } else if (visitaPendente) {
    situacao = "agendou";
  } else if (lead.ultimaMensagem?.direcao === "inbound") {
    situacao = "respondeu";
  } else if (lead.ultimaMensagem?.direcao === "outbound") {
    const diasSemResposta = diffDias(lead.ultimaMensagem.em.slice(0, 10), hojeISO);
    situacao = diasSemResposta >= prazo ? "em_silencio" : "aguardando";
  } else {
    situacao = diasParado >= prazo ? "em_silencio" : "aguardando";
  }

  // --- Próximo passo e quando ---
  const { proximoPasso, quando: quandoCalculado, acao } = calcularProximoPasso({
    lead,
    settings,
    encerrado,
    etapaAtual,
    proximaEtapa,
    paradoDesde,
    prazo,
    emSilencio: situacao === "em_silencio",
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
  let coluna: string;
  if (situacao === "contratou") coluna = COLUNA_GANHO;
  else if (encerrado) coluna = COLUNA_PERDIDO;
  else coluna = etapaAtual?.id ?? COLUNA_PERDIDO;

  return {
    situacao,
    encerrado,
    coluna,
    etapaAtual,
    proximaEtapa,
    paradoDesde,
    diasParado,
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
  settings: CrmSettings;
  encerrado: boolean;
  etapaAtual: CrmStage | null;
  proximaEtapa: CrmStage | null;
  paradoDesde: string;
  prazo: number;
  emSilencio: boolean;
  hojeISO: string;
}

/**
 * A cascata de decisão, na ordem de precedência do atendimento real. A
 * primeira condição que bate define o passo, a sua data e qual controle o
 * resolve — para que a interface ofereça a ação sem repetir esta lógica.
 *
 * As três primeiras regras são da visita, e existem porque um compromisso
 * marcado tem uma agenda própria que não é a do funil: ele tem data, pode não
 * acontecer, e precisa de confirmação antes.
 */
function calcularProximoPasso(ctx: ContextoPasso): {
  proximoPasso: string | null;
  quando: string | null;
  acao: AcaoProximoPasso | null;
} {
  const {
    lead,
    settings,
    encerrado,
    etapaAtual,
    proximaEtapa,
    paradoDesde,
    prazo,
    emSilencio,
    hojeISO,
  } = ctx;

  if (encerrado || !etapaAtual) {
    return { proximoPasso: null, quando: null, acao: null };
  }

  // 1. Não compareceu. Não é recusa — o lead está vivo e a visita é que não
  //    aconteceu, então o passo é remarcar.
  if (lead.compareceu === "nao") {
    return {
      proximoPasso: "Reagendar a visita",
      quando: hojeISO,
      acao: { tipo: "agendamento" },
    };
  }

  // 2. Remarcou e a nova data ainda não foi escolhida.
  if (lead.compareceu === "remarcou") {
    return {
      proximoPasso: "Confirmar a nova data",
      quando: hojeISO,
      acao: { tipo: "agendamento" },
    };
  }

  // 3. Visita marcada e ainda não realizada: confirmar antes que chegue o dia.
  if (lead.data_agendamento && lead.compareceu !== "sim") {
    return {
      proximoPasso: "Confirmar a visita",
      quando: somarDias(
        lead.data_agendamento,
        -settings.dias_confirmar_agendamento,
      ),
      acao: { tipo: "compareceu" },
    };
  }

  // 4. Passou do prazo da etapa: o lead sumiu e o passo é retomar o contato.
  //    Sem cadência automática — a data fica em aberto e você a empurra na mão
  //    quando quiser tentar de novo.
  if (emSilencio) {
    return {
      proximoPasso: "Retomar o contato",
      quando: hojeISO,
      acao: proximaEtapa ? { tipo: "avancar" } : null,
    };
  }

  // 5. O caso comum: a conversa está correndo dentro do prazo. O passo é
  //    seguir para a próxima etapa, e a data é o fim do prazo — é quando ela
  //    vira cobrança, se nada tiver acontecido até lá.
  if (proximaEtapa) {
    return {
      proximoPasso: `Avançar para ${proximaEtapa.nome}`,
      quando: somarDias(paradoDesde, prazo),
      acao: { tipo: "avancar" },
    };
  }

  // 6. Última etapa: não há para onde avançar, o que falta é a assinatura.
  //    Fechar não é avançar — é encerrar bem —, mas continua sendo um passo
  //    com botão, senão o desfecho mais importante do funil não tem onde ser
  //    registrado.
  return {
    proximoPasso: "Conferir se assinaram",
    quando: somarDias(paradoDesde, prazo),
    acao: { tipo: "fechar" },
  };
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
