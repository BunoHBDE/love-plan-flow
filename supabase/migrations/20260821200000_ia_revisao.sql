-- ============================================================================
-- PAINEL DE REVISÃO DAS SUGESTÕES DA IA
-- ============================================================================
--
-- A gravação já existia (aplicar_sugestoes_ia), mas só dava para chamar do
-- banco. Aqui abrimos ela para a tela de CRM, com o cuidado de não criar um
-- atalho que fure o RLS: as duas funções passam a rodar como SECURITY INVOKER,
-- então cada usuário só enxerga e altera os leads que já são dele pelas
-- políticas normais das tabelas.

-- `ia_sugestoes` tinha RLS ligado e nenhuma política, ou seja: ninguém lia.
-- A sugestão pertence a quem é dono do lead.
create policy "Users read own ia_sugestoes" on ia_sugestoes
  for select using (
    exists (select 1 from crm_leads l
             where l.id = ia_sugestoes.lead_id
               and (l.created_by = auth.uid() or has_role(auth.uid(), 'admin'::app_role))));

-- Aprovar/rejeitar na tela mexe só no status da sugestão.
create policy "Users update own ia_sugestoes" on ia_sugestoes
  for update using (
    exists (select 1 from crm_leads l
             where l.id = ia_sugestoes.lead_id
               and (l.created_by = auth.uid() or has_role(auth.uid(), 'admin'::app_role))))
  with check (
    exists (select 1 from crm_leads l
             where l.id = ia_sugestoes.lead_id
               and (l.created_by = auth.uid() or has_role(auth.uid(), 'admin'::app_role))));

alter function aplicar_sugestoes_ia(uuid[], numeric, boolean) security invoker;
alter function reverter_evento_ia(uuid) security invoker;

grant execute on function aplicar_sugestoes_ia(uuid[], numeric, boolean) to authenticated;
grant execute on function reverter_evento_ia(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- A lista que a tela mostra: uma linha por lead, com a última sugestão da IA e
-- o diff contra o CRM de agora.
--
-- Para o que ainda não foi aplicado, o diff vem da simulação (dry run) — é o
-- que aconteceria se você aprovasse. Para o que já foi aplicado, vem do evento
-- gravado, que é o que de fato mudou e o que a reversão desfaz.
-- ----------------------------------------------------------------------------
create or replace function ia_revisao_lista()
returns table (
  lead_id      uuid,
  sugestao_id  uuid,
  lead_nome    text,
  etapa        text,
  semantica    text,
  qualificacao text,
  confianca    numeric,
  precisa_revisao boolean,
  justificativa   text,
  qtd_mensagens   int,
  analisado_ate   timestamptz,
  status       text,
  resultado_label text,
  campos       jsonb,
  antes        jsonb,
  depois       jsonb,
  evento_id    uuid,
  aplicado_em  timestamptz
)
language sql
security invoker
set search_path = public
stable
as $$
  with sim as (
    -- corte 0: a tela mostra tudo e você decide, inclusive o de confiança baixa
    select * from aplicar_sugestoes_ia(null, 0, true)
  ),
  ult as (
    select distinct on (lead_id) * from ia_sugestoes order by lead_id, created_at desc
  ),
  ev as (
    select distinct on (meta->>'sugestao_id')
           id, meta, created_at
      from crm_lead_events
     where tipo = 'ia' and coalesce((meta->>'revertido')::boolean, false) = false
     order by meta->>'sugestao_id', created_at desc
  )
  select
    ult.lead_id,
    ult.id,
    c.nome,
    ult.etapa_sugerida,
    ult.semantica_sugerida,
    ult.qualificacao,
    ult.confianca,
    ult.precisa_revisao,
    ult.justificativa,
    ult.qtd_mensagens,
    ult.analisado_ate,
    ult.status,
    o.label,
    coalesce(ev.meta->'campos',  sim.alteracoes->'campos',  '[]'::jsonb),
    coalesce(ev.meta->'antes',   sim.alteracoes->'antes',   '{}'::jsonb),
    coalesce(ev.meta->'depois',  sim.alteracoes->'depois',  '{}'::jsonb),
    ev.id,
    ev.created_at
  from ult
  join crm_leads l on l.id = ult.lead_id
  join clients   c on c.id = l.client_id
  left join crm_stage_outcomes o on o.id = ult.outcome_id_sugerido
  left join sim on sim.sugestao_id = ult.id
  left join ev  on (ev.meta->>'sugestao_id')::uuid = ult.id
$$;

grant execute on function ia_revisao_lista() to authenticated;
