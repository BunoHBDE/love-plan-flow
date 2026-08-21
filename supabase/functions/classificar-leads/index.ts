import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const SYSTEM_PROMPT = `Você é um analista de CRM do Sítio Canto da Mata, espaço de casamentos em São Lourenço da Serra (SP) que faz mini weddings diurnos para ATÉ 100 convidados, um evento por dia. Leia a conversa de WhatsApp entre a atendente (marcada [SITIO]) e o lead (marcado [NOIVA]) e classifique em que ponto do funil o lead está.

FUNIL (8 etapas em ordem): Saudação, Perguntas, Proposta, Dúvidas, Convite para Visita, Visita Agendada, Pós-visita, Contrato.

COMBINAÇÕES VÁLIDAS (etapa -> semânticas aceitas). Use SOMENTE uma combinação desta lista; qualquer outra é inválida:
- Saudação: aguardando, respondeu, silencio, voltou_fup
- Perguntas: aguardando, respondeu, desqualificado, silencio
- Proposta: aguardando, respondeu, recusou, silencio, voltou_fup
- Dúvidas: aguardando, respondeu, recusou, silencio, voltou_fup
- Convite para Visita: aguardando, respondeu, recusou, recuou, silencio, voltou_fup
- Visita Agendada: agendou, recusou, silencio, voltou_fup  (ATENÇÃO: não existe 'aguardando' nem 'respondeu' aqui — se a visita está marcada e o dia ainda não chegou, a semântica é 'agendou')
- Pós-visita: aguardando, respondeu, recusou, silencio, voltou_fup
- Contrato: aguardando, ganhou, pendencia, recusou, silencio, voltou_fup

SEMÂNTICAS possíveis por resultado:
- aguardando: mensagem enviada pelo Sítio, esperando resposta do lead. IMPORTANTE: se a última mensagem da conversa foi do [SITIO], a semântica é quase sempre 'aguardando' (o Sítio respondeu e espera a reação do lead), MESMO que a conversa esteja ativa com troca de dúvidas. EXCEÇÃO: leads desqualificados nunca ficam 'aguardando' — ver REGRA 1.
- respondeu: use só quando a última mensagem foi do [NOIVA] e a etapa avança (o lead deu a resposta que faltava).
- silencio: o lead parou de responder há tempo.
- desqualificado: existe SOMENTE na etapa Perguntas — lead não serve (convidados > 100, data impossível, ou fora do escopo). Descarte do Sítio.
- recusou: da Proposta em diante — o lead disse não (geralmente preço). Decisão do lead.
- agendou / ganhou / pendencia / voltou_fup / recuou: casos das etapas finais.

REGRAS:
1. QUALIFICAÇÃO E TRAVA DE ETAPA — esta é a regra mais importante, ela tem prioridade sobre todas as outras:
   - "qualificado": convidados <= 100 E data possível.
   - "desqualificado": convidados > 100 confirmado, OU data definitivamente impossível, OU o lead não é um casal buscando casamento no Sítio (fora do escopo).
   - "indefinido": falta informação, OU ainda há negociação em aberto (ex.: a data pedida está ocupada mas o Sítio ofereceu alternativa e aguarda resposta). Enquanto houver chance real, use "indefinido", não "desqualificado".
   - TRAVA OBRIGATÓRIA: se qualificacao = "desqualificado", então etapa = "Perguntas" E semantica = "desqualificado". Sempre. O lead não passou pela qualificação, logo NÃO avança para Proposta, Dúvidas, Convite para Visita, Visita Agendada, Pós-visita ou Contrato. Não importa que o Sítio tenha enviado tabela de preços, link de agendamento ou que a conversa tenha continuado depois: continuar atendendo por educação não move o funil.
   - Erros reais que você NÃO deve repetir: lead com 110 convidados classificado como "Convite para Visita"/"aguardando"; lead com 200 convidados classificado como "Dúvidas"/"aguardando". Os dois corretos são "Perguntas"/"desqualificado".
   - Inversamente: se você escolher etapa "Perguntas" com semantica "desqualificado", então qualificacao tem que ser "desqualificado".
2. Nome real: extraia o nome do lead do TEXTO da conversa (ex: "me chamo Guilherme"), não de um nome comercial.
3. Infira pelo contexto mesmo em conversa curta.
4. NUNCA invente dados. Se a conversa não menciona um campo, deixe null.
5. DATA DO CASAMENTO: extraia mes_evento, ano_evento e dia_evento SEPARADOS. mes_evento SEMPRE como número de dois dígitos: 01=janeiro, 02=fevereiro, 03=março, 04=abril, 05=maio, 06=junho, 07=julho, 08=agosto, 09=setembro, 10=outubro, 11=novembro, 12=dezembro. ano_evento com 4 dígitos (ex '2027'). dia_evento como número (ex '18') ou null. Preencha só o que a conversa disser explicitamente — se só disse mês e ano, dia_evento=null; se só o ano, mes_evento=null. NUNCA invente. NÃO confunda data do CASAMENTO com data de uma VISITA/agendamento (ex: 'sabado dia 29' costuma ser visita). Só preencha se for claramente a data do casamento.
6. CONVIDADOS: se faixa ('90 a 100'), convidados_texto = faixa e convidados_num = maior valor. Se número único, os dois iguais.
7. CIDADE: é a cidade onde o LEAD mora / de onde ele vem, dita por ele na conversa. NUNCA preencha com "São Lourenço da Serra" só porque é a cidade do Sítio — essa informação está neste prompt, não na conversa. Só use "São Lourenço da Serra" se o próprio lead disser que mora lá. Se a conversa não disser de onde o lead é, cidade = null.
8. Se a conversa estiver confusa, com papéis trocados, ou sem segurança, use precisa_revisao=true e confianca baixa.

Responda APENAS em JSON válido, sem texto fora do JSON:
{"etapa":"...","semantica":"...","resultado_label":"...","qualificacao":"qualificado|desqualificado|indefinido","nome_extraido":"... ou null","convidados_texto":"... ou null","convidados_num":0 ou null,"dia_evento":"... ou null","mes_evento":"01-12 ou null","ano_evento":"AAAA ou null","cidade":"... ou null","confianca":0.0,"precisa_revisao":false,"justificativa":"1 frase curta"}`;

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

// Trava determinística: a semântica 'desqualificado' só existe na etapa Perguntas.
// Se a IA desqualificar o lead mas ainda assim avançar a etapa, corrigimos aqui.
function aplicarTravaDesqualificado(c: any): any {
  if (c?.qualificacao !== "desqualificado") return c;
  if (c.etapa === "Perguntas" && c.semantica === "desqualificado") return c;
  const antes = `${c.etapa}/${c.semantica}`;
  c.etapa = "Perguntas";
  c.semantica = "desqualificado";
  c.resultado_label = "Não qualificado";
  c.justificativa = `[trava desqualificado: IA sugeriu ${antes}] ${c.justificativa ?? ""}`.trim();
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

      const conversa = msgs.map((m: any) =>
        (m.direction === "inbound" ? "[NOIVA] " : "[SITIO] ") + (m.body ?? `(${m.msg_type})`)).join("\n");
      const inbound = msgs.filter((m: any) => m.direction === "inbound");
      const outbound = msgs.filter((m: any) => m.direction === "outbound");
      const ultimaGeral = msgs[msgs.length-1];

      try {
        const c = validarCidade(
          aplicarTravaDesqualificado(await classificarConversa(conversa)), conversa);
        // Uma etapa pode ter mais de um outcome com a mesma semântica
        // (ex: Dúvidas tem "Aguardando" e "Vai consultar", ambos 'aguardando').
        // Pegamos o de menor ordem — o resultado genérico da etapa.
        let outcomeId: string | null = null;
        const { data: outcome } = await supabase.from("crm_stage_outcomes")
          .select("id, ordem, crm_stages!inner(nome)")
          .eq("semantica", c.semantica).eq("crm_stages.nome", c.etapa)
          .order("ordem", { ascending: true }).limit(1).maybeSingle();
        if (outcome) outcomeId = outcome.id;
        // Combinação etapa+semântica inexistente no CRM: não dá para gravar,
        // então marcamos para revisão manual em vez de deixar passar calado.
        if (!outcomeId) c.precisa_revisao = true;

        const { error: eIns } = await supabase.from("ia_sugestoes").insert({
          lead_id: leadId,
          etapa_sugerida: c.etapa,
          outcome_id_sugerido: outcomeId,
          semantica_sugerida: c.semantica,
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
          ultima_de: ultimaGeral.direction === "inbound" ? "noiva" : "sitio",
        });
        if (eIns) resultados.push({ leadId, ok:false, insertErro: eIns.message });
        else resultados.push({ leadId, ok:true, etapa:c.etapa, semantica:c.semantica });
      } catch (err) { resultados.push({ leadId, ok:false, erro: String(err) }); }
    }
    debug.resultados = resultados;
    return json(debug, 200);
  } catch (fatal) { debug.fatal = String(fatal); return json(debug, 500); }
});

function json(obj: any, status: number) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
