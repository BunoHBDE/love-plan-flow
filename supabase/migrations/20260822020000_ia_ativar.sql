-- ============================================================================
-- ATIVAÇÃO: a IA passa a gravar sozinha
-- ============================================================================
--
-- Até aqui o cron só classificava — escrevia em `ia_sugestoes` e parava ali.
-- Toda gravação no CRM foi feita a mão, rodando aplicar_sugestoes_ia por fora.
-- Ativar é fechar esse último elo.
--
-- O que protege a gravação automática, em ordem de importância:
--   1. etapa preenchida a mão é intocável (103 dos 137 leads hoje);
--   2. campo que a IA não extraiu nunca apaga o que já existe;
--   3. `observacoes` nunca é tocada;
--   4. a cascata da data, com suas travas de mês, ano e precisão;
--   5. todo lead alterado gera evento reversível em `crm_lead_events`.
--
-- O corte de 0.80 é o filtro mais fraco dos cinco, e está aqui mais por
-- prudência do que por evidência: a amostra manual mostrou que a confiança
-- mede "a conversa é complicada", não "acertei". Quem faz o trabalho pesado
-- são as travas determinísticas.

-- Os dois estágios saem do stand by: o padrão passa a ser gravar tudo.
do $outer$
declare src text;
begin
  select prosrc into src from pg_proc where proname='aplicar_sugestoes_ia';
  execute format(
    'create or replace function aplicar_sugestoes_ia(p_lead_ids uuid[] default null, '
    'p_confianca_min numeric default 0.90, p_dry_run boolean default true, '
    'p_gravar_data boolean default true, p_gravar_etapa boolean default true) '
    'returns table (lead_id uuid, sugestao_id uuid, aplicado boolean, motivo text, alteracoes jsonb) '
    'language plpgsql security invoker set search_path = public as %L', src);
end $outer$;

-- Meia hora depois de cada classificação (11h, 17h e 23h UTC), para dar tempo
-- de todos os lotes terminarem.
select cron.schedule('aplicar-sugestoes-ia-3x-dia', '30 11,17,23 * * *', $j$
  select count(*) from aplicar_sugestoes_ia(null, 0.80, false, true, true);
$j$);
