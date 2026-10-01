/**
 * FUPS DO CRM
 *
 * Registra cada follow-up feito num lead (3, 7, 14 dias ou outro prazo), joga
 * a "Data da Próxima Mensagem" para hoje + N dias e guarda o histórico em
 * `crm_fups`. Quando o lead responde, o banco marca a linha como `voltou`
 * (gatilho em `messages`); aqui só lemos o resultado.
 *
 * Entrou de novo no FUP = linha nova. Nunca editamos um FUP antigo.
 */

import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonner } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { QUERY_KEYS, invalidateQueries } from "@/lib/queryClient";
import { formatarData, hoje, somarDias } from "@/lib/crm/dates";
import type { useCrmLeads } from "@/hooks/useCrmLeads";
import type { CrmFup, CrmLeadComputed } from "@/types/crm.types";

// `crm_fups_reconciliar` ainda não consta nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** O que a linha precisa saber de um lead: o FUP sem resposta e quantos já houve. */
export interface FupDoLead {
  /** FUP mais recente que ainda não teve resposta, se houver. */
  aberto: CrmFup | null;
  total: number;
}

async function carregarFups(): Promise<CrmFup[]> {
  // Rede de segurança: fecha FUPs cuja resposta o gatilho não pegou. Se falhar,
  // a lista segue com o que já está gravado.
  const { error: erroRecon } = await db.rpc("crm_fups_reconciliar");
  if (erroRecon) console.error("crm: falha ao reconciliar FUPs", erroRecon);

  const { data, error } = await supabase
    .from("crm_fups")
    .select(
      "id, lead_id, dias, etapa_id, etapa_nome, numero_fup, proxima_mensagem, iniciado_em, status, voltou_em",
    )
    .order("iniciado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrmFup[];
}

export function useCrmFups(acoes: ReturnType<typeof useCrmLeads>) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: QUERY_KEYS.CRM_FUPS,
    queryFn: carregarFups,
  });

  /** Índice por lead; `data` já vem do mais novo para o mais antigo. */
  const fupsPorLead = useMemo(() => {
    const mapa = new Map<string, FupDoLead>();
    for (const fup of query.data ?? []) {
      const atual = mapa.get(fup.lead_id) ?? { aberto: null, total: 0 };
      atual.total += 1;
      if (!atual.aberto && fup.status === "aguardando") atual.aberto = fup;
      mapa.set(fup.lead_id, atual);
    }
    return mapa;
  }, [query.data]);

  const registrarFup = useMutation({
    mutationFn: async ({
      lead,
      dias,
    }: {
      lead: CrmLeadComputed;
      dias: number;
    }) => {
      if (!Number.isInteger(dias) || dias < 1) {
        throw new Error("Informe um número de dias maior que zero.");
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Entre novamente.");

      const proxima = somarDias(hoje(), dias);
      const etapa = lead.derived.etapaAtual;

      // Primeiro o histórico: se não gravar, a data também não muda.
      const { error } = await supabase.from("crm_fups").insert({
        lead_id: lead.id,
        dias,
        etapa_id: etapa?.id ?? null,
        etapa_nome: etapa?.nome ?? null,
        numero_fup: (fupsPorLead.get(lead.id)?.total ?? 0) + 1,
        proxima_mensagem: proxima,
        created_by: session.user.id,
      });
      if (error) throw error;

      await acoes.atualizarLead.mutateAsync({
        id: lead.id,
        patch: { quando_manual: proxima },
      });

      void supabase
        .from("crm_lead_events")
        .insert({
          lead_id: lead.id,
          created_by: session.user.id,
          tipo: "fup",
          descricao: `FUP de ${dias} dias (próxima mensagem em ${formatarData(proxima)})`,
        })
        .then(({ error: e }) => {
          if (e) console.error("crm: falha ao registrar evento de FUP", e);
        });

      return { dias, proxima };
    },
    onSuccess: ({ dias, proxima }) =>
      sonner.success(
        `FUP de ${dias} dias registrado. Próxima mensagem: ${formatarData(proxima)}`,
      ),
    onError: (error: Error) =>
      toast({
        title: "Não foi possível registrar o FUP",
        description: getSafeErrorMessage(error, "registrarFup"),
        variant: "destructive",
      }),
    onSettled: () => invalidateQueries.crmFups(),
  });

  return { fupsPorLead, registrarFup, carregando: query.isLoading };
}
