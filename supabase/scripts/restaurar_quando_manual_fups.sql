-- Restaura a "Data da Próxima Mensagem" (crm_leads.quando_manual) dos leads em
-- FUP que a IA zerou.
--
-- Contexto: `aplicar_sugestoes_ia` apagava `quando_manual` sempre que sugeria
-- uma etapa, e esse campo é onde o FUP grava hoje + N dias. O lead ficava com
-- o FUP aberto em `crm_fups` mas aparecia como atrasado. O dado original está
-- em `crm_fups.proxima_mensagem`.
--
-- Rode DEPOIS de aplicar a migration 20261005120000_ia_so_extrai_dados.sql;
-- antes dela, o próximo cron (11:30, 17:30, 23:30 UTC) zera as datas de novo.
--
-- Script de uso único, fora de supabase/migrations de propósito: corrige dados
-- de produção e não deve rodar em outros ambientes.
--
-- Só restaura quando TODAS as condições valem:
--   * o FUP é o mais recente aberto (`aguardando`) do lead;
--   * `quando_manual` está nulo — uma data que alguém pôs depois nunca é
--     sobrescrita;
--   * o lead não está encerrado;
--   * ninguém moveu o lead de etapa depois do FUP — avançar zera
--     `quando_manual` de propósito, porque o passo pendente mudou. O sinal é o
--     evento `etapa` em `crm_lead_events` (ação humana), NÃO
--     `crm_lead_stages.entrou_em`: a IA gravava `entrou_em` com o horário da
--     análise das mensagens, que pode cair segundos depois do FUP mesmo quando
--     a etapa foi movida pelo cron horas depois. Um filtro por `entrou_em`
--     deixava de fora leads que a IA tinha zerado (evento `ia`).

-- ------------------------------------------------------------------
-- 1. Simulação: o que seria restaurado (não altera nada)
-- ------------------------------------------------------------------
with ultimo as (
  select distinct on (f.lead_id)
         f.lead_id, f.id as fup_id, f.proxima_mensagem, f.iniciado_em, f.dias
    from public.crm_fups f
   where f.status = 'aguardando'
   order by f.lead_id, f.iniciado_em desc
)
select l.id as lead_id,
       c.telefone,
       u.dias            as fup_dias,
       u.iniciado_em     as fup_feito_em,
       u.proxima_mensagem as vai_restaurar_para
  from ultimo u
  join public.crm_leads l on l.id = u.lead_id
  join public.clients  c on c.id = l.client_id
 where l.quando_manual is null
   and l.encerramento is null
   and not exists (
         select 1 from public.crm_lead_events e
          where e.lead_id = l.id and e.tipo = 'etapa'
            and e.created_at > u.iniciado_em)
 order by u.iniciado_em;

-- ------------------------------------------------------------------
-- 2. Restauração (rode só depois de conferir a simulação)
-- ------------------------------------------------------------------
begin;

with ultimo as (
  select distinct on (f.lead_id)
         f.lead_id, f.proxima_mensagem, f.iniciado_em
    from public.crm_fups f
   where f.status = 'aguardando'
   order by f.lead_id, f.iniciado_em desc
)
update public.crm_leads l
   set quando_manual = u.proxima_mensagem
  from ultimo u
 where l.id = u.lead_id
   and l.quando_manual is null
   and l.encerramento is null
   and not exists (
         select 1 from public.crm_lead_events e
          where e.lead_id = l.id and e.tipo = 'etapa'
            and e.created_at > u.iniciado_em);

-- Confira o número de linhas afetadas antes de confirmar. Em produção, a
-- primeira rodada (05/10/2026) restaurou 31 leads e uma segunda (06/10/2026),
-- já com o filtro corrigido, mais 2. Se estiver certo: commit; senão: rollback.
commit;

-- ------------------------------------------------------------------
-- 3. Verificação: deve devolver zero linhas. Ficam de fora, de propósito,
--    os leads que uma pessoa moveu de etapa depois do FUP.
-- ------------------------------------------------------------------
select l.id, u.proxima_mensagem
  from (
    select distinct on (lead_id) lead_id, proxima_mensagem, iniciado_em
      from public.crm_fups
     where status = 'aguardando'
     order by lead_id, iniciado_em desc
  ) u
  join public.crm_leads l on l.id = u.lead_id
 where l.quando_manual is distinct from u.proxima_mensagem
   and l.encerramento is null
   and not exists (
         select 1 from public.crm_lead_events e
          where e.lead_id = l.id and e.tipo = 'etapa'
            and e.created_at > u.iniciado_em);
