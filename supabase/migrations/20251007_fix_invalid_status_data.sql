-- Migration para corrigir fichas com status obsoletos/inválidos
-- Esta migration APENAS atualiza dados, NÃO modifica a constraint
--
-- Problema: Fichas criadas antes da migration 20250926104505 ainda têm status antigos
-- que não estão mais permitidos pela constraint fichas_tecnicas_status_check
--
-- Status obsoletos encontrados no banco:
-- - 'aguardando_cotacao' → deve virar 'aguardando_cotacao_compras'
-- - 'finalizada' → deve virar 'orcamento_enviado_cliente'
-- - 'orcamento_gerado' → deve virar 'aguardando_orcamento_comercial'
-- - 'preenchida' → deve virar 'aguardando_cotacao_compras'

-- Atualizar todas as fichas com status obsoletos
UPDATE fichas_tecnicas
SET status = CASE
  -- Status antigos que precisam ser mapeados
  WHEN status = 'aguardando_cotacao' THEN 'aguardando_cotacao_compras'
  WHEN status = 'finalizada' THEN 'orcamento_enviado_cliente'
  WHEN status = 'orcamento_gerado' THEN 'aguardando_orcamento_comercial'
  WHEN status = 'preenchida' THEN 'aguardando_cotacao_compras'
  -- Manter status válidos como estão
  ELSE status
END
WHERE status NOT IN (
  'rascunho',
  'aguardando_cotacao_compras',
  'aguardando_orcamento_comercial',
  'orcamento_enviado_cliente'
);

-- Comentário explicativo
COMMENT ON TABLE fichas_tecnicas IS
'Fluxo de status válidos: rascunho → aguardando_cotacao_compras → aguardando_orcamento_comercial → orcamento_enviado_cliente';
