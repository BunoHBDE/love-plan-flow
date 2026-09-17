import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const SYSTEM_PROMPT = `Você é um analista de CRM do Sítio Canto da Mata, espaço de casamentos em São Lourenço da Serra (SP) que faz mini weddings diurnos para ATÉ 100 convidados, um evento por dia. Leia a conversa de WhatsApp entre a atendente (marcada [SITIO]) e o lead (marcado [NOIVA]) e diga onde o lead está.

FUNIL (8 etapas em ordem): Saudação, Perguntas, Proposta, Dúvidas, Convite para Visita, Visita Agendada, Pós-visita, Contrato.

Você devolve três coisas:

1. ETAPA — onde o lead ESTÁ AGORA. Não é a etapa que ele venceu, é onde ele parou. Se o Sítio mandou a proposta e espera resposta, a etapa é "Proposta".

2. ESTADO — uma de três palavras, só:
   - "parado": a conversa está naquela etapa e não andou. É o caso mais comum. Se a última mensagem foi do [SITIO], é quase sempre este.
   - "avancou": o lead acabou de chegar nessa etapa — deu a resposta que faltava, aceitou o convite, marcou a visita. Use só quando a última mensagem foi do [NOIVA] E ela de fato move o atendimento adiante; "ok, obrigada" não move nada.
   - "perdido": acabou. O lead desistiu (achou caro, escolheu outro lugar, disse que não quer mais) OU você não pode atender (mais de 100 convidados confirmados, data impossível, fora do escopo).

3. MOTIVO — obrigatório quando estado = "perdido", null nos outros casos. Escolha UM desta lista, exatamente como está escrito:
   Preço | Data indisponível | Capacidade | Distância | Dúvida sobre o que está incluso | Escolheu outro local | Adiou o casamento | Mais de 100 convidados | Data impossível | Fora do escopo | Outro

REGRAS:
1. QUALIFICAÇÃO — tem prioridade sobre todas as outras:
   - "qualificado": convidados <= 100 E data possível.
   - "desqualificado": convidados > 100 confirmado, OU data definitivamente impossível, OU o lead não é um casal buscando casamento no Sítio.
   - "indefinido": falta informação, OU ainda há negociação em aberto (ex.: a data pedida está ocupada mas o Sítio ofereceu alternativa e aguarda resposta). Enquanto houver chance real, use "indefinido".
   - TRAVA OBRIGATÓRIA: se qualificacao = "desqualificado", então etapa = "Perguntas", estado = "perdido" e o motivo é o da lista de descarte ("Mais de 100 convidados", "Data impossível" ou "Fora do escopo"). Sempre. O lead não passou pela qualificação, logo NÃO avança para Proposta, Dúvidas, Convite, Visita, Pós-visita ou Contrato. Não importa que o Sítio tenha mandado tabela de preços ou link de agendamento: continuar atendendo por educação não move o funil.
   - Erros reais que você NÃO deve repetir: lead com 110 convidados classificado em "Convite para Visita"; lead com 200 convidados em "Dúvidas". Os dois são "Perguntas"/"perdido"/"Mais de 100 convidados".
2. Nome real: extraia o nome do lead do TEXTO da conversa (ex: "me chamo Guilherme"), não de um nome comercial.
3. Infira pelo contexto mesmo em conversa curta.
4. NUNCA invente dados. Se a conversa não menciona um campo, deixe null.
5. DATA DO CASAMENTO — extraia SOMENTE o que a NOIVA disse. O que o SÍTIO escreve nunca é a data dela.
   - A primeira linha da conversa diz que dia é hoje. Use-a para resolver referências relativas: "ano que vem", "desse ano", "daqui a dois anos". Se ela disser um mês que já passou neste ano, é do ano que vem.
   - Formato: mes_evento com dois dígitos (01=janeiro ... 12=dezembro), ano_evento com 4 dígitos, dia_evento como número ou null.
   - NUNCA tire data de mensagem marcada [SITIO]. Em especial, IGNORE: "proposta para casamentos em 2027" (é a nossa tabela de preços); "nossa visita marcada para esse domingo (23/08)" e qualquer agendamento de visita; "reajuste a partir de setembro".
   - FAIXA de meses ("setembro a dezembro"): NÃO escolha um mês. Deixe mes_evento null e preencha só o ano.
   - mes_evento só existe acompanhado de ano_evento. Se souber o mês mas não o ano, os dois vão null.
   - Dois dias possíveis ("29 ou 30 de maio"): dia_evento null, mês e ano preenchidos.
   - Se ela disser que ainda não tem data, os três vão null.
   - Se ela mudar de ideia ao longo da conversa, vale a ÚLTIMA data que ela disse.
6. CONVIDADOS: se faixa ('90 a 100'), convidados_texto = faixa e convidados_num = maior valor. Se número único, os dois iguais.
7. CIDADE: é a cidade onde o LEAD mora, dita por ele na conversa. NUNCA preencha com "São Lourenço da Serra" só porque é a cidade do Sítio — essa informação está neste prompt, não na conversa. Se a conversa não disser de onde o lead é, cidade = null.
8. Se a conversa estiver confusa, com papéis trocados, ou sem segurança, use precisa_revisao=true e confianca baixa.
9. CANCELAR OU REMARCAR A VISITA NÃO É PERDER O LEAD. Se a noiva cancela a visita, diz que não pode no dia, ou pede outra data, e a conversa segue viva, a etapa é "Convite para Visita" com estado "parado". A visita deixa de existir, o convite volta a estar de pé esperando ela escolher um dia.
   Falas reais que NÃO são perda: "Pode cancelar por favor"; "Não vamos conseguir ir"; "Fora amanhã, quando você consegue?"; "Quando tiver desistência você entra em contato comigo?".
   "perdido" é só quando ela desiste do Sítio. Na dúvida, use "Convite para Visita"/"parado": manter um lead vivo custa uma mensagem, encerrar um lead vivo custa o casamento.

Responda APENAS em JSON válido, sem texto fora do JSON:
{"etapa":"...","estado":"parado|avancou|perdido","motivo":"... ou null","qualificacao":"qualificado|desqualificado|indefinido","nome_extraido":"... ou null","convidados_texto":"... ou null","convidados_num":0 ou null,"dia_evento":"... ou null","mes_evento":"01-12 ou null","ano_evento":"AAAA ou null","cidade":"... ou null","confianca":0.0,"precisa_revisao":false,"justificativa":"1 frase curta"}`;

async function classificarConversa(conversa: string): Promise<any> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: conversa }],
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const texto = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  return JSON.parse(texto.replace(/```json/g, "").replace(/```/g, "").trim());
}

// Trava determinística: quem foi descartado não avança no funil. Se a IA
// desqualificar o lead mas ainda assim empurrar a etapa adiante, corrigimos.
const MOTIVOS_DESCARTE = ["Mais de 100 convidados", "Data impossível", "Fora do escopo"];

function aplicarTravaDesqualificado(c: any): any {
  if (c?.qualificacao !== "desqualificado") return c;
  if (c.etapa === "Perguntas" && c.estado === "perdido") {
    if (!MOTIVOS_DESCARTE.includes(c.motivo)) c.motivo = "Fora do escopo";
    return c;
  }
  const antes = `${c.etapa}/${c.estado}`;
  c.etapa = "Perguntas";
  c.estado = "perdido";
  if (!MOTIVOS_DESCARTE.includes(c.motivo)) c.motivo = "Fora do escopo";
  c.justificativa = `[trava desqualificado: IA sugeriu ${antes}] ${c.justificativa ?? ""}`.trim();
  return c;
}

// Perder um lead sem dizer por quê é o buraco que este redesenho veio tapar:
// 289 recusas na base, 13 com motivo. Se a IA encerra sem motivo, o motivo
// vira "Outro" — que é honesto — em vez de ficar nulo e sumir do relatório.
function exigirMotivo(c: any): any {
  if (c?.estado === "perdido" && !c.motivo) c.motivo = "Outro";
  if (c?.estado !== "perdido") c.motivo = null;
  return c;
}

function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// A cidade so vale se estiver escrita na conversa. Sem esta trava a IA
// devolve "Sao Lourenco da Serra" mesmo quando o lead nunca disse de onde e:
// a cidade do Sitio esta no prompt, e o modelo a repete como se fosse dado.
function validarCidade(c: any, conversa: string): any {
  if (!c?.cidade) return c;
  if (!normalizar(conversa).includes(normalizar(String(c.cidade)))) c.cidade = null;
  return c;
}

// O ano so vale se vier da noiva. Sem esta trava a IA le "proposta para
// casamentos em 2027" — mensagem NOSSA — e devolve 2027 como se ela tivesse
// dito, invertendo a precedencia: o ano da proposta so pode entrar pela
// cascata no banco, e so quando o lead nao tem data nenhuma.
const INDICIO_TEMPORAL =
  /(\b20[2-9]\d\b|janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|ano\s*(que|q)\s*vem|pr[oó]x|daqui|ano seguinte)/i;

function validarAnoDaNoiva(c: any, textoNoiva: string, textoSitio: string): any {
  if (!c?.ano_evento) return c;
  const ano = String(c.ano_evento);
  if (textoNoiva.includes(ano)) return c;           // ela disse o ano
  // Ela pode ter dito o tempo de outro jeito ("ano q vem", "setembro a
  // dezembro"). Na duvida a trava se cala: derrubar um ano legitimo custa
  // mais do que deixar passar um que a cascata no banco ainda filtra.
  if (INDICIO_TEMPORAL.test(textoNoiva)) return c;
  if (textoSitio.includes(ano)) c.ano_evento = null;
  return c;
}

// Quem falou por ultimo decide entre 'avancou' e 'parado'. O proprio prompt ja
// diz isso, e mesmo assim 6 dos 11 leads marcados como 'respondeu' no modelo
// antigo tinham o Sitio falando por ultimo. Regra mecanica: codigo verifica
// melhor do que instrucao em prosa.
//
// So corrigimos nesse sentido. O inverso - virar 'parado' em 'avancou' porque
// a noiva falou por ultimo - avancaria o funil por conta propria, e a ultima
// fala dela pode ser um "ok, obrigada" que nao responde nada.
function validarEstadoPelaUltima(c: any, ultimaDe: string): any {
  if (c?.estado === "avancou" && ultimaDe === "sitio") {
    c.estado = "parado";
    c.justificativa =
      `[trava: 'avancou' com o Sitio falando por ultimo] ${c.justificativa ?? ""}`.trim();
  }
  return c;
}

Deno.serve(async (req: Request) => {
  const debug: any = {};
  try {
    let leadFilter: string[] | null = null;
    try { const b = await req.json(); if (Array.isArray(b?.lead_ids)) leadFilter = b.lead_ids; } catch {}

    // Busca leads com mensagens. Se não houver filtro explícito, processa
    // apenas leads com mensagens novas desde a última sugestão (para o cron 3x/dia).
    let leadIds: string[] = [];
    if (leadFilter) {
      leadIds = leadFilter;
    } else {
      // leads cuja mensagem mais recente é posterior à última sugestão (ou sem sugestão ainda)
      const { data: novos, error: eN } = await supabase.rpc("leads_para_reclassificar");
      if (eN) { debug.eN = eN.message; return json(debug, 500); }
      leadIds = (novos ?? []).map((r: any) => r.lead_id);
    }
    debug.leadIds = leadIds.length;

    const resultados: any[] = [];
    for (const leadId of leadIds) {
      const { data: msgs } = await supabase.from("messages")
        .select("direction, body, msg_type, sent_at")
        .eq("crm_lead_id", leadId).order("sent_at", { ascending: true });
      if (!msgs || msgs.length === 0) { resultados.push({ leadId, ok:false, motivo:"sem msgs" }); continue; }

      const linhas = msgs.map((m: any) =>
        (m.direction === "inbound" ? "[NOIVA] " : "[SITIO] ") + (m.body ?? `(${m.msg_type})`));
      // Sem isto o modelo nao resolve "desse ano" nem "ano que vem": ele nao
      // tem relogio. Foi o que fez "20 de novembro, desse ano" virar 2024.
      const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const conversa = `Hoje e ${hoje}.\n\n` + linhas.join("\n");
      const textoNoiva = msgs.filter((m: any) => m.direction === "inbound")
        .map((m: any) => m.body ?? "").join("\n");
      const textoSitio = msgs.filter((m: any) => m.direction === "outbound")
        .map((m: any) => m.body ?? "").join("\n");
      const inbound = msgs.filter((m: any) => m.direction === "inbound");
      const outbound = msgs.filter((m: any) => m.direction === "outbound");
      const ultimaGeral = msgs[msgs.length-1];

      try {
        const ultimaDe = ultimaGeral.direction === "inbound" ? "noiva" : "sitio";
        const c = exigirMotivo(validarEstadoPelaUltima(
          validarAnoDaNoiva(
            validarCidade(
              aplicarTravaDesqualificado(await classificarConversa(conversa)), conversa),
            textoNoiva, textoSitio),
          ultimaDe));

        // A etapa é resolvida pelo nome. Se o modelo inventar uma etapa que
        // não existe, a sugestão vai para revisão manual em vez de passar
        // calada — sem stage_id a gravação não toca na posição do lead.
        const { data: stage } = await supabase.from("crm_stages")
          .select("id").eq("nome", c.etapa).eq("ativo", true).limit(1).maybeSingle();
        const stageId: string | null = stage?.id ?? null;
        if (!stageId) c.precisa_revisao = true;

        const { error: eIns } = await supabase.from("ia_sugestoes").insert({
          lead_id: leadId,
          etapa_sugerida: c.etapa,
          stage_id_sugerido: stageId,
          estado_sugerido: c.estado,
          motivo_sugerido: c.motivo,
          qualificacao: c.qualificacao,
          nome_extraido: c.nome_extraido,
          convidados_extraido: c.convidados_texto,
          convidados_num_extraido: c.convidados_num,
          mes_evento_extraido: c.mes_evento,
          ano_evento_extraido: c.ano_evento,
          data_evento_extraida: c.dia_evento,
          cidade_extraida: c.cidade,
          confianca: c.confianca,
          precisa_revisao: c.precisa_revisao,
          justificativa: c.justificativa,
          analisado_ate: ultimaGeral.sent_at,
          qtd_mensagens: msgs.length,
          ultima_msg_noiva: inbound.length ? inbound[inbound.length-1].sent_at : null,
          ultima_msg_sitio: outbound.length ? outbound[outbound.length-1].sent_at : null,
          ultima_de: ultimaDe,
        });
        if (eIns) resultados.push({ leadId, ok:false, insertErro: eIns.message });
        else resultados.push({ leadId, ok:true, etapa:c.etapa, estado:c.estado });
      } catch (err) { resultados.push({ leadId, ok:false, erro: String(err) }); }
    }
    debug.resultados = resultados;
    return json(debug, 200);
  } catch (fatal) { debug.fatal = String(fatal); return json(debug, 500); }
});

function json(obj: any, status: number) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
