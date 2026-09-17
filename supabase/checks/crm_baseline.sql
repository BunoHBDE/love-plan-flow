-- =====================================================================
-- LINHA DE BASE DO CRM
-- =====================================================================
-- Rode este arquivo ANTES e DEPOIS de cada migração que mexa no modelo de
-- etapas. Ele existe para uma pergunta só: alguma coisa se perdeu no caminho?
--
-- BLOCO A — INVARIANTES. Estes números não podem mudar. Um lead contratado
--   continua contratado, um encerrado continua encerrado. Se qualquer linha
--   do bloco A mudar depois de uma migração, a migração está errada e deve
--   ser revertida pelo snapshot (crm_backup_*).
--
-- BLOCO B — DISTRIBUIÇÃO. Estes números MUDAM de propósito: a migração para
--   o modelo de etapa única cria entradas que não existiam (quem "respondeu"
--   na etapa 3 passa a estar na etapa 4). Servem de referência para conferir
--   que a mudança foi a esperada, não para travar a migração.
--
-- Os dois blocos leem as colunas ANTIGAS (outcome_id, encerrado_em), que a
-- migração não toca — é isso que torna a comparação possível.
-- =====================================================================

-- ---------------------------------------------------------------------
-- BLOCO A · INVARIANTES
-- ---------------------------------------------------------------------
with terminais as (
  select ls.lead_id, o.semantica
    from crm_lead_stages ls
    join crm_stage_outcomes o on o.id = ls.outcome_id
   where o.semantica in ('ganhou', 'recusou', 'desqualificado')
)
select 'A · leads (total)'                as metrica, count(*)::text as valor from crm_leads
union all
select 'A · leads arquivados',            count(*)::text from crm_leads where arquivado
union all
select 'A · leads encerrados',            count(*)::text from crm_leads where encerrado_em is not null
union all
select 'A · contratos assinados',         count(*)::text from terminais where semantica = 'ganhou'
union all
select 'A · recusas',                     count(*)::text from terminais where semantica = 'recusou'
union all
select 'A · desqualificados',             count(*)::text from terminais where semantica = 'desqualificado'
union all
select 'A · visitas realizadas',          count(*)::text from crm_leads where compareceu = 'sim'
union all
select 'A · visitas nao comparecidas',    count(*)::text from crm_leads where compareceu = 'nao'
union all
select 'A · leads com agendamento',       count(*)::text from crm_leads where data_agendamento is not null
union all
select 'A · leads com motivo de objecao', count(*)::text from crm_leads where motivo_objecao is not null
union all
select 'A · registros de etapa',          count(*)::text from crm_lead_stages
union all
select 'A · registros de etapa com resultado', count(*)::text from crm_lead_stages where outcome_id is not null
union all
-- Consistência cruzada: encerrado_em e outcome terminal têm de andar juntos.
select 'A · INCONSISTENTE encerrado sem outcome terminal',
       count(*)::text from crm_leads l
        where l.encerrado_em is not null
          and not exists (select 1 from terminais t where t.lead_id = l.id)
union all
select 'A · INCONSISTENTE outcome terminal sem encerrado',
       count(*)::text from crm_leads l
        where l.encerrado_em is null
          and exists (select 1 from terminais t where t.lead_id = l.id)
order by metrica;

-- ---------------------------------------------------------------------
-- BLOCO B · DISTRIBUIÇÃO (muda de propósito)
-- ---------------------------------------------------------------------
-- B.1 Etapa mais avançada de cada lead, pelo modelo NOVO (entrada de etapa).
--     Antes da migração é a última etapa com registro; depois, a última
--     entrada. A diferença esperada é exatamente quem tinha "respondeu",
--     "voltou depois" ou "agendou" e ganhou a entrada da etapa seguinte.
select 'B.1 etapa mais avancada' as bloco,
       st.ordem, st.nome, count(*) as leads
  from crm_lead_stages ls
  join crm_stages st on st.id = ls.stage_id
 where st.ordem = (select max(st2.ordem)
                     from crm_lead_stages ls2
                     join crm_stages st2 on st2.id = ls2.stage_id
                    where ls2.lead_id = ls.lead_id)
 group by st.ordem, st.nome
 order by st.ordem;

-- B.2 Leads sem relógio: o silêncio automático depende de uma data.
select 'B.2 relogio' as bloco,
       count(*) filter (where ultima_msg is null)                as sem_ultima_msg,
       count(*) filter (where entrada is null)                   as sem_entrada,
       count(*) filter (where not exists (select 1 from crm_lead_stages ls
                                           where ls.lead_id = crm_leads.id)) as sem_etapa
  from crm_leads;

-- B.3 Desempenho por origem — o painel usa isto, então não pode virar de cabeça.
select 'B.3 origem' as bloco,
       coalesce(origem, 'Sem origem') as origem,
       count(*)                                          as leads,
       count(*) filter (where compareceu = 'sim')        as visitaram
  from crm_leads
 group by 1, 2
 order by leads desc;
