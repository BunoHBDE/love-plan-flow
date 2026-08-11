import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { isSameDay, isWeekend } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/lib/queryClient";
import { useQuotesOptimized as useQuotes } from "@/hooks/useQuotesOptimized";
import { useAuth } from "@/hooks/useAuth";

// ==========================================
// TYPES
// ==========================================

export interface DateEvento {
  id: string;
  date: Date;
  clientName: string;
}

export interface DateBloqueio {
  id: string;
  date: Date;
  reason: string;
}

export interface DateDisponivelExtra {
  id: string;
  date: Date;
  reason: string | null;
}

export interface DateInfo {
  /** Orçamento aceito ocupando a data */
  evento?: DateEvento;
  /** Bloqueio manual da data */
  bloqueio?: DateBloqueio;
  /** Dia de semana habilitado manualmente */
  extraDisponivel?: DateDisponivelExtra;
  /** Fim de semana (disponível por padrão) */
  isNaturallyAvailable: boolean;
  /** Habilitado manualmente na página de Disponibilidade */
  isManuallyAvailable: boolean;
  isPast: boolean;
  /** Livre para receber um evento */
  isAvailable: boolean;
  /** Motivo da indisponibilidade, ou null quando disponível */
  unavailableReason: string | null;
}

interface UseDateAvailabilityOptions {
  /**
   * Orçamento a ignorar ao calcular ocupação. Usado na edição, para que a
   * própria data do orçamento não seja contada como ocupada por ele mesmo.
   */
  ignoreQuoteId?: string;
}

// ==========================================
// HOOK
// ==========================================

/**
 * Centraliza a regra de disponibilidade de datas usada na página de
 * Disponibilidade, para que os calendários de orçamento mostrem exatamente a
 * mesma informação.
 *
 * Uma data está disponível quando:
 * 1. é fim de semana OU foi habilitada manualmente;
 * 2. não está no passado;
 * 3. não tem orçamento aceito;
 * 4. não está bloqueada.
 */
export function useDateAvailability(options: UseDateAvailabilityOptions = {}) {
  const { ignoreQuoteId } = options;
  const { user } = useAuth();
  const { quotes, loading: loadingQuotes } = useQuotes();

  // Só consulta com sessão ativa: sem ela o RLS devolveria uma lista vazia,
  // que ficaria em cache e esconderia bloqueios reais.
  const { data: blockedRows = [], isLoading: loadingBlocked } = useQuery({
    queryKey: QUERY_KEYS.BLOCKED_DATES,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("id, date, reason")
        .order("date", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: availableRows = [], isLoading: loadingAvailable } = useQuery({
    queryKey: QUERY_KEYS.AVAILABLE_DATES,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("available_dates")
        .select("id, date, reason")
        .order("date", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const eventos = useMemo<DateEvento[]>(() => {
    return quotes
      .filter(
        (q) => q.status === "aceito" && q.data_evento && q.id !== ignoreQuoteId
      )
      .map((q) => ({
        id: q.id,
        date: new Date(q.data_evento! + "T12:00:00"),
        clientName: q.client?.nome || "Cliente",
      }));
  }, [quotes, ignoreQuoteId]);

  const bloqueios = useMemo<DateBloqueio[]>(() => {
    return blockedRows.map((b) => ({
      id: b.id,
      date: new Date(b.date + "T12:00:00"),
      reason: b.reason,
    }));
  }, [blockedRows]);

  const disponiveisExtra = useMemo<DateDisponivelExtra[]>(() => {
    return availableRows.map((a) => ({
      id: a.id,
      date: new Date(a.date + "T12:00:00"),
      reason: a.reason,
    }));
  }, [availableRows]);

  const getDateInfo = useCallback(
    (date: Date): DateInfo => {
      const evento = eventos.find((e) => isSameDay(e.date, date));
      const bloqueio = bloqueios.find((b) => isSameDay(b.date, date));
      const extraDisponivel = disponiveisExtra.find((d) => isSameDay(d.date, date));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isNaturallyAvailable = isWeekend(date);
      const isManuallyAvailable = !!extraDisponivel;
      const isPast = date < today;
      const isAvailable =
        (isNaturallyAvailable || isManuallyAvailable) &&
        !isPast &&
        !evento &&
        !bloqueio;

      let unavailableReason: string | null = null;
      if (evento) {
        unavailableReason = `Já existe um evento confirmado nesta data (${evento.clientName}).`;
      } else if (bloqueio) {
        unavailableReason = bloqueio.reason
          ? `Data bloqueada: ${bloqueio.reason}.`
          : "Esta data está bloqueada.";
      } else if (isPast) {
        unavailableReason = "Esta data já passou.";
      } else if (!isNaturallyAvailable && !isManuallyAvailable) {
        unavailableReason =
          "Dia de semana não habilitado para eventos. Libere a data em Disponibilidade.";
      }

      return {
        evento,
        bloqueio,
        extraDisponivel,
        isNaturallyAvailable,
        isManuallyAvailable,
        isPast,
        isAvailable,
        unavailableReason,
      };
    },
    [eventos, bloqueios, disponiveisExtra]
  );

  /** Modifiers prontos para o componente Calendar. */
  const modifiers = useMemo(
    () => ({
      evento: (date: Date) => eventos.some((e) => isSameDay(e.date, date)),
      bloqueado: (date: Date) => bloqueios.some((b) => isSameDay(b.date, date)),
      disponivel: (date: Date) => {
        const info = getDateInfo(date);
        return info.isAvailable && !info.isManuallyAvailable;
      },
      disponivelExtra: (date: Date) => {
        const info = getDateInfo(date);
        return info.isAvailable && info.isManuallyAvailable;
      },
    }),
    [eventos, bloqueios, getDateInfo]
  );

  /**
   * Indica se a data recebe alguma cor de disponibilidade. O Calendar ignora
   * o estilo padrão de seleção quando há modifier ativo, então quem desenha a
   * seleção precisa saber se a data já está colorida.
   */
  const hasMarker = useCallback(
    (date: Date) => Object.values(modifiers).some((match) => match(date)),
    [modifiers]
  );

  return {
    loading: loadingQuotes || loadingBlocked || loadingAvailable,
    eventos,
    bloqueios,
    disponiveisExtra,
    getDateInfo,
    modifiers,
    hasMarker,
  };
}

/** Classes aplicadas a cada modifier — mesmas cores da página de Disponibilidade. */
export const DATE_AVAILABILITY_MODIFIER_CLASSES: Record<string, string> = {
  evento: "bg-rose-500 text-white hover:bg-rose-600 font-bold",
  bloqueado: "bg-amber-500 text-white hover:bg-amber-600 font-bold",
  disponivel: "bg-emerald-500 text-white hover:bg-emerald-600 font-bold",
  disponivelExtra: "bg-blue-500 text-white hover:bg-blue-600 font-bold",
};

/** Legenda exibida abaixo do calendário. */
export const DATE_AVAILABILITY_LEGEND = [
  { dot: "bg-emerald-500", label: "Disponível" },
  { dot: "bg-blue-500", label: "Liberada" },
  { dot: "bg-rose-500", label: "Evento" },
  { dot: "bg-amber-500", label: "Bloqueada" },
] as const;
