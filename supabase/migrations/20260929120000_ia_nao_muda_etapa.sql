-- =====================================================================
-- A IA DEIXA DE MUDAR A ETAPA DO LEAD
-- =====================================================================
-- A etapa passa a ser decisão exclusiva de quem atende. A IA continua
-- extraindo nome, convidados e data, mas nunca move o lead no funil.
--
--   1. aplicar_sugestoes_ia() ignora a etapa sugerida (p_gravar_etapa vira
--      letra morta) e o padrão do parâmetro passa a ser false.
--   2. O cron deixa de pedir gravação de etapa.
--   3. Sugestões pendentes perdem a etapa sugerida, para que nada já
--      gravado em ia_sugestoes seja aplicado depois.
-- =====================================================================

DO $do$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
    FROM pg_proc p
   WHERE p.proname = 'aplicar_sugestoes_ia'
     AND p.pronamespace = 'public'::regnamespace;

  IF def NOT LIKE '%v_mexe_etapa := p_gravar_etapa%' THEN
    RAISE EXCEPTION 'aplicar_sugestoes_ia: trecho v_mexe_etapa nao encontrado';
  END IF;

  def := replace(def, 'v_mexe_etapa := p_gravar_etapa', 'v_mexe_etapa := false AND p_gravar_etapa');
  def := regexp_replace(def, 'p_gravar_etapa(\s+)boolean DEFAULT true', 'p_gravar_etapa\1boolean DEFAULT false');
  EXECUTE def;
END
$do$;

SELECT cron.unschedule('aplicar-sugestoes-ia-3x-dia');
SELECT cron.schedule('aplicar-sugestoes-ia-3x-dia', '30 11,17,23 * * *', $j$
  select count(*) from aplicar_sugestoes_ia(null, 0.80, false, true, false);
$j$);

UPDATE public.ia_sugestoes
   SET stage_id_sugerido = NULL,
       estado_sugerido   = NULL,
       motivo_sugerido   = NULL
 WHERE status = 'pendente';
