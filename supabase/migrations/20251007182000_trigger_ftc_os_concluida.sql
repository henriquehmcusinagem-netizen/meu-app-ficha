-- Migration: Atualizar FTC quando OS é concluída
-- Quando OS muda para 'concluida', a FTC vinculada deve mudar para status 'concluida'

-- ============================================================
-- FUNÇÃO: Atualizar FTC quando OS concluída
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_ftc_os_concluida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ficha_id UUID;
  v_numero_ftc TEXT;
BEGIN
  -- Só processar se status mudou para 'concluida'
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN

    v_ficha_id := NEW.ficha_id;
    v_numero_ftc := NEW.numero_ftc;

    RAISE NOTICE '✅ OS % concluída! Atualizando FTC %...', NEW.numero_os, v_numero_ftc;

    -- Atualizar FTC: em_producao → concluida
    UPDATE fichas_tecnicas
    SET
      status = 'concluida',
      data_ultima_edicao = NOW()
    WHERE id = v_ficha_id
      AND status = 'em_producao';

    IF FOUND THEN
      RAISE NOTICE '🎉 FTC % marcada como concluída!', v_numero_ftc;
    ELSE
      RAISE NOTICE '⚠️ FTC % não estava em "em_producao", nenhuma atualização necessária', v_numero_ftc;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION atualizar_ftc_os_concluida IS
'Atualiza FTC para concluida quando OS de produção é finalizada';

-- ============================================================
-- TRIGGER: Disparar após OS concluída
-- ============================================================
CREATE TRIGGER trigger_ftc_os_concluida
  AFTER UPDATE ON ordens_servico
  FOR EACH ROW
  WHEN (NEW.status = 'concluida')
  EXECUTE FUNCTION atualizar_ftc_os_concluida();

COMMENT ON TRIGGER trigger_ftc_os_concluida ON ordens_servico IS
'Atualiza FTC para concluida quando Produção finaliza a OS';
