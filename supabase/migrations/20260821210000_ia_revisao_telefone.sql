-- Telefone do contato na lista de revisão da IA.
--
-- Na tela, dois leads podem ter o mesmo primeiro nome ("Julia", "Maria"), e
-- é o número que diz qual conversa é qual. Como o retorno da função ganha uma
-- coluna, não dá para usar `create or replace`: precisa dropar antes.
drop function if exists ia_revisao_lista();

create function ia_revisao_lista()
returns table (
  lead_id      uuid,
  sugestao_id  uuid,
  lead_nome    text,
  telefone     text,
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
    c.telefone,
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
