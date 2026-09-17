-- ============================================================================
-- SITUAÇÃO DO LEAD A PARTIR DA CONVERSA REAL
-- ============================================================================
-- A Situação (Aguardando / Silêncio / Respondeu) passa a vir da última
-- mensagem de fato trocada no WhatsApp, não de um outcome marcado na mão:
-- quem falou por último decide se a bola está com a gente ou com o lead, e o
-- prazo da etapa decide se a espera já virou silêncio.
--
-- `messages` tem RLS ligado e nenhuma política (ver 20260821230000): pela
-- tela, ninguém lê. Em vez de abrir a tabela inteira para o front, isolamos a
-- leitura aqui — igual a `ia_ano_da_proposta` — devolvendo só a direção e o
-- horário da mensagem mais recente de cada lead do usuário.
create or replace function public.crm_ultima_mensagem()
returns table (
  lead_id   uuid,
  direction text,
  sent_at   timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (m.crm_lead_id)
         m.crm_lead_id, m.direction, m.sent_at
    from public.messages m
    join public.crm_leads l on l.id = m.crm_lead_id
   where m.crm_lead_id is not null
     and (l.created_by = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role))
   order by m.crm_lead_id, m.sent_at desc
$$;

revoke all on function public.crm_ultima_mensagem() from public, anon;
grant execute on function public.crm_ultima_mensagem() to authenticated;
