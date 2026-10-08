import { createClient } from "jsr:@supabase/supabase-js@2";

// Token secreto usado na verificacao do webhook (deve ser identico ao
// campo "Verificar token" preenchido no painel da Meta). Configurado
// como secret do projeto: WHATSAPP_VERIFY_TOKEN.
//
// O trim e proposital: colar o token no painel da Meta ou no secret do
// Supabase costuma arrastar um espaco ou uma quebra de linha no fim. Os
// dois valores ficam visualmente identicos e a comparacao falha, e o
// handshake volta 403 sem explicar o motivo.
const VERIFY_TOKEN = (Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "").trim();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/**
 * Impressao digital de uma string: SHA-256 truncado em 12 hex.
 * Serve para comparar valores no log sem registrar o valor em si —
 * o hash nao volta para a string de origem.
 */
async function digital(valor: string): Promise<string> {
  if (valor === "") return "(vazio)";
  const bytes = new TextEncoder().encode(valor);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // --- Handshake de verificacao (GET) ---
  // A Meta chama esse endpoint com esses query params na hora de
  // ativar a assinatura do webhook no painel.
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = (url.searchParams.get("hub.verify_token") ?? "").trim();
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }

    // Diagnostico do 403. A Meta so mostra "nao foi possivel validar",
    // sem dizer qual das condicoes falhou, entao o log precisa dizer.
    // Nunca registra o conteudo dos tokens: so o tamanho, o veredito e
    // uma impressao digital (SHA-256 truncado), que identifica QUAL
    // valor esta guardado sem permitir reconstruir o valor a partir do
    // log. E o que separa "o secret nao foi atualizado" de "o secret
    // esta certo e o problema e outro".
    console.error("whatsapp-webhook: handshake recusado", JSON.stringify({
      modo: mode,
      tem_challenge: challenge !== null,
      tamanho_token_recebido: token.length,
      tamanho_token_esperado: VERIFY_TOKEN.length,
      secret_configurado: VERIFY_TOKEN !== "",
      tokens_conferem: token === VERIFY_TOKEN,
      digital_recebido: await digital(token),
      digital_esperado: await digital(VERIFY_TOKEN),
    }));

    return new Response("Forbidden", { status: 403 });
  }

  // --- Recebimento de eventos (POST) ---
  // Guarda o payload bruto, sem processar. A analise (IA + atualizacao
  // do CRM) roda separadamente, lendo os eventos nao processados desta
  // tabela. Isso mantem o webhook rapido, que e o que a Meta exige.
  if (req.method === "POST") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const { error } = await supabase.from("whatsapp_events").insert({
      payload: body,
    });

    if (error) {
      console.error("Erro ao salvar evento:", error.message);
      // Mesmo assim responde 200 pra Meta nao ficar reenviando o mesmo
      // evento em loop; o erro fica registrado no log da function.
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
