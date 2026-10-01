-- Todo lead nasce na primeira etapa (Saudação), qualquer que seja a porta de
-- entrada. Antes só o cadastro manual na tela inseria essa linha em
-- crm_lead_stages; os leads criados pelo job do WhatsApp ficavam sem etapa e
-- sumiam da contagem da Saudação no painel.
CREATE OR REPLACE FUNCTION public.crm_lead_entra_na_primeira_etapa()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO crm_lead_stages (lead_id, stage_id, entrou_em)
  SELECT NEW.id, s.id, now()
  FROM crm_stages s
  WHERE s.user_id = NEW.created_by
  ORDER BY s.ordem ASC
  LIMIT 1
  ON CONFLICT (lead_id, stage_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_lead_primeira_etapa ON public.crm_leads;
CREATE TRIGGER trg_crm_lead_primeira_etapa
AFTER INSERT ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.crm_lead_entra_na_primeira_etapa();
