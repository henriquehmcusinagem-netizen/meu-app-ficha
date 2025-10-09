-- Migration: Alterar tabelas existentes para suportar novo fluxo
-- Data: 2025-10-07
-- Descrição: Adiciona campos necessários em processos_os e fichas_tecnicas

-- ============================================================================
-- TABELA: processos_os
-- Adicionar: ordem (para sequenciamento) e funcionario_id
-- ============================================================================

-- Adicionar coluna ordem para sequenciamento de processos
ALTER TABLE public.processos_os
ADD COLUMN IF NOT EXISTS ordem INTEGER;

-- Adicionar coluna funcionario_id (referência ao funcionário alocado)
ALTER TABLE public.processos_os
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL;

-- Criar índice para ordem
CREATE INDEX IF NOT EXISTS idx_processos_os_ordem ON public.processos_os(os_id, ordem);

-- Criar índice para funcionario_id
CREATE INDEX IF NOT EXISTS idx_processos_os_funcionario ON public.processos_os(funcionario_id) WHERE funcionario_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.processos_os.ordem IS 'Ordem de execução do processo (1, 2, 3...). Definido manualmente no sequenciamento.';
COMMENT ON COLUMN public.processos_os.funcionario_id IS 'Funcionário alocado para executar este processo (pode ser NULL se ainda não alocado)';

-- ============================================================================
-- TABELA: fichas_tecnicas
-- Adicionar: cliente_id (FK para nova tabela clientes)
-- ============================================================================

-- Adicionar coluna cliente_id (opcional, para vincular ao novo cadastro)
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_cliente_id ON public.fichas_tecnicas(cliente_id) WHERE cliente_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.fichas_tecnicas.cliente IS 'Nome do cliente (campo legado, mantido para compatibilidade)';
COMMENT ON COLUMN public.fichas_tecnicas.cliente_id IS 'Referência ao cadastro formal do cliente (nova funcionalidade)';

-- ============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em clientes
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Aplicar trigger em funcionarios
DROP TRIGGER IF EXISTS update_funcionarios_updated_at ON public.funcionarios;
CREATE TRIGGER update_funcionarios_updated_at
    BEFORE UPDATE ON public.funcionarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
