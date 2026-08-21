/**
 * REVISÃO DAS SUGESTÕES DA IA
 *
 * A IA lê as conversas de WhatsApp e propõe uma etapa e alguns campos para
 * cada lead. Nada disso entra no CRM sozinho: o que a tela mostra é o diff
 * entre o CRM de hoje e o que a sugestão faria, e é você quem aprova.
 *
 * Toda aprovação grava um evento com o valor anterior de cada campo, o que
 * permite desfazer depois — é o que `desfazer` usa.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast as sonner } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS, invalidateQueries } from "@/lib/queryClient";

/** Um campo que a sugestão muda, já pareado com o valor que ele tinha. */
export interface CampoAlterado {
  campo: string;
  antes: unknown;
  depois: unknown;
}

export interface SugestaoRevisao {
  lead_id: string;
  sugestao_id: string;
  lead_nome: string;
  etapa: string | null;
  semantica: string | null;
  qualificacao: string | null;
  confianca: number | null;
  precisa_revisao: boolean;
  justificativa: string | null;
  qtd_mensagens: number | null;
  analisado_ate: string | null;
  status: "pendente" | "aplicada" | "rejeitada" | string;
  resultado_label: string | null;
  campos: string[];
  antes: Record<string, unknown>;
  depois: Record<string, unknown>;
  evento_id: string | null;
  aplicado_em: string | null;
}

/**
 * O diff em forma de lista, na ordem em que a função devolveu os campos.
 * "etapa" vira uma linha só, com o rótulo do resultado de cada lado — é assim
 * que se lê no CRM, não pelo id do outcome.
 */
export function diffDaSugestao(s: SugestaoRevisao): CampoAlterado[] {
  return (s.campos ?? []).map((campo) => {
    if (campo === "etapa") {
      const antes = s.antes?.etapa as Record<string, unknown> | undefined;
      const depois = s.depois?.etapa as Record<string, unknown> | undefined;
      return {
        campo: "etapa",
        antes: antes?.existia ? `${antes?.stage_nome}` : null,
        depois: `${depois?.stage_nome}: ${depois?.label}`,
      };
    }
    if (campo === "data") {
      return {
        campo: "data do casamento",
        antes: resumirData(s.antes),
        depois: resumirData(s.depois),
      };
    }
    return { campo, antes: s.antes?.[campo] ?? null, depois: s.depois?.[campo] ?? null };
  });
}

const MESES = ["janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro"];

/** "20/03/2027" quando a data está fechada, "Março de 2027" quando é previsão. */
function resumirData(lado: Record<string, unknown> | undefined): string | null {
  if (!lado) return null;
  const data = lado.data_evento as string | null;
  if (data) return data.split("-").reverse().join("/");
  const mes = lado.mes_evento as string | null;
  const ano = lado.ano_evento as string | null;
  const nomeMes = mes ? MESES[Number(mes) - 1] : null;
  if (nomeMes && ano) return `${nomeMes} de ${ano}`;
  return ano ?? nomeMes ?? null;
}

async function carregar(): Promise<SugestaoRevisao[]> {
  const { data, error } = await supabase.rpc("ia_revisao_lista");
  if (error) throw error;
  return (data ?? []) as unknown as SugestaoRevisao[];
}

export function useIaRevisao() {
  const lista = useQuery({
    queryKey: QUERY_KEYS.IA_REVISAO,
    queryFn: carregar,
  });

  // Aprovar é aplicar aquele lead específico. O corte de confiança vai a zero
  // de propósito: quem está aprovando na mão já viu o diff, o corte existe
  // para a aplicação automática em lote, não para você.
  const aprovar = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc("aplicar_sugestoes_ia", {
        p_lead_ids: [leadId],
        p_confianca_min: 0,
        p_dry_run: false,
      });
      if (error) throw error;
      const linha = (data ?? [])[0] as { aplicado?: boolean; motivo?: string } | undefined;
      if (!linha?.aplicado) throw new Error(linha?.motivo ?? "nada foi aplicado");
      return linha;
    },
    onSuccess: () => {
      sonner.success("Sugestão aplicada no CRM", { id: "ia-revisao", duration: 1800 });
      invalidateQueries.iaRevisao();
      invalidateQueries.crmLeads();
    },
    onError: (e: Error) => sonner.error(`Não deu para aplicar: ${e.message}`),
  });

  const rejeitar = useMutation({
    mutationFn: async (sugestaoId: string) => {
      const { error } = await supabase
        .from("ia_sugestoes")
        .update({ status: "rejeitada", revisado_em: new Date().toISOString() })
        .eq("id", sugestaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      sonner.success("Sugestão descartada", { id: "ia-revisao", duration: 1800 });
      invalidateQueries.iaRevisao();
    },
    onError: (e: Error) => sonner.error(`Não deu para descartar: ${e.message}`),
  });

  const desfazer = useMutation({
    mutationFn: async (eventoId: string) => {
      const { data, error } = await supabase.rpc("reverter_evento_ia", { p_event_id: eventoId });
      if (error) throw error;
      const r = data as { ok?: boolean; motivo?: string } | null;
      if (!r?.ok) throw new Error(r?.motivo ?? "reversão não aplicada");
      return r;
    },
    onSuccess: () => {
      sonner.success("Gravação desfeita: o lead voltou como estava", {
        id: "ia-revisao",
        duration: 2400,
      });
      invalidateQueries.iaRevisao();
      invalidateQueries.crmLeads();
    },
    onError: (e: Error) => sonner.error(`Não deu para desfazer: ${e.message}`),
  });

  return {
    sugestoes: lista.data ?? [],
    carregando: lista.isLoading,
    erro: lista.error as Error | null,
    aprovar,
    rejeitar,
    desfazer,
  };
}
