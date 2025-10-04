-- =====================================================
-- Migration: Adicionar campos de Peças e Amostras
-- Data: 2025-10-03
-- Descrição: Adiciona 4 novos campos na seção de peças
-- =====================================================

-- Adicionar novos campos à tabela fichas_tecnicas
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS peca_foi_desmontada TEXT DEFAULT 'NAO',
ADD COLUMN IF NOT EXISTS peca_condicao TEXT DEFAULT 'NOVA',
ADD COLUMN IF NOT EXISTS precisa_peca_teste TEXT DEFAULT 'NAO',
ADD COLUMN IF NOT EXISTS responsavel_tecnico TEXT;

-- Adicionar constraints para validação
ALTER TABLE public.fichas_tecnicas
ADD CONSTRAINT check_peca_foi_desmontada
  CHECK (peca_foi_desmontada IN ('SIM', 'NAO') OR peca_foi_desmontada IS NULL);

ALTER TABLE public.fichas_tecnicas
ADD CONSTRAINT check_peca_condicao
  CHECK (peca_condicao IN ('NOVA', 'USADA') OR peca_condicao IS NULL);

ALTER TABLE public.fichas_tecnicas
ADD CONSTRAINT check_precisa_peca_teste
  CHECK (precisa_peca_teste IN ('SIM', 'NAO') OR precisa_peca_teste IS NULL);

ALTER TABLE public.fichas_tecnicas
ADD CONSTRAINT check_responsavel_tecnico
  CHECK (responsavel_tecnico IN ('Carlos', 'Lucas', 'Henrique', 'Fábio', 'Outro', '') OR responsavel_tecnico IS NULL);

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.fichas_tecnicas.peca_foi_desmontada
IS 'Indica se a peça foi desmontada pelo cliente (SIM/NAO)';

COMMENT ON COLUMN public.fichas_tecnicas.peca_condicao
IS 'Condição da peça: NOVA ou USADA';

COMMENT ON COLUMN public.fichas_tecnicas.precisa_peca_teste
IS 'Indica se precisa de peça de teste/ensaio (SIM/NAO)';

COMMENT ON COLUMN public.fichas_tecnicas.responsavel_tecnico
IS 'Nome do responsável técnico (Carlos, Lucas, Henrique, Fábio, Outro)';

-- Criar índice para facilitar filtros por responsável técnico
CREATE INDEX IF NOT EXISTS idx_fichas_responsavel_tecnico
ON public.fichas_tecnicas(responsavel_tecnico);
