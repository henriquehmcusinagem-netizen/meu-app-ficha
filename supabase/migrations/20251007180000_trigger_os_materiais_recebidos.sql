-- Migration: Atualizar OS quando materiais são recebidos em Compras
-- Quando requisição muda para 'recebido', a OS vinculada deve ir para 'aguardando_inicio'

-- ============================================================
-- FUNÇÃO: Atualizar OS quando materiais recebidos
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_os_materiais_recebidos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_os_id UUID;
  v_numero_os TEXT;
BEGIN
  -- Só processar se status mudou para 'recebido'
  IF NEW.status = 'recebido' AND (OLD.status IS NULL OR OLD.status != 'recebido') THEN

    -- Verificar se há OS vinculada
    IF NEW.os_id IS NOT NULL THEN
      v_os_id := NEW.os_id;

      RAISE NOTICE '📦 Materiais recebidos para requisição %! Atualizando OS...', NEW.id;

      -- Buscar número da OS
      SELECT numero_os INTO v_numero_os
      FROM ordens_servico
      WHERE id = v_os_id;

      -- Atualizar OS: aguardando_materiais → aguardando_inicio
      UPDATE ordens_servico
      SET
        status = 'aguardando_inicio',
        observacoes = COALESCE(observacoes || E'\n', '') ||
                     'Materiais recebidos em ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI')
      WHERE id = v_os_id
        AND status = 'aguardando_materiais';

      IF FOUND THEN
        RAISE NOTICE '🏭 OS % atualizada para "aguardando_inicio" (materiais disponíveis)', v_numero_os;
      ELSE
        RAISE NOTICE '⚠️ OS % não estava em "aguardando_materiais", nenhuma atualização necessária', v_numero_os;
      END IF;

    ELSE
      RAISE NOTICE '⚠️ Requisição % não tem OS vinculada (os_id NULL)', NEW.id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION atualizar_os_materiais_recebidos IS
'Atualiza OS para aguardando_inicio quando materiais da requisição são recebidos em Compras';

-- ============================================================
-- TRIGGER: Disparar após materiais recebidos
-- ============================================================
CREATE TRIGGER trigger_os_materiais_recebidos
  AFTER UPDATE ON requisicoes_compra
  FOR EACH ROW
  WHEN (NEW.status = 'recebido')
  EXECUTE FUNCTION atualizar_os_materiais_recebidos();

COMMENT ON TRIGGER trigger_os_materiais_recebidos ON requisicoes_compra IS
'Atualiza OS para aguardando_inicio quando Compras marca materiais como recebidos';
