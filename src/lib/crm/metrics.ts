/**
 * MÉTRICAS DO PAINEL
 *
 * A pergunta que o painel existe para responder é uma só: **em que etapa o
 * atendimento trava?**
 *
 * Para respondê-la, as contagens são por ALCANCE ACUMULADO — "quantos leads
 * chegaram pelo menos até aqui" — e não por registro explícito. A diferença
 * não é cosmética: etapas podem ser puladas (quem aprova a proposta na hora
 * vai direto ao convite), e contar só quem tem registro naquela etapa fazia
 * o funil mostrar um buraco onde não havia nenhum.
 */

import type {
  CrmConfig,
  CrmLeadComputed,
  CrmStage,
} from "@/types/crm.types";
import { indiceAlcancado } from "./engine";

// ==========================================
// 1 · FUNIL
// ==========================================

export interface LinhaFunil {
  label: string;
  /** Linha derivada (visitas / contratos), renderizada recuada */
  derivada?: boolean;
  chegaram: number;
  avancaram: number | null;
  perderam: number | null;
  taxa: number | null;
  pctTotal: number | null;
}

export function calcularFunil(
  leads: CrmLeadComputed[],
  stages: CrmStage[],
): LinhaFunil[] {
  const total = leads.length;
  const pct = (n: number) => (total > 0 ? n / total : null);

  const alcances = leads.map((lead) => indiceAlcancado(lead, stages));

  const linhas: LinhaFunil[] = [
    {
      label: "Novos contatos",
      chegaram: total,
      avancaram: null,
      perderam: null,
      taxa: null,
      pctTotal: pct(total),
    },
  ];

  stages.forEach((stage, i) => {
    const chegaram = alcances.filter((a) => a >= i).length;
    const avancaram = alcances.filter((a) => a >= i + 1).length;
    const perderam = leads.filter(
      (l) =>
        l.encerrado_stage_id === stage.id &&
        (l.encerramento === "recusou" || l.encerramento === "desqualificado"),
    ).length;

    linhas.push({
      label: `${i + 1} · ${stage.nome}`,
      chegaram,
      avancaram,
      perderam,
      taxa: chegaram > 0 ? avancaram / chegaram : null,
      pctTotal: pct(chegaram),
    });
  });

  const agendadas = leads.filter((l) => l.data_agendamento !== null).length;
  const realizadas = leads.filter((l) => l.compareceu === "sim").length;
  const naoCompareceram = leads.filter((l) => l.compareceu === "nao").length;
  const assinados = leads.filter(
    (l) => l.encerramento === "contratou",
  ).length;

  linhas.push(
    {
      label: "Visitas agendadas",
      derivada: true,
      chegaram: agendadas,
      avancaram: null,
      perderam: null,
      taxa: null,
      pctTotal: pct(agendadas),
    },
    {
      label: "Visitas realizadas",
      derivada: true,
      chegaram: realizadas,
      avancaram: null,
      perderam: naoCompareceram,
      taxa: agendadas > 0 ? realizadas / agendadas : null,
      pctTotal: pct(realizadas),
    },
    {
      label: "Contratos assinados",
      derivada: true,
      chegaram: assinados,
      avancaram: null,
      perderam: null,
      taxa: realizadas > 0 ? assinados / realizadas : null,
      pctTotal: pct(assinados),
    },
  );

  return linhas;
}

// ==========================================
// 2 · GARGALO POR ETAPA
// ==========================================

export interface LinhaGargalo {
  stageId: string;
  label: string;
  /** Chegaram pelo menos até aqui. */
  chegaram: number;
  /** Destes, quantos seguiram adiante. */
  avancaram: number;
  /** Encerraram aqui — recusa ou descarte. */
  perderam: number;
  /** Estão parados aqui agora, com o atendimento em aberto. */
  parados: number;
  /** Quantos dos parados já passaram do prazo da etapa. */
  emSilencio: number;
  /** Mediana de dias que os parados estão esperando. */
  diasMediana: number | null;
  /** Fração de quem chegou e não seguiu. É a coluna que ordena o problema. */
  queda: number | null;
  /** A etapa de maior queda, entre as que têm volume para significar algo. */
  gargalo: boolean;
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? Math.round((ordenados[meio - 1] + ordenados[meio]) / 2)
    : ordenados[meio];
}

export function calcularGargalo(
  leads: CrmLeadComputed[],
  stages: CrmStage[],
): LinhaGargalo[] {
  const alcances = leads.map((lead) => indiceAlcancado(lead, stages));

  const linhas: LinhaGargalo[] = stages.map((stage, i) => {
    const chegaram = alcances.filter((a) => a >= i).length;
    const avancaram = alcances.filter((a) => a >= i + 1).length;

    const perderam = leads.filter(
      (l) =>
        l.encerrado_stage_id === stage.id &&
        (l.encerramento === "recusou" || l.encerramento === "desqualificado"),
    ).length;

    const naEtapa = leads.filter(
      (l) => !l.derived.encerrado && l.derived.etapaAtual?.id === stage.id,
    );

    return {
      stageId: stage.id,
      label: `${i + 1} · ${stage.nome}`,
      chegaram,
      avancaram,
      perderam,
      parados: naEtapa.length,
      emSilencio: naEtapa.filter((l) => l.derived.situacao === "em_silencio")
        .length,
      diasMediana: mediana(naEtapa.map((l) => l.derived.diasParado)),
      queda: chegaram > 0 ? 1 - avancaram / chegaram : null,
      gargalo: false,
    };
  });

  // O gargalo só é informação se houver volume: numa etapa com 3 leads, uma
  // queda de 67% é um lead a mais que sumiu, não um problema de processo.
  const candidatas = linhas.filter((l) => l.chegaram >= 10 && l.queda !== null);
  const pior = candidatas.reduce<LinhaGargalo | null>(
    (maior, linha) => (maior && maior.queda! >= linha.queda! ? maior : linha),
    null,
  );
  if (pior) pior.gargalo = true;

  return linhas;
}

// ==========================================
// 3 · MOTIVOS DA PERDA
// ==========================================
//
// O cruzamento motivo × etapa é o dado rico que substitui os antigos menus de
// resultado. "Preço, na Proposta" e "Preço, no Pós-visita" são problemas
// diferentes: o primeiro é a tabela, o segundo é o que a visita prometeu.

export interface LinhaMotivo {
  label: string;
  total: number;
  /** Quantas perdas daquele motivo em cada etapa, na ordem de `stages`. */
  porEtapa: number[];
  pct: number | null;
}

export function calcularMotivos(
  leads: CrmLeadComputed[],
  stages: CrmStage[],
): { linhas: LinhaMotivo[]; total: number; semMotivo: number } {
  const perdidos = leads.filter(
    (l) =>
      l.encerramento === "recusou" || l.encerramento === "desqualificado",
  );

  const rotulos: string[] = [];
  perdidos.forEach((l) => {
    const label = l.motivo_objecao ?? "Sem motivo registrado";
    if (!rotulos.includes(label)) rotulos.push(label);
  });

  const total = perdidos.length;

  const linhas = rotulos
    .map((label) => {
      const doMotivo = perdidos.filter(
        (l) => (l.motivo_objecao ?? "Sem motivo registrado") === label,
      );
      return {
        label,
        total: doMotivo.length,
        porEtapa: stages.map(
          (stage) =>
            doMotivo.filter((l) => l.encerrado_stage_id === stage.id).length,
        ),
        pct: total > 0 ? doMotivo.length / total : null,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    linhas,
    total,
    semMotivo: perdidos.filter((l) => l.motivo_objecao === null).length,
  };
}

// ==========================================
// 4 · DESEMPENHO POR ORIGEM
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

export function dias(valor: number | null): string {
  if (valor === null) return "—";
  return `${valor} dia${valor === 1 ? "" : "s"}`;
}
