-- Migration: Sistema de Dupla Aprovação (Orçamento + Ficha Técnica)
-- Cliente precisa aprovar AMBOS antes do PCP receber a requisição
-- Aprovações podem ser feitas em qualquer ordem

-- ============================================================
-- 1. FUNÇÃO REUTILIZÁVEL: Criar requisição (chamada por ambos os triggers)
-- ============================================================
CREATE OR REPLACE FUNCTION criar_requisicao_apos_dupla_aprovacao(p_numero_ftc TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ficha_id UUID;
  v_tipo_requisicao TEXT;
  v_requisicao_id UUID;
  v_materiais_corte INTEGER;
  v_orcamento_aprovado BOOLEAN;
  v_ftc_aprovada BOOLEAN;
BEGIN
  -- Buscar ficha e verificar AMBAS aprovações
  SELECT
    id,
    aprovado_orcamento_cliente,
    aprovado_ftc_cliente
  INTO
    v_ficha_id,
    v_orcamento_aprovado,
    v_ftc_aprovada
  FROM fichas_tecnicas
  WHERE numero_ftc = p_numero_ftc
    AND status = 'orcamento_enviado_cliente';

  -- Se não encontrou ficha ou status errado, abortar
  IF v_ficha_id IS NULL THEN
    RAISE NOTICE 'FTC % não encontrada ou status diferente de orcamento_enviado_cliente', p_numero_ftc;
    RETURN;
  END IF;

  -- Verificar se AMBAS aprovações foram feitas
  IF v_orcamento_aprovado = true AND v_ftc_aprovada = true THEN

    RAISE NOTICE '✅ DUPLA APROVAÇÃO completa para FTC %! Criando requisição...', p_numero_ftc;

    -- Atualizar status da ficha
    UPDATE fichas_tecnicas
    SET
      status = 'orcamento_aprovado_cliente',
      data_ultima_edicao = NOW()
    WHERE id = v_ficha_id;

    -- Determinar tipo de requisição baseado em materiais
    SELECT COUNT(*)
    INTO v_materiais_corte
    FROM materiais
    WHERE ficha_id = v_ficha_id
      AND (
        descricao ILIKE '%chapa%'
        OR descricao ILIKE '%barra%'
        OR descricao ILIKE '%tubo%'
      );

    IF v_materiais_corte > 0 THEN
      v_tipo_requisicao := 'corte';
    ELSE
      v_tipo_requisicao := 'compra';
    END IF;

    -- Criar requisição de compra
    INSERT INTO requisicoes_compra (
      ficha_id,
      numero_ftc,
      tipo,
      status,
      observacoes
    ) VALUES (
      v_ficha_id,
      p_numero_ftc,
      v_tipo_requisicao,
      'aguardando_pcp',
      'Requisição criada após dupla aprovação (Orçamento + Ficha Técnica)'
    )
    RETURNING id INTO v_requisicao_id;

    -- Criar entrada em aprovacoes_pcp
    INSERT INTO aprovacoes_pcp (
      requisicao_id,
      ficha_id,
      numero_ftc,
      tipo,
      status,
      observacoes
    ) VALUES (
      v_requisicao_id,
      v_ficha_id,
      p_numero_ftc,
      v_tipo_requisicao,
      'aguardando',
      'Aguardando validação do PCP (medidas, desenho, processos, material)'
    );

    RAISE NOTICE '✅ Requisição % criada para PCP validar (tipo: %)', v_requisicao_id, v_tipo_requisicao;

  ELSE
    RAISE NOTICE '⏳ FTC % aguardando segunda aprovação (Orçamento: %, FTC: %)',
                 p_numero_ftc, v_orcamento_aprovado, v_ftc_aprovada;
  END IF;
END;
$$;

COMMENT ON FUNCTION criar_requisicao_apos_dupla_aprovacao IS
'Cria requisição para PCP apenas quando AMBAS aprovações (orçamento + ficha técnica) foram feitas';

-- ============================================================
-- 2. TRIGGER: Aprovação de ORÇAMENTO pelo cliente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_aprovacao_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ficha_id UUID;
BEGIN
  -- Só processar se for tipo 'aprovar'
  IF NEW.tipo = 'aprovar' THEN

    -- Buscar ID da ficha
    SELECT id INTO v_ficha_id
    FROM fichas_tecnicas
    WHERE numero_ftc = NEW.numero_ftc;

    IF v_ficha_id IS NOT NULL THEN

      -- Marcar orçamento como aprovado
      UPDATE fichas_tecnicas
      SET
        aprovado_orcamento_cliente = true,
        data_aprovacao_orcamento_cliente = NOW(),
        data_ultima_edicao = NOW()
      WHERE id = v_ficha_id;

      RAISE NOTICE '💰 Orçamento aprovado para FTC %', NEW.numero_ftc;

      -- Tentar criar requisição (só cria se FTC também aprovada)
      PERFORM criar_requisicao_apos_dupla_aprovacao(NEW.numero_ftc);
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger em aprovacoes_orcamento_cliente
DROP TRIGGER IF EXISTS trigger_aprovacao_orcamento ON aprovacoes_orcamento_cliente;

CREATE TRIGGER trigger_aprovacao_orcamento
  AFTER INSERT ON aprovacoes_orcamento_cliente
  FOR EACH ROW
  EXECUTE FUNCTION trigger_aprovacao_orcamento();

COMMENT ON TRIGGER trigger_aprovacao_orcamento ON aprovacoes_orcamento_cliente IS
'Marca orçamento como aprovado e verifica se pode criar requisição para PCP';

-- ============================================================
-- 3. TRIGGER: Aprovação de FICHA TÉCNICA pelo cliente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_aprovacao_ftc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ficha_id UUID;
BEGIN
  -- Só processar se for tipo 'aprovar'
  IF NEW.tipo = 'aprovar' THEN

    -- Buscar ID da ficha
    SELECT id INTO v_ficha_id
    FROM fichas_tecnicas
    WHERE numero_ftc = NEW.numero_ftc;

    IF v_ficha_id IS NOT NULL THEN

      -- Marcar ficha técnica como aprovada
      UPDATE fichas_tecnicas
      SET
        aprovado_ftc_cliente = true,
        data_aprovacao_ftc_cliente = NOW(),
        data_ultima_edicao = NOW()
      WHERE id = v_ficha_id;

      RAISE NOTICE '📋 Ficha Técnica aprovada para FTC %', NEW.numero_ftc;

      -- Tentar criar requisição (só cria se Orçamento também aprovado)
      PERFORM criar_requisicao_apos_dupla_aprovacao(NEW.numero_ftc);
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Substituir trigger antigo em aprovacoes_ftc_cliente
DROP TRIGGER IF EXISTS trigger_auto_update_status_aprovado ON aprovacoes_ftc_cliente;

CREATE TRIGGER trigger_aprovacao_ftc
  AFTER INSERT ON aprovacoes_ftc_cliente
  FOR EACH ROW
  EXECUTE FUNCTION trigger_aprovacao_ftc();

COMMENT ON TRIGGER trigger_aprovacao_ftc ON aprovacoes_ftc_cliente IS
'Marca ficha técnica como aprovada e verifica se pode criar requisição para PCP';

-- ============================================================
-- 4. REMOVER FUNÇÃO ANTIGA (não mais necessária)
-- ============================================================
DROP FUNCTION IF EXISTS auto_update_status_aprovado() CASCADE;

COMMENT ON FUNCTION criar_requisicao_apos_dupla_aprovacao IS
'Sistema de dupla aprovação: Cliente precisa aprovar ORÇAMENTO + FICHA TÉCNICA antes do PCP receber requisição. Aprovações podem ser em qualquer ordem.';
