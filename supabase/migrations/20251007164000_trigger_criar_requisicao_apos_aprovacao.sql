-- Migration: Expandir trigger para criar requisição automática após aprovação do cliente
-- Além de atualizar status, agora também:
-- 1. Atualiza campos booleanos de aprovação (aprovado_orcamento_cliente, data_aprovacao_orcamento_cliente)
-- 2. Cria requisição de compra automaticamente (status: aguardando_pcp)
-- 3. Cria entrada em aprovacoes_pcp (status: aguardando)

-- Substituir função existente com lógica expandida
CREATE OR REPLACE FUNCTION auto_update_status_aprovado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ficha_id UUID;
  v_tipo_requisicao TEXT;
  v_requisicao_id UUID;
  v_materiais_corte INTEGER;
BEGIN
  -- Só processar se for tipo 'aprovar'
  IF NEW.tipo = 'aprovar' THEN

    -- Buscar ID da ficha
    SELECT id INTO v_ficha_id
    FROM fichas_tecnicas
    WHERE numero_ftc = NEW.numero_ftc
      AND status = 'orcamento_enviado_cliente';

    -- Se encontrou a ficha no status correto
    IF v_ficha_id IS NOT NULL THEN

      -- 1. Atualizar status e campos de aprovação da ficha
      UPDATE fichas_tecnicas
      SET
        status = 'orcamento_aprovado_cliente',
        aprovado_orcamento_cliente = true,
        data_aprovacao_orcamento_cliente = NOW(),
        data_ultima_edicao = NOW()
      WHERE id = v_ficha_id;

      RAISE NOTICE 'FTC % marcada como aprovada e campos de aprovação atualizados', NEW.numero_ftc;

      -- 2. Determinar tipo de requisição baseado em materiais
      -- Se houver materiais com chapa/barra/tubo, tipo = 'corte'
      -- Caso contrário, tipo = 'compra'
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
        RAISE NOTICE 'FTC % tem materiais para corte (% itens)', NEW.numero_ftc, v_materiais_corte;
      ELSE
        v_tipo_requisicao := 'compra';
        RAISE NOTICE 'FTC % será requisição tipo compra (materiais gerais ou sem materiais)', NEW.numero_ftc;
      END IF;

      -- 3. Criar requisição de compra automaticamente
      INSERT INTO requisicoes_compra (
        ficha_id,
        numero_ftc,
        tipo,
        status,
        observacoes
      ) VALUES (
        v_ficha_id,
        NEW.numero_ftc,
        v_tipo_requisicao,
        'aguardando_pcp',
        'Requisição criada automaticamente após aprovação do cliente'
      )
      RETURNING id INTO v_requisicao_id;

      RAISE NOTICE 'Requisição % criada para FTC % (tipo: %, status: aguardando_pcp)',
                   v_requisicao_id, NEW.numero_ftc, v_tipo_requisicao;

      -- 4. Criar entrada em aprovacoes_pcp (aguardando validação do PCP)
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
        NEW.numero_ftc,
        v_tipo_requisicao,
        'aguardando',
        'Aguardando validação do PCP (medidas, desenho, processos, material)'
      );

      RAISE NOTICE 'Entrada criada em aprovacoes_pcp para FTC % (aguardando validação)', NEW.numero_ftc;

    ELSE
      RAISE NOTICE 'FTC % não foi atualizada (status atual diferente de orcamento_enviado_cliente)', NEW.numero_ftc;
    END IF;

  END IF;

  -- Retornar NEW para permitir a inserção continuar
  RETURN NEW;
END;
$$;

-- Trigger já existe, não precisa recriar
-- Apenas adicionamos comentário atualizado
COMMENT ON FUNCTION auto_update_status_aprovado() IS
'Atualiza automaticamente status da FTC para orcamento_aprovado_cliente, cria requisição de compra (aguardando_pcp) e entrada em aprovacoes_pcp quando cliente aprovar via HTML';

COMMENT ON TRIGGER trigger_auto_update_status_aprovado ON aprovacoes_ftc_cliente IS
'Trigger automático que: 1) Atualiza status da FTC, 2) Marca aprovação nos campos booleanos, 3) Cria requisição de compra, 4) Cria entrada em aprovacoes_pcp';
