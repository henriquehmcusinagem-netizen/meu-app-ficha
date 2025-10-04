-- =====================================================
-- Migration: Reorganizar Horas de Produção
-- Data: 2025-10-03
-- Descrição: Adiciona 12 novos campos e reorganiza horas de produção
-- =====================================================

-- Adicionar novos campos de horas de produção
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS torno_cnc NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS centro_usinagem NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fresa NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS furadeira NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS macarico NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS solda NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS serra NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS caldeiraria NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS montagem NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lavagem NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS acabamento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tecnico_horas NUMERIC DEFAULT 0;

-- =====================================================
-- MIGRAÇÃO DE DADOS
-- =====================================================

-- 1. Copiar cnc_tf para torno_cnc
UPDATE public.fichas_tecnicas
SET torno_cnc = COALESCE(cnc_tf, 0)
WHERE cnc_tf IS NOT NULL AND cnc_tf > 0;

-- 2. Copiar fresa_furad para fresa E furadeira (duplicar valor)
UPDATE public.fichas_tecnicas
SET fresa = COALESCE(fresa_furad, 0),
    furadeira = COALESCE(fresa_furad, 0)
WHERE fresa_furad IS NOT NULL AND fresa_furad > 0;

-- 3. Copiar macarico_solda para macarico E solda (duplicar valor)
UPDATE public.fichas_tecnicas
SET macarico = COALESCE(macarico_solda, 0),
    solda = COALESCE(macarico_solda, 0)
WHERE macarico_solda IS NOT NULL AND macarico_solda > 0;

-- 4. Copiar des_montg para montagem (manter des_montg para desmontagem)
UPDATE public.fichas_tecnicas
SET montagem = COALESCE(des_montg, 0)
WHERE des_montg IS NOT NULL AND des_montg > 0;

-- 5. Copiar lavagem_acab para lavagem E acabamento (duplicar valor)
UPDATE public.fichas_tecnicas
SET lavagem = COALESCE(lavagem_acab, 0),
    acabamento = COALESCE(lavagem_acab, 0)
WHERE lavagem_acab IS NOT NULL AND lavagem_acab > 0;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN public.fichas_tecnicas.torno_cnc IS 'Horas de Torno CNC (novo campo, migrado de cnc_tf)';
COMMENT ON COLUMN public.fichas_tecnicas.centro_usinagem IS 'Horas de Centro de Usinagem';
COMMENT ON COLUMN public.fichas_tecnicas.fresa IS 'Horas de Fresa (separado de fresa_furad)';
COMMENT ON COLUMN public.fichas_tecnicas.furadeira IS 'Horas de Furadeira (separado de fresa_furad)';
COMMENT ON COLUMN public.fichas_tecnicas.macarico IS 'Horas de Maçarico (separado de macarico_solda)';
COMMENT ON COLUMN public.fichas_tecnicas.solda IS 'Horas de Solda (separado de macarico_solda)';
COMMENT ON COLUMN public.fichas_tecnicas.serra IS 'Horas de Serra';
COMMENT ON COLUMN public.fichas_tecnicas.caldeiraria IS 'Horas de Caldeiraria';
COMMENT ON COLUMN public.fichas_tecnicas.montagem IS 'Horas de Montagem (separado de des_montg)';
COMMENT ON COLUMN public.fichas_tecnicas.lavagem IS 'Horas de Lavagem (separado de lavagem_acab)';
COMMENT ON COLUMN public.fichas_tecnicas.acabamento IS 'Horas de Acabamento (separado de lavagem_acab)';
COMMENT ON COLUMN public.fichas_tecnicas.tecnico_horas IS 'Horas de Técnico';

-- Marcar campos antigos como deprecated (manter por compatibilidade)
COMMENT ON COLUMN public.fichas_tecnicas.cnc_tf IS '[DEPRECATED] Use torno_cnc - Mantido por compatibilidade';
COMMENT ON COLUMN public.fichas_tecnicas.fresa_furad IS '[DEPRECATED] Use fresa + furadeira - Mantido por compatibilidade';
COMMENT ON COLUMN public.fichas_tecnicas.macarico_solda IS '[DEPRECATED] Use macarico + solda - Mantido por compatibilidade';
COMMENT ON COLUMN public.fichas_tecnicas.lavagem_acab IS '[DEPRECATED] Use lavagem + acabamento - Mantido por compatibilidade';
