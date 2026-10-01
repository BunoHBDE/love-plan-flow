-- =====================================================================
-- LEADS SEM DUPLICADOS
-- =====================================================================
-- Causa: o mesmo telefone existia em mais de um registro de `clients` e o
-- job vincular_mensagens_a_leads() só procurava lead aberto DENTRO do
-- cliente escolhido (o mais recente), criando um segundo lead.
--
-- 1. O job passa a reaproveitar qualquer lead aberto do mesmo telefone.
-- 2. crm_criar_lead(): cadastro manual atômico (cliente + lead), que reusa o
--    cliente existente e recusa o telefone que já tem lead aberto.
-- 3. Visão crm_leads_telefone_duplicado: pares que já existem, para mesclar
--    à mão (nomes diferentes podem ser casais diferentes; não mesclamos
--    automaticamente).

-- ---------------------------------------------------------------------
-- 1. Job de vínculo
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vincular_mensagens_a_leads()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid := '425ea9dc-4842-426c-8755-3f6ecbc85905';
  v_hoje_sp date := (now() at time zone 'America/Sao_Paulo')::date;
  v_contact record;
  v_match_count integer;
  v_client_id uuid;
  v_lead_id uuid;
  v_origem text;
  v_nome text;
  v_vinculados integer := 0;
begin
  -- ETAPA 0: preencher nome de clientes automáticos que ficaram com o número
  update clients cl
  set nome = sub.nome_real
  from (
    select
      cl2.id as client_id,
      (select max(m2.contact_name) from messages m2
       where normalizar_telefone(m2.contact_wa_id) = normalizar_telefone(cl2.telefone)
         and m2.contact_name is not null) as nome_real
    from clients cl2
    where cl2.nome ~ '^\d+$'
  ) sub
  where cl.id = sub.client_id
    and sub.nome_real is not null;

  -- ETAPA 1: vincular mensagens sem lead (IGNORANDO números internos)
  for v_contact in
    select
      contact_wa_id,
      normalizar_telefone(contact_wa_id) as chave,
      max(contact_name) filter (where contact_name is not null) as nome_wa
    from messages
    where crm_lead_id is null
      and normalizar_telefone(contact_wa_id) not in (
        select telefone_normalizado from numeros_internos
      )
    group by contact_wa_id
  loop
    v_origem := null;
    v_lead_id := null;
    v_nome := coalesce(v_contact.nome_wa, v_contact.contact_wa_id);

    -- Serializa por telefone: duas execuções (ou o cadastro manual) não
    -- criam o mesmo lead ao mesmo tempo.
    perform pg_advisory_xact_lock(hashtext('crm_lead_tel:' || v_contact.chave));

    -- Lead aberto de QUALQUER cliente com esse telefone: é o dono das mensagens.
    select l.id into v_lead_id
    from crm_leads l
    join clients c on c.id = l.client_id
    where normalizar_telefone(c.telefone) = v_contact.chave
      and l.arquivado = false
    order by l.created_at asc
    limit 1;

    if v_lead_id is null then
      select count(*) into v_match_count
      from clients
      where normalizar_telefone(telefone) = v_contact.chave;

      if v_match_count = 0 then
        insert into clients (nome, telefone, created_by)
        values (v_nome, v_contact.contact_wa_id, v_owner)
        returning id into v_client_id;
        v_origem := 'lead_automatico';
      else
        select id into v_client_id
        from clients
        where normalizar_telefone(telefone) = v_contact.chave
        order by created_at asc
        limit 1;
      end if;

      insert into crm_leads (client_id, created_by, origem_ayllah, origem, entrada)
      values (v_client_id, v_owner, v_origem, 'WhatsApp', v_hoje_sp)
      returning id into v_lead_id;
    end if;

    update messages
    set crm_lead_id = v_lead_id
    where contact_wa_id = v_contact.contact_wa_id and crm_lead_id is null;

    v_vinculados := v_vinculados + 1;
  end loop;

  return v_vinculados;
end;
$function$;

-- ---------------------------------------------------------------------
-- 2. Cadastro manual atômico
-- ---------------------------------------------------------------------
-- SECURITY INVOKER: a RLS de clients/crm_leads continua valendo.
-- Telefone que já tem lead aberto → erro 'LEAD_DUPLICADO' com o id do lead
-- no DETAIL, para a tela abrir o existente.
CREATE OR REPLACE FUNCTION public.crm_criar_lead(
  p_nome TEXT,
  p_telefone TEXT,
  p_email TEXT,
  p_origem TEXT,
  p_entrada DATE,
  p_observacoes TEXT
) RETURNS UUID
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  uid UUID := auth.uid();
  chave TEXT := normalizar_telefone(p_telefone);
  v_client_id UUID;
  v_lead_id UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sessão expirada. Entre novamente.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('crm_lead_tel:' || chave));

  SELECT l.id INTO v_lead_id
  FROM crm_leads l
  JOIN clients c ON c.id = l.client_id
  WHERE normalizar_telefone(c.telefone) = chave AND l.arquivado = false
  ORDER BY l.created_at ASC
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    RAISE EXCEPTION 'LEAD_DUPLICADO' USING DETAIL = v_lead_id::text, ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_client_id
  FROM clients
  WHERE normalizar_telefone(telefone) = chave
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_client_id IS NULL THEN
    INSERT INTO clients (nome, telefone, email, created_by)
    VALUES (trim(p_nome), trim(p_telefone), NULLIF(trim(p_email), ''), uid)
    RETURNING id INTO v_client_id;
  END IF;

  INSERT INTO crm_leads (client_id, created_by, entrada, origem, ultima_msg, observacoes)
  VALUES (v_client_id, uid, p_entrada, NULLIF(p_origem, ''), p_entrada, NULLIF(trim(p_observacoes), ''))
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_criar_lead(TEXT, TEXT, TEXT, TEXT, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_criar_lead(TEXT, TEXT, TEXT, TEXT, DATE, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Pares já existentes, para mesclar à mão
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.crm_leads_telefone_duplicado
WITH (security_invoker = true) AS
SELECT
  normalizar_telefone(c.telefone) AS telefone_chave,
  l.id AS lead_id,
  c.id AS client_id,
  c.nome,
  l.created_at,
  l.origem_ayllah,
  (SELECT count(*) FROM messages m WHERE m.crm_lead_id = l.id) AS mensagens
FROM crm_leads l
JOIN clients c ON c.id = l.client_id
WHERE l.arquivado = false
  AND normalizar_telefone(c.telefone) IN (
    SELECT normalizar_telefone(c2.telefone)
    FROM crm_leads l2 JOIN clients c2 ON c2.id = l2.client_id
    WHERE l2.arquivado = false AND length(normalizar_telefone(c2.telefone)) >= 10
    GROUP BY 1 HAVING count(*) > 1
  );
