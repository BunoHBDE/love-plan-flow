/**
 * MÉTRICAS DO PAINEL
 *
 * Como o motor trabalha por semântica, os blocos continuam corretos mesmo
 * que as etapas sejam renomeadas ou reordenadas.
 */

import type {
  CrmConfig,
  CrmLeadComputed,
  CrmStage,
} from "@/types/crm.types";
import { ehResposta, ehSilencio, indexarResultados } from "./engine";

// ==========================================
// 1 · FUNIL
// ==========================================

export interface LinhaFunil {
  label: string;
  /** Linha derivada (visitas / contratos), renderizada recuada */
  derivada?: boolean;
  chegaram: number;
  responderam: number | null;
  ignoraram: number | null;
  taxa: number | null;
  pctTotal: number | null;
}

export function calcularFunil(
  leads: CrmLeadComputed[],
  stages: CrmStage[],
): LinhaFunil[] {
  const total = leads.length;
  const pct = (n: number) => (total > 0 ? n / total : null);
  const linhas: LinhaFunil[] = [
    {
      label: "Novos contatos",
      chegaram: total,
      responderam: null,
      ignoraram: null,
      taxa: null,
      pctTotal: pct(total),
    },
  ];

  // Índice de resultados por lead, calculado uma vez só.
  const indices = leads.map((lead) => indexarResultados(lead, stages));

  const agendadas = leads.filter((_, i) =>
    [...indices[i].values()].some((r) => r.outcome.semantica === "agendou"),
  ).length;
  const realizadas = leads.filter((l) => l.compareceu === "sim").length;
  const naoCompareceram = leads.filter((l) => l.compareceu === "nao").length;
  const assinados = leads.filter((_, i) =>
    [...indices[i].values()].some((r) => r.outcome.semantica === "ganhou"),
  ).length;

  const temAgendamento = stages.some((s) =>
    s.outcomes.some((o) => o.semantica === "agendou"),
  );
  const temGanho = stages.some((s) =>
    s.outcomes.some((o) => o.semantica === "ganhou"),
  );

  // Índice da etapa que contém o resultado de agendamento — as linhas de
  // visita entram logo depois dela.
  const indiceAgendamento = stages.findIndex((s) =>
    s.outcomes.some((o) => o.semantica === "agendou"),
  );

  stages.forEach((stage, i) => {
    let chegaram = 0;
    let responderam = 0;
    let ignoraram = 0;

    indices.forEach((mapa) => {
      const resultado = mapa.get(stage.id);
      if (!resultado) return;
      chegaram++;
      if (ehResposta(resultado.outcome.semantica)) responderam++;
      if (ehSilencio(resultado.outcome.semantica)) ignoraram++;
    });

    linhas.push({
      label: `${i + 1} · ${stage.nome}`,
      chegaram,
      responderam,
      ignoraram,
      taxa: chegaram > 0 ? responderam / chegaram : null,
      pctTotal: pct(chegaram),
    });

    if (temAgendamento && i === indiceAgendamento) {
      linhas.push({
        label: "Visitas agendadas",
        derivada: true,
        chegaram: agendadas,
        responderam: null,
        ignoraram: null,
        taxa: null,
        pctTotal: pct(agendadas),
      });
      linhas.push({
        label: "Visitas realizadas",
        derivada: true,
        chegaram: realizadas,
        responderam: null,
        ignoraram: naoCompareceram,
        taxa: agendadas > 0 ? realizadas / agendadas : null,
        pctTotal: pct(realizadas),
      });
    }
  });

  if (temGanho) {
    linhas.push({
      label: "Contratos assinados",
      derivada: true,
      chegaram: assinados,
      responderam: null,
      ignoraram: null,
      taxa: realizadas > 0 ? assinados / realizadas : null,
      pctTotal: pct(assinados),
    });
  }

  return linhas;
}

// ==========================================
// 2 · MENSAGENS IGNORADAS POR ETAPA
// ==========================================

export interface LinhaIgnoradas {
  label: string;
  vezes: number;
  pct: number | null;
}

export function calcularIgnoradas(
  leads: CrmLeadComputed[],
  stages: CrmStage[],
): { linhas: LinhaIgnoradas[]; total: number } {
  const indices = leads.map((lead) => indexarResultados(lead, stages));

  const contagens = stages.map((stage) => {
    let vezes = 0;
    indices.forEach((mapa) => {
      const resultado = mapa.get(stage.id);
      if (resultado && ehSilencio(resultado.outcome.semantica)) vezes++;
    });
    return vezes;
  });

  const total = contagens.reduce((a, b) => a + b, 0);

  return {
    total,
    linhas: stages.map((stage, i) => ({
      label: `${i + 1} · ${stage.nome}`,
      vezes: contagens[i],
      pct: total > 0 ? contagens[i] / total : null,
    })),
  };
}

// ==========================================
// 3 · DESEMPENHO POR ORIGEM
// ==========================================

export interface LinhaOrigem {
  label: string;
  leads: number;
  visitaram: number;
  assinaram: number;
  leadParaVisita: number | null;
  leadParaContrato: number | null;
}

export function calcularOrigens(
  leads: CrmLeadComputed[],
  config: CrmConfig,
): LinhaOrigem[] {
  const rotulos = config.origens.map((o) => o.label);

  // Origens que aparecem nos leads mas saíram da lista configurada.
  leads.forEach((l) => {
    const label = l.origem ?? "Sem origem";
    if (!rotulos.includes(label)) rotulos.push(label);
  });

  return rotulos
    .map((label) => {
      const doGrupo = leads.filter((l) => (l.origem ?? "Sem origem") === label);
      const visitaram = doGrupo.filter((l) => l.compareceu === "sim").length;
      const assinaram = doGrupo.filter(
        (l) => l.derived.situacao === "contratou",
      ).length;

      return {
        label,
        leads: doGrupo.length,
        visitaram,
        assinaram,
        leadParaVisita: doGrupo.length > 0 ? visitaram / doGrupo.length : null,
        leadParaContrato: doGrupo.length > 0 ? assinaram / doGrupo.length : null,
      };
    })
    .filter((linha) => linha.leads > 0);
}

// ==========================================
// FORMATAÇÃO
// ==========================================

export function pct(valor: number | null): string {
  if (valor === null) return "—";
  return `${Math.round(valor * 100)}%`;
}

export function num(valor: number | null): string {
  return valor === null ? "—" : String(valor);
}
