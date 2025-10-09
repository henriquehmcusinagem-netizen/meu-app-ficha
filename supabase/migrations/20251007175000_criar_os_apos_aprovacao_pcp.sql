-- Migration: Criar OS (Ordem de Serviço) APÓS aprovação do PCP
-- A OS deve ser criada quando o PCP finaliza a validação (marca aprovacoes_pcp.status = 'aprovado')
-- Não deve ser criada quando cliente aprova (momento errado)

-- ============================================================
-- 1. DESABILITAR TRIGGER ANTIGO (que dispara no momento errado)
-- ============================================================
DROP TRIGGER IF EXISTS trigger_criar_os_automatica ON fichas_tecnicas;

COMMENT ON FUNCTION criar_os_automatica IS
'DEPRECATED: Função antiga que criava OS no momento errado (após aprovação do cliente). Substituída por trigger em aprovacoes_pcp';

-- ============================================================
-- 2. NOVA FUNÇÃO: Criar OS após aprovação do PCP
-- ============================================================
CREATE OR REPLACE FUNCTION criar_os_apos_aprovacao_pcp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_numero_os TEXT;
  v_os_id UUID;
  v_ficha_id UUID;
  v_numero_ftc TEXT;
BEGIN
  -- Só processar se o status mudou para 'aprovado'
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN

    v_ficha_id := NEW.ficha_id;
    v_numero_ftc := NEW.numero_ftc;

    RAISE NOTICE '✅ PCP aprovou requisição %! Criando OS para produção...', NEW.requisicao_id;

    -- Gerar próximo número de OS
    SELECT get_next_os_number() INTO v_numero_os;

    -- Criar Ordem de Serviço
    INSERT INTO ordens_servico (
      numero_os,
      ficha_id,
      numero_ftc,
      requisicao_id,
      status,
      observacoes,
      data_criacao
    ) VALUES (
      v_numero_os,
      v_ficha_id,
      v_numero_ftc,
      NEW.requisicao_id,
      'aguardando_materiais',
      'OS criada automaticamente após aprovação do PCP',
      NOW()
    )
    RETURNING id INTO v_os_id;

    RAISE NOTICE '🏭 OS % criada para FTC % (status: aguardando_materiais)', v_numero_os, v_numero_ftc;

    -- Atualizar ficha técnica com status de produção
    UPDATE fichas_tecnicas
    SET
      status = 'em_producao',
      data_ultima_edicao = NOW()
    WHERE id = v_ficha_id;

    RAISE NOTICE '📊 FTC % atualizada para status "em_producao"', v_numero_ftc;

    -- Atualizar requisição de compra com link para OS
    UPDATE requisicoes_compra
    SET
      os_id = v_os_id,
      status = 'aprovada_pcp',
      data_aprovacao_pcp = NOW(),
      data_ultima_edicao = NOW()
    WHERE id = NEW.requisicao_id;

    RAISE NOTICE '📦 Requisição % atualizada com OS vinculada (status: aprovada_pcp)', NEW.requisicao_id;

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION criar_os_apos_aprovacao_pcp IS
'Cria OS automaticamente quando PCP aprova a requisição (aprovacoes_pcp.status = aprovado). Status inicial: aguardando_materiais';

-- ============================================================
-- 3. TRIGGER: Disparar após PCP aprovar
-- ============================================================
CREATE TRIGGER trigger_criar_os_apos_aprovacao_pcp
  AFTER UPDATE ON aprovacoes_pcp
  FOR EACH ROW
  WHEN (NEW.status = 'aprovado')
  EXECUTE FUNCTION criar_os_apos_aprovacao_pcp();

COMMENT ON TRIGGER trigger_criar_os_apos_aprovacao_pcp ON aprovacoes_pcp IS
'Cria OS automaticamente quando PCP finaliza validação e aprova a requisição';

-- ============================================================
-- 4. VERIFICAR SE COLUNA os_id EXISTE EM requisicoes_compra
-- ============================================================
-- Adicionar coluna se não existir (para vincular requisição à OS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'requisicoes_compra'
      AND column_name = 'os_id'
  ) THEN
    ALTER TABLE requisicoes_compra
    ADD COLUMN os_id UUID REFERENCES ordens_servico(id);

    COMMENT ON COLUMN requisicoes_compra.os_id IS
    'Vínculo com a Ordem de Serviço criada após aprovação do PCP';
  END IF;
END $$;
