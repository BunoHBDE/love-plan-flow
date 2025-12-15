-- Add payment terms columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN percentual_sinal INTEGER NOT NULL DEFAULT 10 CHECK (percentual_sinal >= 10),
ADD COLUMN valor_sinal NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN numero_parcelas INTEGER NOT NULL DEFAULT 1,
ADD COLUMN dia_vencimento INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimento IN (5, 10, 15, 20, 25)),
ADD COLUMN parcelas_json JSONB DEFAULT '[]'::jsonb;