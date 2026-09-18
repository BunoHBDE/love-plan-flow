-- =====================================================================
-- AUTORIA DA ÚLTIMA ATUALIZAÇÃO DO LEAD (humano vs IA)
-- =====================================================================
-- crm_lead_events já guarda o histórico completo, mas não dá pra saber
-- "quem mexeu por último" sem varrer a tabela. O lead ganha um indicador
-- próprio, carimbado por trigger.
--
-- A IA se identifica com o UUID sintético de ia_autor_uuid() (já existe,
-- criado em 20260821190000): quando a escrita chega com esse par
-- (tipo='ia', id=ia_autor_uuid()), o trigger não mexe — o carimbo já veio
-- pronto de aplicar_sugestoes_ia(). Qualquer outra escrita (tela do CRM,
-- correção manual, RPC futura) é carimbada aqui como humana, com quem
-- estiver autenticado na sessão.
-- =====================================================================

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS atualizado_por_tipo TEXT
    CHECK (atualizado_por_tipo IN ('humano', 'ia')),
  ADD COLUMN IF NOT EXISTS atualizado_por_id UUID,
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.crm_leads_carimbar_autoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.atualizado_por_tipo = 'ia' AND NEW.atualizado_por_id = public.ia_autor_uuid() THEN
    RETURN NEW;
  END IF;

  NEW.atualizado_por_tipo := 'humano';
  NEW.atualizado_por_id := auth.uid();
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_autoria ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_autoria
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_leads_carimbar_autoria();
