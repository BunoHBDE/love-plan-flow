/**
 * LEADS DO CRM
 *
 * O lead é sempre salvo como cliente: criar um lead cria o registro em
 * `clients` e o registro de atendimento em `crm_leads`.
 *
 * Os campos calculados (situação, próximo passo, quando) NÃO são gravados —
 * saem do motor em `@/lib/crm/engine` a cada leitura. Assim, mudar um
 * parâmetro recalcula a base inteira sem migração de dados.
 */

import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonner } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { QUERY_KEYS, invalidateQueries, queryClient } from "@/lib/queryClient";
import { derivar } from "@/lib/crm/engine";
import { hoje } from "@/lib/crm/dates";
import type {
  Compareceu,
  CrmConfig,
  CrmLead,
  CrmLeadComputed,
  DataEventoStatus,
} from "@/types/crm.types";

// ==========================================
// LEITURA
// ==========================================

const SELECT_LEAD = `
  id, client_id, entrada, origem, ultima_msg, ultima_msg_manual, quando_manual,
  data_agendamento, compareceu, convidados,
  data_evento_status, data_evento, mes_evento, ano_evento,
  motivo_objecao, encerrado_em, observacoes, arquivado, created_at,
  clients ( nome, telefone, email ),
  crm_lead_stages ( stage_id, outcome_id, registrado_em )
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
  entrada?: string;
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
  arquivado?: boolean;
}

async function usuarioAtual(): Promise<string> {
  // `getSession` lê da memória; `getUser` iria à rede a cada gravação.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Sessão expirada. Entre novamente.");
  return session.user.id;
}

/**
 * Confirmação curta do que foi gravado. O id fixo faz a mensagem nova
 * substituir a anterior, em vez de empilhar avisos a cada campo alterado.
 */
function confirmar(mensagem: string) {
  sonner.success(mensagem, { id: "crm-salvo", duration: 1800 });
}

/**
 * O evento é só trilha de auditoria: não precisa segurar a resposta ao
 * usuário. Dispara em segundo plano e apenas loga se falhar.
 */
function registrarEvento(
  leadId: string,
  createdBy: string,
  tipo: string,
  descricao: string,
) {
  void supabase
    .from("crm_lead_events")
    .insert({
      lead_id: leadId,
      created_by: createdBy,
      tipo,
      descricao,
    })
    .then(({ error }) => {
      if (error) console.error("crm: falha ao registrar evento", error);
    });
}

// ==========================================
// ATUALIZAÇÃO OTIMISTA
// ==========================================
//
// A tela reflete a mudança na hora, direto no cache; o refetch que vem no
// `onSettled` só confirma (ou corrige) o que o servidor gravou de fato.

interface ContextoOtimista {
  anterior: CrmLead[] | undefined;
}

async function iniciarOtimista(
  atualizar: (leads: CrmLead[]) => CrmLead[],
): Promise<ContextoOtimista> {
  await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CRM_LEADS });
  const anterior = queryClient.getQueryData<CrmLead[]>(QUERY_KEYS.CRM_LEADS);
  if (anterior) {
    queryClient.setQueryData<CrmLead[]>(
      QUERY_KEYS.CRM_LEADS,
      atualizar(anterior),
    );
  }
  return { anterior };
}

function reverterOtimista(contexto: ContextoOtimista | undefined) {
  if (contexto?.anterior) {
    queryClient.setQueryData(QUERY_KEYS.CRM_LEADS, contexto.anterior);
  }
}

/**
 * O que registrar um resultado de etapa muda no lead — tanto no banco quanto
 * no cache. É função pura para que a mutação e a atualização otimista
 * apliquem exatamente a mesma regra.
 */
function planejarEtapa(
  lead: CrmLeadComputed,
  stageId: string,
  outcomeId: string | null,
  config: CrmConfig | null,
) {
  const stage = config?.stages.find((s) => s.id === stageId);
  const outcome = stage?.outcomes.find((o) => o.id === outcomeId);

  let etapas = lead.etapas.filter((e) => e.stage_id !== stageId);
  if (outcomeId !== null) {
    etapas = [
      ...etapas,
      {
        stage_id: stageId,
        outcome_id: outcomeId,
        registrado_em: new Date().toISOString(),
      },
    ];
  }

  // O lead recuou para esta etapa: o que veio depois não vale mais.
  // É o "Faltou" — a visita não aconteceu, então o agendamento sai do
  // caminho para que um novo possa ser marcado. Sem isso o segundo
  // agendamento não teria onde entrar, já que cada etapa guarda um
  // resultado só.
  let posterioresRemovidos: string[] = [];
  if (outcome?.semantica === "recuou" && stage) {
    posterioresRemovidos = (config?.stages ?? [])
      .filter((s) => s.ordem > stage.ordem)
      .map((s) => s.id);
    if (posterioresRemovidos.length > 0) {
      etapas = etapas.filter((e) => !posterioresRemovidos.includes(e.stage_id));
    }
  }

  // Efeitos colaterais no lead, conforme a semântica do resultado.
  const patch: AtualizarLeadInput = {};

  if (outcome?.semantica === "recuou") {
    patch.data_agendamento = null;
    patch.compareceu = null;
    patch.encerrado_em = null;
  }

  // O passo pendente mudou, então a data ajustada na mão perde o sentido.
  if (lead.quando_manual) patch.quando_manual = null;

  if (outcome?.semantica === "aguardando" && !lead.ultima_msg_manual) {
    // Você acabou de enviar a mensagem desta etapa: o relógio reinicia.
    patch.ultima_msg = hoje();
  }

  if (outcome?.semantica === "agendou" && !lead.compareceu) {
    patch.compareceu = "pendente";
  }

  const encerra =
    outcome?.semantica === "recusou" ||
    outcome?.semantica === "desqualificado" ||
    outcome?.semantica === "ganhou";
  if (encerra) patch.encerrado_em = hoje();

  const descricao = outcome
    ? `${stage?.nome}: ${outcome.label}`
    : `${stage?.nome}: resultado removido`;

  return { etapas, patch, posterioresRemovidos, descricao };
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

      registrarEvento(lead.id, createdBy, "criado", "Lead cadastrado");
      return lead.id;
    },
    onSuccess: (_id, input) => {
      invalidateQueries.crmLeads();
      invalidateQueries.clients();
      // Cadastro em lote: confirma sem empilhar um aviso por contato.
      confirmar(`${input.nome.trim()} cadastrado`);
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
      const plano = planejarEtapa(lead, stageId, outcomeId, config);
      const createdBy = await usuarioAtual();

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

      if (plano.posterioresRemovidos.length > 0) {
        const { error } = await supabase
          .from("crm_lead_stages")
          .delete()
          .eq("lead_id", lead.id)
          .in("stage_id", plano.posterioresRemovidos);
        if (error) throw error;
      }

      if (Object.keys(plano.patch).length > 0) {
        const { error } = await supabase
          .from("crm_leads")
          .update(plano.patch)
          .eq("id", lead.id);
        if (error) throw error;
      }

      registrarEvento(lead.id, createdBy, "etapa", plano.descricao);
      return plano.descricao;
    },
    onMutate: ({ lead, stageId, outcomeId }) => {
      const plano = planejarEtapa(lead, stageId, outcomeId, config);
      return iniciarOtimista((leads) =>
        leads.map((l) =>
          l.id === lead.id ? { ...l, ...plano.patch, etapas: plano.etapas } : l,
        ),
      );
    },
    onSuccess: (descricao) => confirmar(descricao),
    onError: (error, _args, contexto) => {
      reverterOtimista(contexto);
      erro("registrarEtapa")(error);
    },
    onSettled: () => invalidateQueries.crmLeads(),
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
    onMutate: ({ id, patch }) =>
      iniciarOtimista((leads) =>
        leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      ),
    onSuccess: () => confirmar("Alterações salvas"),
    onError: (error, _args, contexto) => {
      reverterOtimista(contexto);
      erro("atualizarLead")(error);
    },
    onSettled: () => invalidateQueries.crmLeads(),
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
    onMutate: ({ clientId, patch }) =>
      iniciarOtimista((leads) =>
        leads.map((l) => (l.client_id === clientId ? { ...l, ...patch } : l)),
      ),
    onSuccess: () => confirmar("Alterações salvas"),
    onError: (error, _args, contexto) => {
      reverterOtimista(contexto);
      erro("atualizarContato")(error);
    },
    onSettled: () => {
      invalidateQueries.crmLeads();
      invalidateQueries.clients();
    },
  });

  // --- Excluir lead (o cadastro do cliente permanece) ---
  const excluirLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: (id) =>
      iniciarOtimista((leads) => leads.filter((l) => l.id !== id)),
    onSuccess: () => toast({ title: "Lead excluído do CRM" }),
    onError: (error, _id, contexto) => {
      reverterOtimista(contexto);
      erro("excluirLead")(error);
    },
    onSettled: () => invalidateQueries.crmLeads(),
  });

  return {
    leads,
    loading: query.isLoading,
    error: query.error,
    criarLead,
    registrarEtapa,
    atualizarLead,
    atualizarContato,
    excluirLead,
  };
}
