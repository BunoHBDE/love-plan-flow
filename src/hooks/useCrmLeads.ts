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
  CrmStage,
  CrmUltimaMensagem,
  DataEventoStatus,
  DirecaoMensagem,
  Encerramento,
} from "@/types/crm.types";

/**
 * Cliente sem tipos para `rpc()` — algumas funções (como `crm_ultima_mensagem`)
 * têm retorno em formato mais específico do que o gerado automaticamente
 * infere; o formato real está declarado abaixo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ==========================================
// LEITURA
// ==========================================

const SELECT_LEAD = `
  id, client_id, entrada, origem, ultima_msg, ultima_msg_manual, quando_manual,
  data_agendamento, compareceu, convidados,
  data_evento_status, data_evento, mes_evento, ano_evento,
  motivo_objecao, encerramento, encerrado_stage_id, encerrado_em,
  observacoes, campos_ia, arquivado, created_at,
  clients ( nome, telefone, email ),
  crm_lead_stages ( stage_id, entrou_em )
`;

interface UltimaMensagemRow {
  lead_id: string;
  direction: DirecaoMensagem;
  sent_at: string;
}

/**
 * A mensagem mais recente de cada lead, pela conversa real no WhatsApp — é o
 * que decide a Situação (Aguardando / Silêncio / Respondeu) no motor. Vem de
 * uma função estreita porque `messages` não é aberta para o front (ver
 * migration `crm_situacao_por_mensagem`).
 */
async function carregarUltimasMensagens(): Promise<
  Map<string, CrmUltimaMensagem>
> {
  const { data, error } = await db.rpc("crm_ultima_mensagem");
  if (error) throw error;

  const mapa = new Map<string, CrmUltimaMensagem>();
  ((data ?? []) as UltimaMensagemRow[]).forEach((row) => {
    mapa.set(row.lead_id, { direcao: row.direction, em: row.sent_at });
  });
  return mapa;
}

async function carregarLeads(): Promise<CrmLead[]> {
  const [{ data, error }, ultimasMensagens] = await Promise.all([
    supabase
      .from("crm_leads")
      .select(SELECT_LEAD)
      .eq("arquivado", false)
      .order("entrada", { ascending: false }),
    carregarUltimasMensagens(),
  ]);

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
      ultimaMensagem: ultimasMensagens.get(row.id) ?? null,
      quando_manual: row.quando_manual,
      data_agendamento: row.data_agendamento,
      compareceu: row.compareceu as Compareceu | null,
      data_evento_status: row.data_evento_status as DataEventoStatus,
      data_evento: row.data_evento,
      mes_evento: row.mes_evento,
      ano_evento: row.ano_evento,
      convidados: row.convidados,
      motivo_objecao: row.motivo_objecao,
      encerramento: row.encerramento as Encerramento | null,
      encerrado_stage_id: row.encerrado_stage_id,
      encerrado_em: row.encerrado_em,
      observacoes: row.observacoes,
      campos_ia: (row.campos_ia as Record<string, boolean> | null) ?? {},
      arquivado: row.arquivado,
      created_at: row.created_at,

      nome: cliente?.nome ?? "(sem nome)",
      telefone: cliente?.telefone ?? "",
      email: cliente?.email ?? null,

      etapas: (row.crm_lead_stages ?? []).map((e) => ({
        stage_id: e.stage_id,
        entrou_em: e.entrou_em,
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
  encerramento?: Encerramento | null;
  encerrado_stage_id?: string | null;
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
 * Quais chaves de `campos_ia` um patch humano invalida. Editar `convidados`
 * tira o símbolo de IA só de `convidados`; editar qualquer parte da data
 * (status, data fechada, mês ou ano) tira o de `data` inteiro, porque na
 * gaveta os três se editam como um campo só.
 */
function camposIaAfetados(patch: AtualizarLeadInput): string[] {
  const campos = new Set<string>();
  if ("convidados" in patch) campos.add("convidados");
  if ("observacoes" in patch) campos.add("observacoes");
  if (
    "data_evento" in patch ||
    "data_evento_status" in patch ||
    "mes_evento" in patch ||
    "ano_evento" in patch
  ) {
    campos.add("data");
  }
  return [...campos];
}

/**
 * Some da mão os campos que acabaram de ser editados por um humano —
 * silenciosamente, sem deixar marca: é exatamente o que foi pedido. Dispara
 * em segundo plano, igual a `registrarEvento`: não é o dado principal da
 * gravação, só o símbolo que mostra quem escreveu por último.
 */
function limparCamposIa(leadId: string, campos: string[]) {
  if (campos.length === 0) return;
  void db
    .rpc("crm_leads_limpar_campos_ia", { p_lead_id: leadId, p_campos: campos })
    .then(({ error }: { error: unknown }) => {
      if (error) console.error("crm: falha ao limpar campos_ia", error);
    });
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
 * O QUE CADA AÇÃO MUDA NO LEAD
 *
 * São funções puras para que a gravação e a atualização otimista apliquem
 * exatamente a mesma regra — a tela nunca mostra algo que o banco não vá
 * confirmar.
 *
 * Cada uma devolve a lista de entradas resultante, o patch do lead, as etapas
 * a remover e a frase que vai para a trilha de auditoria.
 */
/** O que a interface manda: o lead e para onde (ou como) movê-lo. */
export interface MoverArgs {
  lead: CrmLeadComputed;
  stageId?: string;
  encerramento?: Encerramento | null;
  motivo?: string | null;
}

interface Plano {
  etapas: CrmLead["etapas"];
  patch: AtualizarLeadInput;
  entrar: string | null;
  remover: string[];
  descricao: string;
}

/**
 * Avançar: o lead entra na etapa seguinte.
 *
 * `ultima_msg` reinicia junto, porque avançar quer dizer que houve conversa
 * hoje — é ela que faz o relógio do silêncio voltar a zero. Quem fixou a data
 * na mão (`ultima_msg_manual`) manda, e não é sobrescrito.
 */
function planejarAvanco(lead: CrmLeadComputed, destino: CrmStage): Plano {
  const patch: AtualizarLeadInput = {};

  if (!lead.ultima_msg_manual) patch.ultima_msg = hoje();
  // O passo pendente mudou, então a data ajustada na mão perde o sentido.
  if (lead.quando_manual) patch.quando_manual = null;

  return {
    etapas: [
      ...lead.etapas.filter((e) => e.stage_id !== destino.id),
      { stage_id: destino.id, entrou_em: new Date().toISOString() },
    ],
    patch,
    entrar: destino.id,
    remover: [],
    descricao: `Avançou para ${destino.nome}`,
  };
}

/**
 * Voltar: o lead volta para uma etapa anterior e o que veio depois é apagado.
 *
 * É o "faltou na visita" — que não é recusa: o lead continua vivo, o que não
 * aconteceu foi o compromisso. Por isso o agendamento sai do caminho, para
 * que um novo possa ser marcado; sem isso o segundo agendamento não teria
 * onde entrar, já que cada etapa guarda uma entrada só.
 */
function planejarVolta(
  lead: CrmLeadComputed,
  destino: CrmStage,
  stages: CrmStage[],
): Plano {
  const remover = stages
    .filter((s) => s.ordem > destino.ordem)
    .map((s) => s.id);

  return {
    etapas: lead.etapas.filter((e) => !remover.includes(e.stage_id)),
    patch: {
      data_agendamento: null,
      compareceu: null,
      encerramento: null,
      encerrado_stage_id: null,
      encerrado_em: null,
      quando_manual: null,
    },
    entrar: null,
    remover,
    descricao: `Voltou para ${destino.nome}`,
  };
}

/**
 * Encerrar: acabou, e fica gravado ONDE acabou.
 *
 * A etapa do encerramento é o dado que faltava para medir o gargalo — antes a
 * perda era registrada onde o menu daquela etapa permitia, e não onde de fato
 * aconteceu.
 */
function planejarEncerramento(
  lead: CrmLeadComputed,
  encerramento: Encerramento,
  motivo: string | null,
  stageId: string | null,
): Plano {
  const rotulos: Record<Encerramento, string> = {
    contratou: "Contratou",
    recusou: "Recusou",
    desqualificado: "Não qualificado",
  };

  return {
    etapas: lead.etapas,
    patch: {
      encerramento,
      encerrado_stage_id: stageId,
      encerrado_em: hoje(),
      motivo_objecao: motivo,
      quando_manual: null,
    },
    entrar: null,
    remover: [],
    descricao: motivo
      ? `${rotulos[encerramento]}: ${motivo}`
      : rotulos[encerramento],
  };
}

/** Reabrir um lead encerrado, quando ele volta a dar sinal de vida. */
function planejarReabertura(lead: CrmLeadComputed): Plano {
  return {
    etapas: lead.etapas,
    patch: {
      encerramento: null,
      encerrado_stage_id: null,
      encerrado_em: null,
      ultima_msg: lead.ultima_msg_manual ? undefined : hoje(),
    },
    entrar: null,
    remover: [],
    descricao: "Reaberto",
  };
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
    const hojeISO = hoje();
    return query.data.map((lead) => ({
      ...lead,
      derived: derivar(lead, config.stages, config.settings, hojeISO),
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

      // O lead nasce na primeira etapa: a saudação foi enviada.
      const primeiraEtapa = config?.stages[0];
      if (primeiraEtapa) {
        await supabase.from("crm_lead_stages").insert({
          lead_id: lead.id,
          stage_id: primeiraEtapa.id,
          entrou_em: new Date().toISOString(),
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

  // --- Avançar, voltar, encerrar ---
  //
  // As três compartilham a mesma mecânica de gravação porque são a mesma
  // operação vista de ângulos diferentes: mexer na posição do lead e nos
  // campos que aquela mexida implica. O que muda é só o plano.
  const aplicarPlano = async (lead: CrmLeadComputed, plano: Plano) => {
    const createdBy = await usuarioAtual();

    if (plano.entrar) {
      const { error } = await supabase
        .from("crm_lead_stages")
        .upsert(
          {
            lead_id: lead.id,
            stage_id: plano.entrar,
            entrou_em: new Date().toISOString(),
          },
          { onConflict: "lead_id,stage_id" },
        );
      if (error) throw error;
    }

    if (plano.remover.length > 0) {
      const { error } = await supabase
        .from("crm_lead_stages")
        .delete()
        .eq("lead_id", lead.id)
        .in("stage_id", plano.remover);
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
  };

  /**
   * As três mutações são a mesma coisa vista de ângulos diferentes: montam um
   * plano, aplicam no cache na hora e no banco em seguida. Só o plano muda.
   */
  const rodar = (
    contexto: string,
    montar: (args: MoverArgs) => Plano | null,
  ) => ({
    mutationFn: async (args: MoverArgs) => {
      const plano = montar(args);
      if (!plano) throw new Error("Não há para onde mover este lead.");
      return aplicarPlano(args.lead, plano);
    },
    onMutate: (args: MoverArgs) => {
      const plano = montar(args);
      if (!plano) return iniciarOtimista((leads) => leads);
      return iniciarOtimista((leads) =>
        leads.map((l) =>
          l.id === args.lead.id
            ? { ...l, ...plano.patch, etapas: plano.etapas }
            : l,
        ),
      );
    },
    onSuccess: (descricao: string) => confirmar(descricao),
    onError: (
      error: Error,
      _args: MoverArgs,
      ctx: ContextoOtimista | undefined,
    ) => {
      reverterOtimista(ctx);
      erro(contexto)(error);
    },
    onSettled: () => invalidateQueries.crmLeads(),
  });

  const avancar = useMutation(
    rodar("avancar", ({ lead, stageId }) => {
      const destino = stageId
        ? (config?.stages.find((s) => s.id === stageId) ?? null)
        : lead.derived.proximaEtapa;
      return destino ? planejarAvanco(lead, destino) : null;
    }),
  );

  const voltar = useMutation(
    rodar("voltar", ({ lead, stageId }) => {
      const destino = config?.stages.find((s) => s.id === stageId);
      return destino ? planejarVolta(lead, destino, config?.stages ?? []) : null;
    }),
  );

  const encerrar = useMutation(
    rodar("encerrar", ({ lead, encerramento, motivo }) =>
      encerramento
        ? planejarEncerramento(
            lead,
            encerramento,
            motivo ?? null,
            lead.derived.etapaAtual?.id ?? null,
          )
        : planejarReabertura(lead),
    ),
  );

  // --- Atualizar campos do lead ---
  const atualizarLead = useMutation({
    mutationFn: async (args: { id: string; patch: AtualizarLeadInput }) => {
      const { error } = await supabase
        .from("crm_leads")
        .update(args.patch)
        .eq("id", args.id);
      if (error) throw error;
      // Edição humana: some com o símbolo de IA dos campos que acabaram de
      // ser sobrescritos à mão, sem deixar marca nenhuma.
      limparCamposIa(args.id, camposIaAfetados(args.patch));
    },
    onMutate: ({ id, patch }) => {
      const afetados = camposIaAfetados(patch);
      return iniciarOtimista((leads) =>
        leads.map((l) =>
          l.id === id
            ? {
                ...l,
                ...patch,
                campos_ia: afetados.length
                  ? Object.fromEntries(
                      Object.entries(l.campos_ia).filter(
                        ([campo]) => !afetados.includes(campo),
                      ),
                    )
                  : l.campos_ia,
              }
            : l,
        ),
      );
    },
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
      leadId: string;
      patch: { nome?: string; telefone?: string; email?: string | null };
    }) => {
      const { error } = await supabase
        .from("clients")
        .update(args.patch)
        .eq("id", args.clientId);
      if (error) throw error;
      if ("nome" in args.patch) limparCamposIa(args.leadId, ["nome"]);
    },
    onMutate: ({ clientId, patch }) =>
      iniciarOtimista((leads) =>
        leads.map((l) =>
          l.client_id === clientId
            ? {
                ...l,
                ...patch,
                campos_ia:
                  "nome" in patch
                    ? Object.fromEntries(
                        Object.entries(l.campos_ia).filter(
                          ([campo]) => campo !== "nome",
                        ),
                      )
                    : l.campos_ia,
              }
            : l,
        ),
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
    avancar,
    voltar,
    encerrar,
    atualizarLead,
    atualizarContato,
    excluirLead,
  };
}
