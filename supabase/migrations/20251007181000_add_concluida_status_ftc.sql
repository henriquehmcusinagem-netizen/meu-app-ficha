-- Migration: Adicionar status 'concluida' ao workflow de fichas técnicas
-- Workflow completo agora:
-- rascunho → preenchida → aguardando_cotacao_compras → aguardando_orcamento_comercial
-- → orcamento_enviado_cliente → orcamento_aprovado_cliente → em_producao → concluida

-- Drop constraint antiga
ALTER TABLE fichas_tecnicas
DROP CONSTRAINT IF EXISTS fichas_tecnicas_status_check;

-- Adicionar nova constraint com 'concluida'
ALTER TABLE fichas_tecnicas
ADD CONSTRAINT fichas_tecnicas_status_check
CHECK (
  status = ANY (ARRAY[
    'rascunho'::text,
    'preenchida'::text,
    'aguardando_cotacao_compras'::text,
    'aguardando_orcamento_comercial'::text,
    'orcamento_enviado_cliente'::text,
    'orcamento_aprovado_cliente'::text,
    'em_producao'::text,
    'concluida'::text
  ])
);

COMMENT ON CONSTRAINT fichas_tecnicas_status_check ON fichas_tecnicas IS
'Status workflow: rascunho → preenchida → aguardando_cotacao_compras → aguardando_orcamento_comercial → orcamento_enviado_cliente → orcamento_aprovado_cliente → em_producao → concluida';
