-- Invariantes dos FUPs do CRM. Cada consulta deve devolver zero linhas.

-- 1. "voltou" sempre tem data de volta, e só ele.
select id from public.crm_fups
 where (status = 'voltou') <> (voltou_em is not null);

-- 2. A volta não pode ser anterior ao início do FUP.
select id from public.crm_fups where voltou_em < iniciado_em;

-- 3. FUPs de um mesmo lead têm numeração única.
select lead_id, numero_fup from public.crm_fups
 group by lead_id, numero_fup having count(*) > 1;

-- 4. FUP aguardando que já tem mensagem recebida depois (gatilho perdeu).
select f.id from public.crm_fups f
 where f.status = 'aguardando'
   and exists (select 1 from public.messages m
                where m.crm_lead_id = f.lead_id
                  and m.direction = 'inbound'
                  and m.sent_at >= f.iniciado_em);
