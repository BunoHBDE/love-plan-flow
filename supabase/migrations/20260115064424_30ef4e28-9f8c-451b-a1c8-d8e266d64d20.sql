-- Criar tabela de contratos
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  created_by UUID NOT NULL,
  
  -- Status do contrato
  status TEXT NOT NULL DEFAULT 'pendente',
  -- Valores: pendente, assinado, em_execucao, concluido, cancelado
  
  -- Datas importantes
  data_assinatura TIMESTAMP WITH TIME ZONE,
  assinado_por TEXT,
  data_evento DATE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  
  -- Snapshot dos dados no momento da criação
  dados_cliente JSONB NOT NULL,
  dados_evento JSONB NOT NULL,
  dados_pagamento JSONB NOT NULL,
  dados_empresa JSONB NOT NULL,
  
  -- Modelo de contrato renderizado
  modelo_contrato TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela de modelos de contrato
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para contracts
CREATE POLICY "Users can view own contracts or admins view all"
ON public.contracts FOR SELECT
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own contracts"
ON public.contracts FOR INSERT
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own contracts or admins update all"
ON public.contracts FOR UPDATE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own contracts or admins delete all"
ON public.contracts FOR DELETE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Políticas para contract_templates
CREATE POLICY "Users can view own templates"
ON public.contract_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
ON public.contract_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
ON public.contract_templates FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
ON public.contract_templates FOR DELETE
USING (auth.uid() = user_id);

-- Função para gerar número do contrato
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  user_id_val UUID;
  user_prefix TEXT;
BEGIN
  user_id_val := NEW.created_by;
  
  IF user_id_val IS NULL THEN
    user_id_val := auth.uid();
  END IF;
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Não foi possível identificar o usuário para gerar o número do contrato';
  END IF;
  
  user_prefix := UPPER(SUBSTRING(REPLACE(user_id_val::TEXT, '-', ''), 1, 4));
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM LENGTH(user_prefix) + 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.contracts
  WHERE created_by = user_id_val;
  
  NEW.contract_number := 'C-' || user_prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$;

-- Trigger para gerar número do contrato
CREATE TRIGGER generate_contract_number_trigger
BEFORE INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.generate_contract_number();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();