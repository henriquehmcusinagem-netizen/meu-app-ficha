-- =====================================================
-- MIGRAÇÃO: Adicionar Serviços Especiais
-- Data: 2025-10-03 14:00:00
-- Descrição: Adiciona 4 campos de Serviços Especiais:
--            fornecimento_desenho, fotos_relatorio,
--            relatorio_tecnico, emissao_art
-- =====================================================

-- 1️⃣ Adicionar 4 colunas de Serviços Especiais
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS fornecimento_desenho TEXT DEFAULT 'NAO',
ADD COLUMN IF NOT EXISTS fotos_relatorio TEXT DEFAULT 'NAO',
ADD COLUMN IF NOT EXISTS relatorio_tecnico TEXT DEFAULT 'NAO',
ADD COLUMN IF NOT EXISTS emissao_art TEXT DEFAULT 'NAO';

-- 2️⃣ Adicionar comentários explicativos nas colunas
COMMENT ON COLUMN public.fichas_tecnicas.fornecimento_desenho IS
  'Cliente precisa de fornecimento de desenho? (SIM/NAO)';

COMMENT ON COLUMN public.fichas_tecnicas.fotos_relatorio IS
  'Incluir fotos no relatório? (SIM/NAO)';

COMMENT ON COLUMN public.fichas_tecnicas.relatorio_tecnico IS
  'Gerar relatório técnico? (SIM/NAO)';

COMMENT ON COLUMN public.fichas_tecnicas.emissao_art IS
  'Emitir ART (Anotação de Responsabilidade Técnica)? (SIM/NAO)';

-- 3️⃣ Atualizar fichas existentes com valores padrão
UPDATE public.fichas_tecnicas
SET
  fornecimento_desenho = 'NAO',
  fotos_relatorio = 'NAO',
  relatorio_tecnico = 'NAO',
  emissao_art = 'NAO'
WHERE
  fornecimento_desenho IS NULL
  OR fotos_relatorio IS NULL
  OR relatorio_tecnico IS NULL
  OR emissao_art IS NULL;
