-- Add 'orcamento_aprovado_cliente' status to workflow
-- This allows the system to automatically mark budget approvals from clients
-- Safe migration: Only ADDS a new status value, does not modify existing data

-- Drop existing constraint
ALTER TABLE fichas_tecnicas
DROP CONSTRAINT IF EXISTS fichas_tecnicas_status_check;

-- Add new constraint including 'orcamento_aprovado_cliente'
ALTER TABLE fichas_tecnicas
ADD CONSTRAINT fichas_tecnicas_status_check
CHECK (status IN (
  'rascunho',                        -- Técnico ainda preenchendo
  'preenchida',                      -- Técnico finalizou
  'aguardando_cotacao_compras',      -- Aguardando compras cotar materiais
  'aguardando_orcamento_comercial',  -- Compras cotou, aguardando comercial
  'orcamento_enviado_cliente',       -- Comercial gerou e enviou orçamento
  'orcamento_aprovado_cliente'       -- 🆕 Cliente aprovou o orçamento via HTML
));

-- Update comment
COMMENT ON CONSTRAINT fichas_tecnicas_status_check ON fichas_tecnicas IS
'Controla o fluxo de status: Técnico → Compras → Comercial → Cliente → Aprovado';

-- Add comment for new status
COMMENT ON COLUMN fichas_tecnicas.status IS 'Status workflow: rascunho → preenchida → aguardando_cotacao_compras → aguardando_orcamento_comercial → orcamento_enviado_cliente → orcamento_aprovado_cliente';
