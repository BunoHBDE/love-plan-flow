-- =====================================================================
-- PADRÃO ÚNICO DE TELEFONE: (00) 00000-0000
-- =====================================================================
-- Hoje o mesmo número aparece de três jeitos — "11996630347",
-- "11 99663-0347" e "(11) 99663-0347" — porque cada formulário tinha (ou
-- não tinha) a sua própria máscara. Isso quebra a busca, quebra o aviso de
-- lead duplicado no cadastro e faz o mesmo casal entrar duas vezes.
--
-- A correção tem duas partes: normaliza o que já está gravado e instala um
-- gatilho para que nada volte a entrar fora do padrão, venha de onde vier —
-- formulário, importação ou console.
-- =====================================================================


-- =====================================================================
-- 1. A FUNÇÃO DE FORMATO
-- =====================================================================
-- Fixo e celular antigo têm 10 dígitos e ficam em (00) 0000-0000: não há
-- nono dígito para inventar. Qualquer valor que não tenha 10 nem 11 dígitos
-- é devolvido intacto — normalizar não pode destruir o que não entendeu.
CREATE OR REPLACE FUNCTION public.formatar_telefone_br(valor TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  digitos TEXT;
BEGIN
  IF valor IS NULL THEN
    RETURN NULL;
  END IF;

  digitos := regexp_replace(valor, '\D', '', 'g');

  -- O 55 só é DDI quando sobra número demais: o DDD 55 (Santa Maria) forma
  -- um telefone de 10 ou 11 dígitos, nunca de 12 ou 13.
  IF length(digitos) IN (12, 13) AND left(digitos, 2) = '55' THEN
    digitos := substr(digitos, 3);
  END IF;

  IF length(digitos) = 11 THEN
    RETURN format('(%s) %s-%s',
      substr(digitos, 1, 2), substr(digitos, 3, 5), substr(digitos, 8, 4));
  ELSIF length(digitos) = 10 THEN
    RETURN format('(%s) %s-%s',
      substr(digitos, 1, 2), substr(digitos, 3, 4), substr(digitos, 7, 4));
  END IF;

  RETURN valor;
END;
$$;

COMMENT ON FUNCTION public.formatar_telefone_br(TEXT) IS
  'Telefone brasileiro no padrão (00) 00000-0000. Devolve o valor intacto quando não tem 10 nem 11 dígitos.';


-- =====================================================================
-- 2. O GATILHO
-- =====================================================================
-- Um gatilho só para todas as tabelas: as colunas vêm em TG_ARGV, então
-- incluir uma coluna nova de telefone no futuro é uma linha de CREATE
-- TRIGGER, sem função nova.
CREATE OR REPLACE FUNCTION public.normalizar_telefone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  registro JSONB := to_jsonb(NEW);
  coluna TEXT;
BEGIN
  FOREACH coluna IN ARRAY TG_ARGV LOOP
    IF registro ? coluna AND registro ->> coluna IS NOT NULL THEN
      registro := jsonb_set(
        registro,
        ARRAY[coluna],
        to_jsonb(public.formatar_telefone_br(registro ->> coluna))
      );
    END IF;
  END LOOP;

  NEW := jsonb_populate_record(NEW, registro);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.normalizar_telefone() IS
  'Gatilho BEFORE: aplica formatar_telefone_br() nas colunas passadas em TG_ARGV.';


-- =====================================================================
-- 3. NORMALIZA O QUE JÁ ESTÁ GRAVADO
-- =====================================================================
-- Antes dos gatilhos, para não disparar duas vezes por linha.
UPDATE public.clients
SET telefone = public.formatar_telefone_br(telefone)
WHERE telefone IS DISTINCT FROM public.formatar_telefone_br(telefone);

UPDATE public.profiles
SET phone = public.formatar_telefone_br(phone),
    whatsapp = public.formatar_telefone_br(whatsapp),
    company_phone = public.formatar_telefone_br(company_phone)
WHERE phone IS DISTINCT FROM public.formatar_telefone_br(phone)
   OR whatsapp IS DISTINCT FROM public.formatar_telefone_br(whatsapp)
   OR company_phone IS DISTINCT FROM public.formatar_telefone_br(company_phone);

UPDATE public.onboarding_data
SET whatsapp = public.formatar_telefone_br(whatsapp)
WHERE whatsapp IS DISTINCT FROM public.formatar_telefone_br(whatsapp);


-- =====================================================================
-- 4. INSTALA OS GATILHOS
-- =====================================================================
DROP TRIGGER IF EXISTS trg_clients_normalizar_telefone ON public.clients;
CREATE TRIGGER trg_clients_normalizar_telefone
BEFORE INSERT OR UPDATE OF telefone ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.normalizar_telefone('telefone');

DROP TRIGGER IF EXISTS trg_profiles_normalizar_telefone ON public.profiles;
CREATE TRIGGER trg_profiles_normalizar_telefone
BEFORE INSERT OR UPDATE OF phone, whatsapp, company_phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.normalizar_telefone('phone', 'whatsapp', 'company_phone');

DROP TRIGGER IF EXISTS trg_onboarding_normalizar_telefone ON public.onboarding_data;
CREATE TRIGGER trg_onboarding_normalizar_telefone
BEFORE INSERT OR UPDATE OF whatsapp ON public.onboarding_data
FOR EACH ROW EXECUTE FUNCTION public.normalizar_telefone('whatsapp');
