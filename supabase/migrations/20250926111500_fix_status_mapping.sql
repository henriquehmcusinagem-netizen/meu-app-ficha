-- Migration para corrigir mapeamento de status do banco para o novo fluxo
-- Mapear status antigos para os novos status da interface

-- Mapear status antigos para novos
UPDATE fichas_tecnicas
SET status = CASE
  WHEN status = 'aguardando_cotacao' THEN 'aguardando_cotacao_compras'
  WHEN status = 'preenchida' THEN 'aguardando_cotacao_compras'  -- Se técnico finalizou, vai para compras
  WHEN status = 'orcamento_gerado' THEN 'aguardando_orcamento_comercial'
  WHEN status = 'finalizada' THEN 'orcamento_enviado_cliente'
  ELSE status  -- Manter 'rascunho' como está
END;

-- Comentário explicativo
COMMENT ON TABLE fichas_tecnicas IS
'Status mapeados: rascunho → aguardando_cotacao_compras → aguardando_orcamento_comercial → orcamento_enviado_cliente';