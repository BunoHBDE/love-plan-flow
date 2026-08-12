/**
 * CONFIGURAÇÃO DO CRM
 *
 * Carrega etapas, resultados, listas e parâmetros do usuário. Na primeira vez
 * chama `crm_bootstrap()`, que semeia o preset padrão (5 etapas, cadência
 * 3/7/14/30, listas de origem e motivo). A função é idempotente.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/lib/queryClient";
import type {
  CrmConfig,
  CrmListItem,
  CrmOutcome,
  CrmSettings,
  CrmStage,
  Semantica,
} from "@/types/crm.types";

async function carregarConfig(): Promise<CrmConfig> {
  // Semeia o preset se o usuário ainda não tiver configuração.
  const { error: bootstrapError } = await supabase.rpc("crm_bootstrap");
  if (bootstrapError) throw bootstrapError;

  const [settingsRes, stagesRes, listsRes] = await Promise.all([
    supabase.from("crm_settings").select("*").maybeSingle(),
    supabase
      .from("crm_stages")
      .select("id, nome, ordem, ativo, crm_stage_outcomes (*)")
      .eq("ativo", true)
      .order("ordem", { ascending: true }),
    supabase
      .from("crm_lists")
      .select("id, tipo, label, ordem, ativo")
      .eq("ativo", true)
      .order("ordem", { ascending: true }),
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (stagesRes.error) throw stagesRes.error;
  if (listsRes.error) throw listsRes.error;
  if (!settingsRes.data) {
    throw new Error("Configuração do CRM não encontrada.");
  }

  const stages: CrmStage[] = (stagesRes.data ?? []).map((stage) => ({
    id: stage.id,
    nome: stage.nome,
    ordem: stage.ordem,
    ativo: stage.ativo,
    outcomes: [...(stage.crm_stage_outcomes ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map(
        (outcome): CrmOutcome => ({
          id: outcome.id,
          stage_id: outcome.stage_id,
          label: outcome.label,
          semantica: outcome.semantica as Semantica,
          acao_label: outcome.acao_label,
          ordem: outcome.ordem,
        }),
      ),
  }));

  const listas = (listsRes.data ?? []) as CrmListItem[];

  return {
    settings: settingsRes.data as CrmSettings,
    stages,
    origens: listas.filter((l) => l.tipo === "origem"),
    motivos: listas.filter((l) => l.tipo === "motivo"),
  };
}

export function useCrmConfig() {
  const query = useQuery({
    queryKey: QUERY_KEYS.CRM_CONFIG,
    queryFn: carregarConfig,
    staleTime: 1000 * 60 * 30,
  });

  return {
    config: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
  };
}
