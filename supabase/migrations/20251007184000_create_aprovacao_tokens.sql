-- Migration: Criar tabela de tokens únicos para aprovação via link
-- Cada contato que recebe o HTML terá um token único
-- Quando abre o link, campos são preenchidos automaticamente com seus dados

-- ============================================================
-- 1. CRIAR TABELA aprovacao_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS aprovacao_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  ficha_id UUID REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('orcamento', 'ficha', 'ambos')),
  contato_nome TEXT NOT NULL,
  contato_email TEXT NOT NULL,
  contato_telefone TEXT,
  contato_cargo TEXT,
  usado BOOLEAN DEFAULT false,
  usado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  expira_em TIMESTAMPTZ NOT NULL,
  CONSTRAINT expira_futuro CHECK (expira_em > criado_em)
);

-- ============================================================
-- 2. ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_aprovacao_tokens_token ON aprovacao_tokens(token) WHERE NOT usado;
CREATE INDEX idx_aprovacao_tokens_ficha_id ON aprovacao_tokens(ficha_id);
CREATE INDEX idx_aprovacao_tokens_email ON aprovacao_tokens(contato_email);
CREATE INDEX idx_aprovacao_tokens_usado ON aprovacao_tokens(usado) WHERE NOT usado;
CREATE INDEX idx_aprovacao_tokens_expira_em ON aprovacao_tokens(expira_em) WHERE NOT usado;

-- ============================================================
-- 3. RLS (Row Level Security)
-- ============================================================
ALTER TABLE aprovacao_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer pessoa pode consultar tokens válidos (necessário para aprovação pública)
CREATE POLICY "Tokens válidos são públicos para leitura"
ON aprovacao_tokens
FOR SELECT
TO public
USING (NOT usado AND expira_em > NOW());

-- Policy: Apenas usuários autenticados podem criar tokens
CREATE POLICY "Usuários autenticados podem criar tokens"
ON aprovacao_tokens
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Apenas usuários autenticados podem marcar como usado
CREATE POLICY "Usuários autenticados podem marcar como usado"
ON aprovacao_tokens
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- 4. COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE aprovacao_tokens IS
'Tokens únicos gerados para cada contato que recebe link de aprovação. Permite preencher automaticamente dados do contato no formulário HTML.';

COMMENT ON COLUMN aprovacao_tokens.token IS
'Token único (UUID) usado na URL para identificar o contato';

COMMENT ON COLUMN aprovacao_tokens.tipo IS
'Tipo de aprovação: orcamento (só orçamento), ficha (só ficha técnica), ambos (orçamento + ficha)';

COMMENT ON COLUMN aprovacao_tokens.usado IS
'Se true, token já foi utilizado para aprovar/rejeitar/alterar';

COMMENT ON COLUMN aprovacao_tokens.expira_em IS
'Data de expiração do token (geralmente 30 dias após criação)';

-- ============================================================
-- 5. FUNÇÃO para limpar tokens expirados (manutenção)
-- ============================================================
CREATE OR REPLACE FUNCTION limpar_tokens_expirados()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deletados INTEGER;
BEGIN
  DELETE FROM aprovacao_tokens
  WHERE expira_em < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deletados = ROW_COUNT;

  RAISE NOTICE 'Limpeza de tokens: % tokens expirados removidos', v_deletados;

  RETURN v_deletados;
END;
$$;

COMMENT ON FUNCTION limpar_tokens_expirados IS
'Remove tokens expirados há mais de 90 dias (manutenção do banco)';
