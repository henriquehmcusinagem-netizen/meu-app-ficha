-- =====================================================
-- MIGRAÇÃO: Adicionar 4 Campos Extras
-- Data: 2025-10-03 13:00:00
-- Descrição: Adiciona balanceamento_campo, rotacao,
--            observacoes_adicionais e prioridade
-- =====================================================

-- 1️⃣ Adicionar 4 colunas novas
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS balanceamento_campo TEXT DEFAULT 'NAO',
ADD COLUMN IF NOT EXISTS rotacao TEXT,
ADD COLUMN IF NOT EXISTS observacoes_adicionais TEXT,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'Normal';

-- 2️⃣ Adicionar constraint para validar prioridade
ALTER TABLE public.fichas_tecnicas
DROP CONSTRAINT IF EXISTS check_prioridade;

ALTER TABLE public.fichas_tecnicas
ADD CONSTRAINT check_prioridade
  CHECK (
    prioridade IN ('Baixa', 'Normal', 'Alta', 'Emergência', '')
    OR prioridade IS NULL
  );

-- 3️⃣ Adicionar comentários explicativos nas colunas
COMMENT ON COLUMN public.fichas_tecnicas.balanceamento_campo IS
  'Necessita balanceamento? (SIM/NAO) - Se SIM, preencher campo rotacao';

COMMENT ON COLUMN public.fichas_tecnicas.rotacao IS
  'Rotação em RPM (preencher somente se balanceamento_campo = SIM)';

COMMENT ON COLUMN public.fichas_tecnicas.observacoes_adicionais IS
  'Observações adicionais gerais sobre a ficha técnica';

COMMENT ON COLUMN public.fichas_tecnicas.prioridade IS
  'Prioridade da ficha (Baixa | Normal | Alta | Emergência)';

-- 4️⃣ Atualizar fichas existentes com valores padrão
UPDATE public.fichas_tecnicas
SET
  balanceamento_campo = 'NAO',
  prioridade = 'Normal'
WHERE balanceamento_campo IS NULL OR prioridade IS NULL;
