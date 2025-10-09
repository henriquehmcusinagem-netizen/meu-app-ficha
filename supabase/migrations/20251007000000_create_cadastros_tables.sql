-- Migration: Criar tabelas do módulo Cadastros
-- Data: 2025-10-07
-- Descrição: Tabelas para gerenciar clientes, contatos, funcionários e permissões

-- ============================================================================
-- TABELA: clientes
-- Descrição: Cadastro de empresas/clientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_razao_social TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    endereco TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para clientes
CREATE INDEX idx_clientes_cnpj ON public.clientes(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_clientes_ativo ON public.clientes(ativo);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Cadastro de clientes/empresas';
COMMENT ON COLUMN public.clientes.nome_razao_social IS 'Nome fantasia ou razão social';
COMMENT ON COLUMN public.clientes.cnpj IS 'CNPJ da empresa (único)';

-- ============================================================================
-- TABELA: contatos_cliente
-- Descrição: Contatos de cada cliente (telefone, email)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contatos_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    celular TEXT,
    email TEXT,
    principal BOOLEAN DEFAULT false,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para contatos
CREATE INDEX idx_contatos_cliente_id ON public.contatos_cliente(cliente_id);
CREATE INDEX idx_contatos_principal ON public.contatos_cliente(principal) WHERE principal = true;

-- Comentários
COMMENT ON TABLE public.contatos_cliente IS 'Contatos associados a cada cliente';
COMMENT ON COLUMN public.contatos_cliente.principal IS 'Marca se é o contato principal/padrão';

-- ============================================================================
-- TABELA: funcionarios
-- Descrição: Cadastro de funcionários/operadores da produção
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    ativo BOOLEAN DEFAULT true,
    capacidade_maxima TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para funcionarios
CREATE INDEX idx_funcionarios_ativo ON public.funcionarios(ativo);
CREATE INDEX idx_funcionarios_email ON public.funcionarios(email) WHERE email IS NOT NULL;

-- Comentários
COMMENT ON TABLE public.funcionarios IS 'Cadastro de funcionários/operadores da produção';
COMMENT ON COLUMN public.funcionarios.capacidade_maxima IS 'Ex: "Torno até 1200mm", "Solda MIG/TIG até 15mm"';

-- ============================================================================
-- TABELA: funcionario_processos
-- Descrição: Processos que cada funcionário domina (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.funcionario_processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    processo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(funcionario_id, processo)
);

-- Índices
CREATE INDEX idx_funcionario_processos_funcionario ON public.funcionario_processos(funcionario_id);
CREATE INDEX idx_funcionario_processos_processo ON public.funcionario_processos(processo);

-- Comentários
COMMENT ON TABLE public.funcionario_processos IS 'Processos que cada funcionário está apto a executar';
COMMENT ON COLUMN public.funcionario_processos.processo IS 'Nome do processo: torno_grande, solda, cnc_tf, etc (mesmo nome dos campos da FTC)';

-- ============================================================================
-- TABELA: alocacoes_producao
-- Descrição: Alocação de processos de OS para funcionários
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.alocacoes_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_os_id UUID NOT NULL REFERENCES public.processos_os(id) ON DELETE CASCADE,
    funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE RESTRICT,
    data_alocacao TIMESTAMPTZ DEFAULT NOW(),
    data_inicio_real TIMESTAMPTZ,
    data_fim_real TIMESTAMPTZ,
    alocado_por UUID REFERENCES auth.users(id),
    tipo_alocacao TEXT CHECK (tipo_alocacao IN ('automatica', 'manual')),
    observacoes TEXT
);

-- Índices
CREATE INDEX idx_alocacoes_processo_os ON public.alocacoes_producao(processo_os_id);
CREATE INDEX idx_alocacoes_funcionario ON public.alocacoes_producao(funcionario_id);
CREATE INDEX idx_alocacoes_data ON public.alocacoes_producao(data_alocacao);

-- Comentários
COMMENT ON TABLE public.alocacoes_producao IS 'Alocação de processos de OS para funcionários específicos';
COMMENT ON COLUMN public.alocacoes_producao.tipo_alocacao IS 'automatica: sugerido pelo sistema | manual: escolhido pelo encarregado';

-- ============================================================================
-- TABELA: user_permissions
-- Descrição: Permissões de acesso a módulos por usuário
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modulo TEXT NOT NULL,
    can_access BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, modulo)
);

-- Índices
CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_modulo ON public.user_permissions(modulo);

-- Comentários
COMMENT ON TABLE public.user_permissions IS 'Controle de acesso a módulos do sistema por usuário';
COMMENT ON COLUMN public.user_permissions.modulo IS 'Nome do módulo: dashboard, fichas, compras, comercial, pcp, producao, cadastros';

-- ============================================================================
-- TABELA: user_special_permissions
-- Descrição: Permissões especiais por usuário
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_special_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission)
);

-- Índices
CREATE INDEX idx_user_special_permissions_user ON public.user_special_permissions(user_id);
CREATE INDEX idx_user_special_permissions_permission ON public.user_special_permissions(permission);

-- Comentários
COMMENT ON TABLE public.user_special_permissions IS 'Permissões especiais além do acesso a módulos';
COMMENT ON COLUMN public.user_special_permissions.permission IS 'Tipo: aprovar_interno, deletar, ver_custos, administrador';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alocacoes_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_special_permissions ENABLE ROW LEVEL SECURITY;

-- Policies: Permitir tudo para usuários autenticados (por enquanto)
-- TODO: Refinar policies baseado em permissões específicas

-- clientes
CREATE POLICY "Usuários autenticados podem visualizar clientes"
    ON public.clientes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem criar clientes"
    ON public.clientes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar clientes"
    ON public.clientes FOR UPDATE
    TO authenticated
    USING (true);

-- contatos_cliente
CREATE POLICY "Usuários autenticados podem gerenciar contatos"
    ON public.contatos_cliente FOR ALL
    TO authenticated
    USING (true);

-- funcionarios
CREATE POLICY "Usuários autenticados podem gerenciar funcionarios"
    ON public.funcionarios FOR ALL
    TO authenticated
    USING (true);

-- funcionario_processos
CREATE POLICY "Usuários autenticados podem gerenciar processos de funcionarios"
    ON public.funcionario_processos FOR ALL
    TO authenticated
    USING (true);

-- alocacoes_producao
CREATE POLICY "Usuários autenticados podem gerenciar alocações"
    ON public.alocacoes_producao FOR ALL
    TO authenticated
    USING (true);

-- user_permissions
CREATE POLICY "Usuários podem ver suas próprias permissões"
    ON public.user_permissions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Administradores podem gerenciar permissões"
    ON public.user_permissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_special_permissions
            WHERE user_id = auth.uid()
            AND permission = 'administrador'
            AND granted = true
        )
    );

-- user_special_permissions
CREATE POLICY "Usuários podem ver suas próprias permissões especiais"
    ON public.user_special_permissions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Administradores podem gerenciar permissões especiais"
    ON public.user_special_permissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_special_permissions
            WHERE user_id = auth.uid()
            AND permission = 'administrador'
            AND granted = true
        )
    );
