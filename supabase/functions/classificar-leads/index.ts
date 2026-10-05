import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const SYSTEM_PROMPT = `Você é um analista de CRM do Sítio Canto da Mata, espaço de casamentos em São Lourenço da Serra (SP) que faz mini weddings diurnos para ATÉ 100 convidados, um evento por dia. Leia a conversa de WhatsApp entre a atendente (marcada [SITIO]) e o lead (marcado [NOIVA]) e extraia os dados do lead. Você NÃO decide etapa do funil, estado nem motivo de perda: isso é trabalho da atendente.

Você devolve estas coisas:

1. QUALIFICAÇÃO:
   - "qualificado": convidados <= 100 E data possível.
   - "desqualificado": convidados > 100 confirmado, OU data definitivamente impossível, OU o lead não é um casal buscando casamento no Sítio.
   - "indefinido": falta informação, OU ainda há negociação em aberto (ex.: a data pedida está ocupada mas o Sítio ofereceu alternativa e aguarda resposta). Enquanto houver chance real, use "indefinido".
2. Nome real: extraia o nome do lead do TEXTO da conversa (ex: "me chamo Guilherme"), não de um nome comercial.
3. CONVIDADOS: se faixa ('90 a 100'), convidados_texto = faixa e convidados_num = maior valor. Se número único, os dois iguais.
4. DATA DO CASAMENTO — extraia SOMENTE o que a NOIVA disse. O que o SÍTIO escreve nunca é a data dela.
   - A primeira linha da conversa diz que dia é hoje. Use-a para resolver referências relativas: "ano que vem", "desse ano", "daqui a dois anos". Se ela disser um mês que já passou neste ano, é do ano que vem.
   - Formato: mes_evento com dois dígitos (01=janeiro ... 12=dezembro), ano_evento com 4 dígitos, dia_evento como número ou null.
   - NUNCA tire data de mensagem marcada [SITIO]. Em especial, IGNORE: "proposta para casamentos em 2027" (é a nossa tabela de preços); "nossa visita marcada para esse domingo (23/08)" e qualquer agendamento de visita; "reajuste a partir de setembro".
   - FAIXA de meses ("setembro a dezembro"): NÃO escolha um mês. Deixe mes_evento null e preencha só o ano.
   - mes_evento só existe acompanhado de ano_evento. Se souber o mês mas não o ano, os dois vão null.
   - Dois dias possíveis ("29 ou 30 de maio"): dia_evento null, mês e ano preenchidos.
   - Se ela disser que ainda não tem data, os três vão null.
   - Se ela mudar de ideia ao longo da conversa, vale a ÚLTIMA data que ela disse.

REGRAS:
- NUNCA invente dados. Se a conversa não menciona um campo, deixe null.
- Infira pelo contexto mesmo em conversa curta.
- Se a conversa estiver confusa, com papéis trocados, ou sem segurança, use precisa_revisao=true e confianca baixa.

Responda APENAS em JSON válido, sem texto fora do JSON:
{"qualificacao":"qualificado|desqualificado|indefinido","nome_extraido":"... ou null","convidados_texto":"... ou null","convidados_num":0 ou null,"dia_evento":"... ou null","mes_evento":"01-12 ou null","ano_evento":"AAAA ou null","confianca":0.0,"precisa_revisao":false,"justificativa":"1 frase curta"}`;

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
        const c = validarAnoDaNoiva(await classificarConversa(conversa), textoNoiva, textoSitio);

        // A IA só extrai dados e qualificação. Etapa, estado e motivo de perda
        // ficam com a atendente, por isso não são gravados na sugestão.
        const { error: eIns } = await supabase.from("ia_sugestoes").insert({
          lead_id: leadId,
          qualificacao: c.qualificacao,
          nome_extraido: c.nome_extraido,
          convidados_extraido: c.convidados_texto,
          convidados_num_extraido: c.convidados_num,
          mes_evento_extraido: c.mes_evento,
          ano_evento_extraido: c.ano_evento,
          data_evento_extraida: c.dia_evento,
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
        else resultados.push({ leadId, ok:true, qualificacao:c.qualificacao });
      } catch (err) { resultados.push({ leadId, ok:false, erro: String(err) }); }
    }
    debug.resultados = resultados;
    return json(debug, 200);
  } catch (fatal) { debug.fatal = String(fatal); return json(debug, 500); }
});

function json(obj: any, status: number) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
