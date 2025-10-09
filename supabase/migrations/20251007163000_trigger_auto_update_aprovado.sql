-- Migration: Trigger automático para atualizar status após aprovação do cliente
-- Sempre que uma aprovação do tipo 'aprovar' for inserida na tabela aprovacoes_ftc_cliente,
-- automaticamente atualiza o status da ficha de 'orcamento_enviado_cliente' para 'orcamento_aprovado_cliente'

-- Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION auto_update_status_aprovado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só processar se for tipo 'aprovar'
  IF NEW.tipo = 'aprovar' THEN

    -- Atualizar status da ficha se ela estiver em 'orcamento_enviado_cliente'
    UPDATE fichas_tecnicas
    SET
      status = 'orcamento_aprovado_cliente',
      data_ultima_edicao = NOW()
    WHERE numero_ftc = NEW.numero_ftc
      AND status = 'orcamento_enviado_cliente';

    -- Log do resultado (opcional, para debug)
    IF FOUND THEN
      RAISE NOTICE 'FTC % automaticamente marcada como aprovada', NEW.numero_ftc;
    ELSE
      RAISE NOTICE 'FTC % não foi atualizada (status atual diferente de orcamento_enviado_cliente)', NEW.numero_ftc;
    END IF;

  END IF;

  -- Retornar NEW para permitir a inserção continuar
  RETURN NEW;
END;
$$;

-- Criar trigger que executa APÓS inserção em aprovacoes_ftc_cliente
DROP TRIGGER IF EXISTS trigger_auto_update_status_aprovado ON aprovacoes_ftc_cliente;

CREATE TRIGGER trigger_auto_update_status_aprovado
  AFTER INSERT ON aprovacoes_ftc_cliente
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_status_aprovado();

-- Adicionar comentário para documentação
COMMENT ON FUNCTION auto_update_status_aprovado() IS
'Atualiza automaticamente o status da ficha técnica para orcamento_aprovado_cliente quando cliente aprovar via HTML';

COMMENT ON TRIGGER trigger_auto_update_status_aprovado ON aprovacoes_ftc_cliente IS
'Trigger automático que atualiza status da FTC após aprovação do cliente';
