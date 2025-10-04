-- =====================================================
-- MIGRAÇÃO: Adicionar Nº do DESENHO
-- Data: 2025-10-03 15:00:00
-- Descrição: Adiciona campo numero_desenho na seção
--            de CONTROLE para armazenar o número do
--            desenho técnico associado à ficha
-- =====================================================

-- 1️⃣ Adicionar coluna numero_desenho
ALTER TABLE public.fichas_tecnicas
ADD COLUMN IF NOT EXISTS numero_desenho TEXT;

-- 2️⃣ Adicionar comentário explicativo
COMMENT ON COLUMN public.fichas_tecnicas.numero_desenho IS
  'Número do desenho técnico associado à ficha (ex: DES-2024-001)';
