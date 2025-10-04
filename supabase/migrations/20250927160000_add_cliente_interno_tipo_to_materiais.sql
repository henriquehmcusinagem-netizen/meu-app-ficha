-- Add cliente_interno_tipo column to materiais table
ALTER TABLE public.materiais
ADD COLUMN IF NOT EXISTS cliente_interno_tipo TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.materiais.cliente_interno_tipo IS 'Tipo específico do cliente interno (campo adicional ao cliente_interno)';