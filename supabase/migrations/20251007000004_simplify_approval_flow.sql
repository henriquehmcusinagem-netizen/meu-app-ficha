-- Migration: Simplificar fluxo de aprovação
-- Data: 2025-10-07
-- Descrição: Remover aprovação interna (desnecessária) e simplificar para apenas 2 aprovações

-- ============================================================================
-- REMOVER CAMPOS DE APROVAÇÃO INTERNA
-- ============================================================================

-- Remover índice que inclui aprovado_interno
DROP INDEX IF EXISTS public.idx_fichas_aprovacoes;

-- Remover campos de aprovação interna
ALTER TABLE public.fichas_tecnicas
DROP COLUMN IF EXISTS aprovado_interno;

ALTER TABLE public.fichas_tecnicas
DROP COLUMN IF EXISTS data_aprovacao_interna;

ALTER TABLE public.fichas_tecnicas
DROP COLUMN IF EXISTS aprovador_interno_id;

ALTER TABLE public.fichas_tecnicas
DROP COLUMN IF EXISTS requer_aprovacao_interna;

-- Adicionar campo para registrar quem aprovou orçamento internamente (quando manual)
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS aprovador_orcamento_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar campo para observações da aprovação de orçamento
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS observacoes_aprovacao_orcamento TEXT;

-- Criar novo índice simplificado
CREATE INDEX IF NOT EXISTS idx_fichas_aprovacoes_simple ON public.fichas_tecnicas(
  aprovado_ftc_cliente,
  aprovado_orcamento_cliente
);

-- ============================================================================
-- ATUALIZAR FUNÇÃO DE VERIFICAÇÃO
-- ============================================================================

-- Substituir função para versão simplificada
CREATE OR REPLACE FUNCTION public.ficha_totalmente_aprovada(ficha_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  ftc RECORD;
BEGIN
  SELECT
    aprovado_ftc_cliente,
    aprovado_orcamento_cliente
  INTO ftc
  FROM public.fichas_tecnicas
  WHERE id = ficha_id;

  -- Ficha aprovada = ambas aprovações OK
  RETURN (ftc.aprovado_ftc_cliente AND ftc.aprovado_orcamento_cliente);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS ATUALIZADOS
-- ============================================================================

COMMENT ON COLUMN public.fichas_tecnicas.aprovado_orcamento_cliente IS 'Cliente aprovou orçamento (via link) OU Comercial aprovou manualmente (após receber PC)';
COMMENT ON COLUMN public.fichas_tecnicas.aprovador_orcamento_id IS 'Usuário que aprovou orçamento manualmente (NULL se aprovado via link pelo cliente)';
COMMENT ON COLUMN public.fichas_tecnicas.observacoes_aprovacao_orcamento IS 'Observações sobre aprovação de orçamento (ex: PC recebido, condições especiais)';
COMMENT ON FUNCTION public.ficha_totalmente_aprovada IS 'Verifica se ficha está totalmente aprovada (FTC + Orçamento)';
