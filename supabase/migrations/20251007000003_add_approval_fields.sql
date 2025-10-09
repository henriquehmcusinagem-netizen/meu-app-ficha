-- Migration: Adicionar campos de aprovação dual
-- Data: 2025-10-07
-- Descrição: Campos para controlar aprovação de FTC e Orçamento pelo cliente e internamente

-- ============================================================================
-- TABELA: fichas_tecnicas - Adicionar campos de aprovação
-- ============================================================================

-- Adicionar campos de aprovação do cliente
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS aprovado_ftc_cliente BOOLEAN DEFAULT false;

ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS data_aprovacao_ftc_cliente TIMESTAMPTZ;

ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS aprovado_orcamento_cliente BOOLEAN DEFAULT false;

ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS data_aprovacao_orcamento_cliente TIMESTAMPTZ;

-- Adicionar campos de aprovação interna
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS aprovado_interno BOOLEAN DEFAULT false;

ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS data_aprovacao_interna TIMESTAMPTZ;

ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS aprovador_interno_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar campo para indicar se precisa de aprovação interna
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS requer_aprovacao_interna BOOLEAN DEFAULT false;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_fichas_aprovacoes ON public.fichas_tecnicas(
  aprovado_ftc_cliente,
  aprovado_orcamento_cliente,
  aprovado_interno
);

-- Comentários
COMMENT ON COLUMN public.fichas_tecnicas.aprovado_ftc_cliente IS 'Cliente aprovou a Ficha Técnica';
COMMENT ON COLUMN public.fichas_tecnicas.data_aprovacao_ftc_cliente IS 'Data de aprovação da FTC pelo cliente';
COMMENT ON COLUMN public.fichas_tecnicas.aprovado_orcamento_cliente IS 'Cliente aprovou o Orçamento';
COMMENT ON COLUMN public.fichas_tecnicas.data_aprovacao_orcamento_cliente IS 'Data de aprovação do Orçamento pelo cliente';
COMMENT ON COLUMN public.fichas_tecnicas.aprovado_interno IS 'Aprovação interna (após cliente aprovar)';
COMMENT ON COLUMN public.fichas_tecnicas.data_aprovacao_interna IS 'Data da aprovação interna';
COMMENT ON COLUMN public.fichas_tecnicas.aprovador_interno_id IS 'Usuário que fez a aprovação interna';
COMMENT ON COLUMN public.fichas_tecnicas.requer_aprovacao_interna IS 'Se true, precisa de aprovação interna após cliente aprovar';

-- ============================================================================
-- FUNÇÃO: Verificar se ficha está totalmente aprovada
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ficha_totalmente_aprovada(ficha_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  ftc RECORD;
BEGIN
  SELECT
    aprovado_ftc_cliente,
    aprovado_orcamento_cliente,
    aprovado_interno,
    requer_aprovacao_interna
  INTO ftc
  FROM public.fichas_tecnicas
  WHERE id = ficha_id;

  -- Se não requer aprovação interna, basta cliente aprovar ambos
  IF ftc.requer_aprovacao_interna = false THEN
    RETURN (ftc.aprovado_ftc_cliente AND ftc.aprovado_orcamento_cliente);
  END IF;

  -- Se requer aprovação interna, precisa das 3 aprovações
  RETURN (
    ftc.aprovado_ftc_cliente AND
    ftc.aprovado_orcamento_cliente AND
    ftc.aprovado_interno
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.ficha_totalmente_aprovada IS 'Verifica se a ficha passou por todas as aprovações necessárias';
