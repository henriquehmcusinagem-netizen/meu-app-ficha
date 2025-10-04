-- Atualizar constraint de status para incluir novos status do fluxo completo
-- Remove a constraint antiga que só permitia 'rascunho' e 'finalizada'
ALTER TABLE fichas_tecnicas
DROP CONSTRAINT IF EXISTS fichas_tecnicas_status_check;

-- Adiciona nova constraint com todos os status do novo fluxo
ALTER TABLE fichas_tecnicas
ADD CONSTRAINT fichas_tecnicas_status_check
CHECK (status IN (
  'rascunho',                        -- Técnico ainda preenchendo
  'preenchida',                      -- Técnico finalizou
  'aguardando_cotacao_compras',      -- Aguardando compras cotar materiais
  'aguardando_orcamento_comercial',  -- Compras cotou, aguardando comercial
  'orcamento_enviado_cliente'        -- Comercial gerou e enviou orçamento
));

-- Atualizar fichas existentes com status 'finalizada' para o novo fluxo
UPDATE fichas_tecnicas
SET status = 'orcamento_enviado_cliente'
WHERE status = 'finalizada';

-- Comentário explicativo
COMMENT ON CONSTRAINT fichas_tecnicas_status_check ON fichas_tecnicas IS
'Controla o fluxo de status: Técnico ’ Compras ’ Comercial ’ Cliente';