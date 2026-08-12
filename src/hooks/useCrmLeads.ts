/**
 * LEADS DO CRM
 *
 * O lead é sempre salvo como cliente: criar um lead cria o registro em
 * `clients` e o registro de atendimento em `crm_leads`.
 *
 * Os campos calculados (situação, próximo passo, quando, follow-ups previstos)
 * NÃO são gravados — saem do motor em `@/lib/crm/engine` a cada leitura. Assim,
 * mudar um parâmetro recalcula a base inteira sem migração de dados.
 */

import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonner } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { QUERY_KEYS, invalidateQueries } from "@/lib/queryClient";
import { derivar } from "@/lib/crm/engine";
import { hoje } from "@/lib/crm/dates";
import { FOLLOWUP_LABELS } from "@/types/crm.types";
import type {
  Compareceu,
  CrmConfig,
  CrmLead,
  CrmLeadComputed,
  DataEventoStatus,
  FollowupResultado,
} from "@/types/crm.types";

// ==========================================
// LEITURA
// ==========================================

const SELECT_LEAD = `
  id, client_id, entrada, origem, ultima_msg, ultima_msg_manual, quando_manual,
  data_agendamento, compareceu, fup_ciclo, convidados,
  data_evento_status, data_evento, mes_evento, ano_evento,
  motivo_objecao, encerrado_em, observacoes, arquivado, created_at,
  clients ( nome, telefone, email ),
  crm_lead_stages ( stage_id, outcome_id, registrado_em ),
  crm_followups ( id, ciclo, numero, resultado, registrado_em )
`;

async function carregarLeads(): Promise<CrmLead[]> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(SELECT_LEAD)
    .eq("arquivado", false)
    .order("entrada", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row): CrmLead => {
    const cliente = row.clients as unknown as {
      nome: string;
      telefone: string;
      email: string | null;
    } | null;

    return {
      id: row.id,
      client_id: row.client_id,
      entrada: row.entrada,
      origem: row.origem,
      ultima_msg: row.ultima_msg,
      ultima_msg_manual: row.ultima_msg_manual,
      quando_manual: row.quando_manual,
      data_agendamento: row.data_agendamento,
      compareceu: row.compareceu as Compareceu | null,
      fup_ciclo: row.fup_ciclo,
      data_evento_status: row.data_evento_status as DataEventoStatus,
      data_evento: row.data_evento,
      mes_evento: row.mes_evento,
      ano_evento: row.ano_evento,
      convidados: row.convidados,
      motivo_objecao: row.motivo_objecao,
      encerrado_em: row.encerrado_em,
      observacoes: row.observacoes,
      arquivado: row.arquivado,
      created_at: row.created_at,

      nome: cliente?.nome ?? "(sem nome)",
      telefone: cliente?.telefone ?? "",
      email: cliente?.email ?? null,

      etapas: (row.crm_lead_stages ?? []).map((e) => ({
        stage_id: e.stage_id,
        outcome_id: e.outcome_id,
        registrado_em: e.registrado_em,
      })),
      followups: (row.crm_followups ?? []).map((f) => ({
        id: f.id,
        ciclo: f.ciclo,
        numero: f.numero,
        resultado: f.resultado as FollowupResultado,
        registrado_em: f.registrado_em,
      })),
    };
  });
}

// ==========================================
// ESCRITA
// ==========================================

export interface NovoLeadInput {
  nome: string;
  telefone: string;
  email?: string | null;
  origem?: string | null;
  entrada: string;
  observacoes?: string | null;
}

export interface AtualizarLeadInput {
  origem?: string | null;
  ultima_msg?: string | null;
  ultima_msg_manual?: boolean;
  quando_manual?: string | null;
  data_agendamento?: string | null;
  compareceu?: Compareceu | null;
  data_evento_status?: DataEventoStatus;
  data_evento?: string | null;
  mes_evento?: string | null;
  ano_evento?: string | null;
  convidados?: number | null;
  motivo_objecao?: string | null;
  observacoes?: string | null;
  /** Preenchidos pelo próprio motor, não pelos formulários. */
  encerrado_em?: string | null;
  fup_ciclo?: number;
}

async function usuarioAtual(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  return user.id;
}

/**
 * Confirmação curta do que foi gravado. O id fixo faz a mensagem nova
 * substituir a anterior, em vez de empilhar avisos a cada campo alterado.
 */
function confirmar(mensagem: string) {
  sonner.success(mensagem, { id: "crm-salvo", duration: 1800 });
}

async function registrarEvento(
  leadId: string,
  createdBy: string,
  tipo: string,
  descricao: string,
) {
  await supabase.from("crm_lead_events").insert({
    lead_id: leadId,
    created_by: createdBy,
    tipo,
    descricao,
  });
}

// ==========================================
// HOOK
// ==========================================

export function useCrmLeads(config: CrmConfig | null) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: QUERY_KEYS.CRM_LEADS,
    queryFn: carregarLeads,
  });

  /** Leads com todos os campos calculados pelo motor. */
  const leads = useMemo<CrmLeadComputed[]>(() => {
    if (!config || !query.data) return [];
    return query.data.map((lead) => ({
      ...lead,
      derived: derivar(lead, config.stages, config.settings),
    }));
  }, [query.data, config]);

  const erro = (contexto: string) => (error: Error) => {
    toast({
      title: "Não foi possível salvar",
      description: getSafeErrorMessage(error, contexto),
      variant: "destructive",
    });
  };

  // --- Criar lead (cria o cliente junto) ---
  const criarLead = useMutation({
    mutationFn: async (input: NovoLeadInput) => {
      const createdBy = await usuarioAtual();

      const { data: cliente, error: erroCliente } = await supabase
        .from("clients")
        .insert({
          nome: input.nome.trim(),
          telefone: input.telefone.trim(),
          email: input.email?.trim() || null,
          created_by: createdBy,
        })
        .select("id")
        .single();

      if (erroCliente) throw erroCliente;

      const { data: lead, error: erroLead } = await supabase
        .from("crm_leads")
        .insert({
          client_id: cliente.id,
          created_by: createdBy,
          entrada: input.entrada,
          origem: input.origem || null,
          // A entrada é a data da sua primeira mensagem: é o relógio inicial.
          ultima_msg: input.entrada,
          observacoes: input.observacoes?.trim() || null,
        })
        .select("id")
        .single();

      if (erroLead) throw erroLead;

      // Primeira etapa já entra como "aguardando": a saudação foi enviada.
      const primeiraEtapa = config?.stages[0];
      const aguardando = primeiraEtapa?.outcomes.find(
        (o) => o.semantica === "aguardando",
      );

      if (primeiraEtapa && aguardando) {
        await supabase.from("crm_lead_stages").insert({
          lead_id: lead.id,
          stage_id: primeiraEtapa.id,
          outcome_id: aguardando.id,
        });
      }

      await registrarEvento(lead.id, createdBy, "criado", "Lead cadastrado");
      return lead.id;
    },
    onSuccess: () => {
      invalidateQueries.crmLeads();
      invalidateQueries.clients();
      toast({ title: "Lead cadastrado!" });
    },
    onError: erro("criarLead"),
  });

  // --- Registrar o resultado de uma etapa ---
  const registrarEtapa = useMutation({
    mutationFn: async (args: {
      lead: CrmLeadComputed;
      stageId: string;
      outcomeId: string | null;
    }) => {
      const { lead, stageId, outcomeId } = args;
      const createdBy = await usuarioAtual();

      const stage = config?.stages.find((s) => s.id === stageId);
      const outcome = stage?.outcomes.find((o) => o.id === outcomeId);

      if (outcomeId === null) {
        const { error } = await supabase
          .from("crm_lead_stages")
          .delete()
          .eq("lead_id", lead.id)
          .eq("stage_id", stageId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("crm_lead_stages")
          .upsert(
            {
              lead_id: lead.id,
              stage_id: stageId,
              outcome_id: outcomeId,
              registrado_em: new Date().toISOString(),
            },
            { onConflict: "lead_id,stage_id" },
          );
        if (error) throw error;
      }

      // Efeitos colaterais no lead, conforme a semântica do resultado.
      const patch: AtualizarLeadInput = {};

      // O passo pendente mudou, então a data ajustada na mão perde o sentido.
      if (lead.quando_manual) patch.quando_manual = null;

      if (outcome?.semantica === "aguardando" && !lead.ultima_msg_manual) {
        // Você acabou de enviar a mensagem desta etapa: o relógio reinicia.
        patch.ultima_msg = hoje();
      }

      if (outcome?.semantica === "agendou" && !lead.compareceu) {
        patch.compareceu = "pendente";
      }

      if (outcome?.semantica === "recusou" || outcome?.semantica === "ganhou") {
        patch.encerrado_em = hoje();
      }

      if (outcome?.semantica === "voltou_fup") {
        // O lead voltou: fecha o ciclo de follow-up atual preservando o
        // histórico, para que um novo travamento comece um ciclo limpo.
        const temRegistros = lead.followups.some(
          (f) => f.ciclo === lead.fup_ciclo,
        );
        if (temRegistros) patch.fup_ciclo = lead.fup_ciclo + 1;
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase
          .from("crm_leads")
          .update(patch)
          .eq("id", lead.id);
        if (error) throw error;
      }

      const descricao = outcome
        ? `${stage?.nome}: ${outcome.label}`
        : `${stage?.nome}: resultado removido`;

      await registrarEvento(lead.id, createdBy, "etapa", descricao);
      return descricao;
    },
    onSuccess: (descricao) => {
      invalidateQueries.crmLeads();
      confirmar(descricao);
    },
    onError: erro("registrarEtapa"),
  });

  // --- Registrar o resultado de um follow-up ---
  const registrarFollowup = useMutation({
    mutationFn: async (args: {
      lead: CrmLeadComputed;
      numero: number;
      resultado: FollowupResultado | null;
    }) => {
      const { lead, numero, resultado } = args;
      const createdBy = await usuarioAtual();

      if (resultado === null) {
        const { error } = await supabase
          .from("crm_followups")
          .delete()
          .eq("lead_id", lead.id)
          .eq("ciclo", lead.fup_ciclo)
          .eq("numero", numero);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_followups").upsert(
          {
            lead_id: lead.id,
            ciclo: lead.fup_ciclo,
            numero,
            resultado,
            registrado_em: new Date().toISOString(),
          },
          { onConflict: "lead_id,ciclo,numero" },
        );
        if (error) throw error;
      }

      const patch: AtualizarLeadInput = {};
      // O follow-up seguinte tem data própria: a data ajustada na mão sai.
      if (lead.quando_manual) patch.quando_manual = null;
      if (resultado === "recusou") patch.encerrado_em = hoje();

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase
          .from("crm_leads")
          .update(patch)
          .eq("id", lead.id);
        if (error) throw error;
      }

      // Importante: enviar follow-up NÃO mexe em `ultima_msg`. Essa data é o
      // relógio da cadência — se ela andasse, os follow-ups se empurrariam.
      const descricao = resultado
        ? `FUP ${numero}: ${FOLLOWUP_LABELS[resultado]}`
        : `FUP ${numero}: resultado removido`;

      await registrarEvento(lead.id, createdBy, "followup", descricao);
      return descricao;
    },
    onSuccess: (descricao) => {
      invalidateQueries.crmLeads();
      confirmar(descricao);
    },
    onError: erro("registrarFollowup"),
  });

  // --- Atualizar campos do lead ---
  const atualizarLead = useMutation({
    mutationFn: async (args: { id: string; patch: AtualizarLeadInput }) => {
      const { error } = await supabase
        .from("crm_leads")
        .update(args.patch)
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries.crmLeads();
      confirmar("Alterações salvas");
    },
    onError: erro("atualizarLead"),
  });

  // --- Atualizar dados de contato (moram na tabela de clientes) ---
  const atualizarContato = useMutation({
    mutationFn: async (args: {
      clientId: string;
      patch: { nome?: string; telefone?: string; email?: string | null };
    }) => {
      const { error } = await supabase
        .from("clients")
        .update(args.patch)
        .eq("id", args.clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries.crmLeads();
      invalidateQueries.clients();
      confirmar("Alterações salvas");
    },
    onError: erro("atualizarContato"),
  });

  // --- Excluir lead (o cadastro do cliente permanece) ---
  const excluirLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries.crmLeads();
      toast({ title: "Lead excluído do CRM" });
    },
    onError: erro("excluirLead"),
  });

  return {
    leads,
    loading: query.isLoading,
    error: query.error,
    criarLead,
    registrarEtapa,
    registrarFollowup,
    atualizarLead,
    atualizarContato,
    excluirLead,
  };
}
