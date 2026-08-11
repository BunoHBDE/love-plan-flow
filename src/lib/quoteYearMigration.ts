/**
 * MIGRAÇÃO DE SELEÇÕES ENTRE ANOS
 * ==========================================
 *
 * Espaços, buffets, serviços e pacotes são cadastrados por ano: o mesmo
 * "Salão Principal" existe como um registro em 2026 e outro em 2027, com ids
 * diferentes. Quando a data do evento muda de ano, os ids guardados no
 * orçamento passam a apontar para o ano errado — os selects ficam em branco
 * (o id não está entre as opções do novo ano) e o preço continua o do ano
 * antigo.
 *
 * Este módulo traduz os ids para os equivalentes do novo ano, casando pelo
 * nome, e informa o que não existe mais para que a página possa avisar.
 */

import type { QuoteItemsSelections } from "@/components/quotes/QuoteItemsSection";

// ==========================================
// TYPES
// ==========================================

export interface YearScopedItem {
  id?: string;
  ano: string;
  nome: string;
}

export interface PackageLikeItem extends YearScopedItem {
  itens_pacote: {
    espacos: string[];
    buffets: string[];
    servicos: string[];
  };
}

export interface YearCatalogs {
  spaces: YearScopedItem[];
  buffets: YearScopedItem[];
  services: YearScopedItem[];
  packages: PackageLikeItem[];
}

export type RemapOutcome =
  /** Não havia seleção, ou o item já é do ano alvo */
  | { status: "unchanged" }
  /** Existe equivalente no ano alvo */
  | { status: "remapped"; id: string; nome: string }
  /** Não existe equivalente no ano alvo */
  | { status: "removed"; nome: string }
  /**
   * O item selecionado não está no catálogo recebido — normalmente porque os
   * dados ainda estão carregando. Quem chama deve adiar a migração.
   */
  | { status: "unknown" };

export interface RemapSelectionsResult {
  selections: QuoteItemsSelections;
  /** Falso quando nada mudou ou quando a migração foi adiada */
  changed: boolean;
  /** Nomes dos itens que não existem no ano alvo e foram removidos */
  removed: string[];
  /** Catálogo ainda incompleto: a migração não foi aplicada */
  deferred: boolean;
}

// ==========================================
// CASAMENTO POR NOME
// ==========================================

/**
 * Palavras genéricas que costumam variar entre os anos ao renomear um item —
 * "Pacote Essência" em 2026 virou "Essência" em 2027, por exemplo.
 */
const PREFIXOS_GENERICOS = [
  "pacote",
  "plano",
  "combo",
  "espaco",
  "buffet",
  "servico",
];

/** Minúsculas, sem acentos e com espaços normalizados. */
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove um prefixo genérico do nome já normalizado. Só remove se sobrar algo:
 * um espaço chamado apenas "Espaço" precisa continuar sendo "espaco".
 */
function removerPrefixoGenerico(nomeNormalizado: string): string {
  for (const prefixo of PREFIXOS_GENERICOS) {
    if (nomeNormalizado.startsWith(`${prefixo} `)) {
      const resto = nomeNormalizado.slice(prefixo.length + 1).trim();
      if (resto) return resto;
    }
  }
  return nomeNormalizado;
}

// ==========================================
// PRIMITIVA
// ==========================================

/**
 * Traduz o id de um item para o equivalente em `targetYear`.
 *
 * O casamento é por nome, em duas passadas: primeiro pelo nome normalizado
 * (minúsculas, sem acentos); se não achar, ignorando um prefixo genérico dos
 * dois lados. A segunda passada só vale quando encontra um único candidato —
 * com mais de um não há como saber qual é o certo.
 */
export function remapItemToYear(
  items: YearScopedItem[],
  currentId: string | null | undefined,
  targetYear: string
): RemapOutcome {
  if (!currentId) return { status: "unchanged" };

  const current = items.find((item) => item.id === currentId);
  if (!current) return { status: "unknown" };
  if (current.ano === targetYear) return { status: "unchanged" };

  const candidatos = items.filter((item) => item.ano === targetYear && item.id);
  const nomeAtual = normalizarNome(current.nome);

  let equivalent = candidatos.find(
    (item) => normalizarNome(item.nome) === nomeAtual
  );

  if (!equivalent) {
    const nomeSemPrefixo = removerPrefixoGenerico(nomeAtual);
    const aproximados = candidatos.filter(
      (item) =>
        removerPrefixoGenerico(normalizarNome(item.nome)) === nomeSemPrefixo
    );
    if (aproximados.length === 1) {
      equivalent = aproximados[0];
    }
  }

  if (equivalent?.id) {
    return { status: "remapped", id: equivalent.id, nome: equivalent.nome };
  }

  return { status: "removed", nome: current.nome };
}

// ==========================================
// SELEÇÕES COMPLETAS
// ==========================================

/**
 * Traduz todas as seleções de um orçamento para `targetYear`.
 *
 * Se qualquer item selecionado ainda não estiver no catálogo, devolve
 * `deferred` sem alterar nada: migrar com dados pela metade apagaria seleções
 * válidas. A página deve chamar de novo quando os catálogos carregarem.
 */
export function remapSelectionsToYear(
  selections: QuoteItemsSelections,
  targetYear: string,
  catalogs: YearCatalogs
): RemapSelectionsResult {
  const unchanged: RemapSelectionsResult = {
    selections,
    changed: false,
    removed: [],
    deferred: false,
  };

  const deferred: RemapSelectionsResult = { ...unchanged, deferred: true };

  const removed: string[] = [];
  let changed = false;

  // ---------- Modo pacote ----------
  if (selections.mode === "pacote" && selections.pacoteId) {
    const outcome = remapItemToYear(
      catalogs.packages,
      selections.pacoteId,
      targetYear
    );

    if (outcome.status === "unknown") return deferred;
    if (outcome.status === "unchanged") return unchanged;

    if (outcome.status === "removed") {
      // Sem pacote equivalente, volta ao modo personalizado sem itens: os itens
      // travados vinham todos do pacote que deixou de existir.
      return {
        selections: {
          ...selections,
          mode: "personalizado",
          pacoteId: null,
          espacoId: null,
          buffetId: null,
          servicoIds: [],
          serviceQuantities: {},
          packageLockedItems: { espacoId: null, buffetId: null, servicoIds: [] },
        },
        changed: true,
        removed: [outcome.nome],
        deferred: false,
      };
    }

    // Pacote equivalente encontrado: os itens travados vêm da definição dele no
    // novo ano, que já traz os ids corretos.
    const pkg = catalogs.packages.find((p) => p.id === outcome.id);
    if (!pkg) return deferred;

    const itens = pkg.itens_pacote;
    const espacoId = itens?.espacos?.[0] || null;
    const buffetId = itens?.buffets?.[0] || null;
    const servicoIds = itens?.servicos ?? [];

    const serviceQuantities: Record<string, number> = {};
    servicoIds.forEach((id) => {
      serviceQuantities[id] = 1;
    });

    return {
      selections: {
        ...selections,
        mode: "pacote",
        pacoteId: outcome.id,
        espacoId,
        buffetId,
        servicoIds,
        serviceQuantities,
        packageLockedItems: { espacoId, buffetId, servicoIds },
      },
      changed: true,
      removed: [],
      deferred: false,
    };
  }

  // ---------- Modo personalizado ----------
  const espacoOutcome = remapItemToYear(
    catalogs.spaces,
    selections.espacoId,
    targetYear
  );
  const buffetOutcome = remapItemToYear(
    catalogs.buffets,
    selections.buffetId,
    targetYear
  );

  if (espacoOutcome.status === "unknown" || buffetOutcome.status === "unknown") {
    return deferred;
  }

  let espacoId = selections.espacoId;
  if (espacoOutcome.status === "remapped") {
    espacoId = espacoOutcome.id;
    changed = true;
  } else if (espacoOutcome.status === "removed") {
    espacoId = null;
    removed.push(espacoOutcome.nome);
    changed = true;
  }

  let buffetId = selections.buffetId;
  if (buffetOutcome.status === "remapped") {
    buffetId = buffetOutcome.id;
    changed = true;
  } else if (buffetOutcome.status === "removed") {
    buffetId = null;
    removed.push(buffetOutcome.nome);
    changed = true;
  }

  const servicoIds: string[] = [];
  const serviceQuantities: Record<string, number> = {};

  for (const servicoId of selections.servicoIds) {
    const outcome = remapItemToYear(catalogs.services, servicoId, targetYear);

    if (outcome.status === "unknown") return deferred;

    if (outcome.status === "unchanged") {
      servicoIds.push(servicoId);
      if (selections.serviceQuantities[servicoId] !== undefined) {
        serviceQuantities[servicoId] = selections.serviceQuantities[servicoId];
      }
      continue;
    }

    if (outcome.status === "removed") {
      removed.push(outcome.nome);
      changed = true;
      continue;
    }

    servicoIds.push(outcome.id);
    changed = true;
    // A quantidade acompanha o serviço para a nova chave.
    if (selections.serviceQuantities[servicoId] !== undefined) {
      serviceQuantities[outcome.id] = selections.serviceQuantities[servicoId];
    }
  }

  if (!changed) return unchanged;

  return {
    selections: {
      ...selections,
      espacoId,
      buffetId,
      servicoIds,
      serviceQuantities,
    },
    changed: true,
    removed,
    deferred: false,
  };
}
