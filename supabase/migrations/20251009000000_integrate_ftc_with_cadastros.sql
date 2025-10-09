-- Migration: Integrar Fichas Técnicas com Módulo Cadastros
-- Data: 2025-10-09
-- Descrição: Adiciona campos para integração com tabelas clientes e contatos_cliente
--            Permite auto-preenchimento de CNPJ, Telefone e Email ao selecionar cliente

-- ============================================================================
-- ADICIONAR COLUNAS DE INTEGRAÇÃO
-- ============================================================================

-- Adicionar FKs opcionais para rastreabilidade
ALTER TABLE public.fichas_tecnicas
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contato_id UUID REFERENCES public.contatos_cliente(id) ON DELETE SET NULL;

-- Adicionar campos "congelados" (snapshot dos dados no momento da criação)
ALTER TABLE public.fichas_tecnicas
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================================================
-- MIGRAR DADOS EXISTENTES
-- ============================================================================

-- Copiar dados do campo antigo 'contato' para o novo campo 'telefone'
-- Isso garante que fichas antigas continuem funcionando
UPDATE public.fichas_tecnicas
SET telefone = contato
WHERE contato IS NOT NULL
  AND (telefone IS NULL OR telefone = '');

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para buscar fichas por cliente (útil para relatórios)
CREATE INDEX IF NOT EXISTS idx_fichas_cliente_id
  ON public.fichas_tecnicas(cliente_id)
  WHERE cliente_id IS NOT NULL;

-- Índice para buscar fichas por contato (útil para análises)
CREATE INDEX IF NOT EXISTS idx_fichas_contato_id
  ON public.fichas_tecnicas(contato_id)
  WHERE contato_id IS NOT NULL;

-- Índice para buscar por CNPJ (útil para buscas rápidas)
CREATE INDEX IF NOT EXISTS idx_fichas_cnpj
  ON public.fichas_tecnicas(cnpj)
  WHERE cnpj IS NOT NULL;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN public.fichas_tecnicas.cliente_id IS 'FK opcional para tabela clientes - permite rastreabilidade';
COMMENT ON COLUMN public.fichas_tecnicas.contato_id IS 'FK opcional para tabela contatos_cliente - permite rastreabilidade';
COMMENT ON COLUMN public.fichas_tecnicas.cnpj IS 'CNPJ do cliente no momento da criação da FTC (snapshot histórico)';
COMMENT ON COLUMN public.fichas_tecnicas.telefone IS 'Telefone do contato no momento da criação da FTC (snapshot histórico)';
COMMENT ON COLUMN public.fichas_tecnicas.email IS 'Email do contato no momento da criação da FTC (snapshot histórico)';

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- ESTRATÉGIA DE COMPATIBILIDADE:
-- - FKs são opcionais (permitem modo manual)
-- - Dados são "congelados" (snapshot) para histórico
-- - Campo 'contato' mantido por compatibilidade com código antigo
-- - Fallback automático: telefone || contato
--
-- COMPORTAMENTO ESPERADO:
-- - Fichas antigas: cliente_id = NULL, usam campo 'telefone' migrado
-- - Fichas novas integradas: cliente_id + contato_id preenchidos
-- - Fichas novas manuais: cliente_id = NULL, campos preenchidos manualmente
--
