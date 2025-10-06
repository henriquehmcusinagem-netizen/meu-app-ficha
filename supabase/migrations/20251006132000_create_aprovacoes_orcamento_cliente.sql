-- Create table for client ORCAMENTO (Commercial Quote) approvals
-- Used by the HTML approval system for commercial quotes sent to purchasing department
CREATE TABLE public.aprovacoes_orcamento_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID NOT NULL REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
  numero_ftc TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('aprovar', 'alterar', 'rejeitar')),
  responsavel TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  observacoes TEXT,
  versao_orcamento INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_aprovacoes_orcamento_cliente_ficha_id ON public.aprovacoes_orcamento_cliente(ficha_id);
CREATE INDEX idx_aprovacoes_orcamento_cliente_numero_ftc ON public.aprovacoes_orcamento_cliente(numero_ftc);
CREATE INDEX idx_aprovacoes_orcamento_cliente_tipo ON public.aprovacoes_orcamento_cliente(tipo);
CREATE INDEX idx_aprovacoes_orcamento_cliente_email ON public.aprovacoes_orcamento_cliente(email);
CREATE INDEX idx_aprovacoes_orcamento_cliente_criado_em ON public.aprovacoes_orcamento_cliente(criado_em);

-- Enable Row Level Security
ALTER TABLE public.aprovacoes_orcamento_cliente ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for public HTML forms)
-- This allows clients to submit approvals via the public HTML link
CREATE POLICY "Allow anonymous inserts for client orcamento approvals"
ON public.aprovacoes_orcamento_cliente
FOR INSERT
WITH CHECK (true);

-- Policy: Allow authenticated users to view all approvals
CREATE POLICY "Authenticated users can view all orcamento approvals"
ON public.aprovacoes_orcamento_cliente
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Only authenticated users can update/delete
CREATE POLICY "Authenticated users can update orcamento approvals"
ON public.aprovacoes_orcamento_cliente
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete orcamento approvals"
ON public.aprovacoes_orcamento_cliente
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add comment to table
COMMENT ON TABLE public.aprovacoes_orcamento_cliente IS 'Stores client approvals/rejections/change requests for commercial quotes (orçamentos) sent via email/WhatsApp';
COMMENT ON COLUMN public.aprovacoes_orcamento_cliente.tipo IS 'Type of response: aprovar (approve), alterar (request changes), rejeitar (reject)';
COMMENT ON COLUMN public.aprovacoes_orcamento_cliente.versao_orcamento IS 'Version of the orçamento at the time of approval submission';
