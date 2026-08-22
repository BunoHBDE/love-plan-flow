-- ============================================================================
-- A IA NÃO MEXE EM ETAPA QUE VOCÊ PREENCHEU
-- ============================================================================
--
-- Caso real: o Guilherme foi classificado à mão como "Perguntas: Não
-- qualificado" às 14h26. A IA rodou às 19h41 e gravou "Convite para Visita:
-- Recusou" por cima. O julgamento humano perdeu para a inferência.
--
-- Medindo a base: das 31 gravações de etapa que a IA fez, 13 caíram em leads
-- que já tinham classificação manual. Ela quase nunca sobrescreve a MESMA
-- etapa (1 caso) — ela acrescenta resultado em OUTRA etapa, e o lead fica com
-- duas classificações conflitantes, que é igualmente ruim.
--
-- Regra: se o lead tem qualquer resultado de etapa que a IA não escreveu, ela
-- não toca em etapa nenhuma nesse lead. Campos factuais continuam entrando.

-- Como saber se um resultado é da IA: ela deixa rastro em crm_lead_events.
-- Se o valor atual bate com o que ela gravou por último naquela etapa, é dela.
-- Se não bate — ou se não há evento nenhum — alguém mexeu na mão.
create or replace function ia_tem_etapa_manual(p_lead_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
      from crm_lead_stages ls
     where ls.lead_id = p_lead_id
       and ls.outcome_id is not null
       and not exists (
         select 1
           from crm_lead_events e
          where e.lead_id = p_lead_id
            and e.tipo = 'ia'
            and coalesce((e.meta->>'revertido')::boolean, false) = false
            and (e.meta->'depois'->'etapa'->>'stage_id')::uuid  = ls.stage_id
            and (e.meta->'depois'->'etapa'->>'outcome_id')::uuid = ls.outcome_id))
$$;

grant execute on function ia_tem_etapa_manual(uuid) to authenticated;

-- A gravação passa a consultar essa função antes de tocar em etapa, e a
-- limpeza de etapas posteriores deixa de ser exclusiva do "faltou": sempre
-- que o lead volta para uma etapa anterior, o que veio depois é passado que
-- não vale mais. É assim que "cancelou a visita, vamos remarcar" deixa a
-- Visita Agendada em branco e devolve o Convite para Visita a aguardando.
--
-- O corpo completo de aplicar_sugestoes_ia está na migration anterior; aqui
-- mudam quatro pontos, aplicados sobre o corpo que já está no banco.
do $outer$
declare src text;
begin
  select prosrc into src from pg_proc where proname='aplicar_sugestoes_ia';

  src := replace(src, '  v_ano_proposta text;',
                      '  v_ano_proposta text;' || chr(10) || '  v_pode_etapa boolean;');

  src := replace(src,
    'if p_gravar_etapa and v_stage_id is null then
      motivo := ''outcome sugerido nao existe mais'';
      return next; continue;
    end if;',
    'if p_gravar_etapa and v_stage_id is null then
      motivo := ''outcome sugerido nao existe mais'';
      return next; continue;
    end if;

    -- O julgamento humano ganha: se alguem classificou etapa neste lead na
    -- mao, a IA nao mexe em etapa nenhuma aqui. Campos continuam entrando.
    v_pode_etapa := p_gravar_etapa and not ia_tem_etapa_manual(s.lead_id);');

  src := replace(src, 'if p_gravar_etapa then
      if v_semantica = ''recuou'' then', 'if v_pode_etapa then
      if v_semantica = ''recuou'' then');

  src := replace(src, 'if p_gravar_etapa and (v_etapa_atual is distinct from',
                      'if v_pode_etapa and (v_etapa_atual is distinct from');

  src := replace(src, 'if p_gravar_etapa then
      insert into crm_lead_stages', 'if v_pode_etapa then
      insert into crm_lead_stages');

  src := replace(src, 'if v_semantica = ''recuou'' then
        delete from crm_lead_stages ls using crm_stages st2
         where ls.stage_id = st2.id and ls.lead_id = s.lead_id and st2.ordem > v_stage_ordem;
      end if;',
    '-- O lead esta nesta etapa agora: resultado de etapa posterior e passado
      -- que nao vale mais.
      delete from crm_lead_stages ls using crm_stages st2
       where ls.stage_id = st2.id and ls.lead_id = s.lead_id and st2.ordem > v_stage_ordem;');

  src := replace(src, 'case when p_gravar_etapa then format(''IA: %s: %s''',
                      'case when v_pode_etapa then format(''IA: %s: %s''');

  execute format(
    'create or replace function aplicar_sugestoes_ia(p_lead_ids uuid[] default null, '
    'p_confianca_min numeric default 0.90, p_dry_run boolean default true, '
    'p_gravar_data boolean default false, p_gravar_etapa boolean default false) '
    'returns table (lead_id uuid, sugestao_id uuid, aplicado boolean, motivo text, alteracoes jsonb) '
    'language plpgsql security invoker set search_path = public as %L', src);
end $outer$;
