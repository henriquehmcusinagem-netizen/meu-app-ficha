-- Migration: Popular dados iniciais do módulo Cadastros
-- Data: 2025-10-07
-- Descrição: Dados de exemplo para clientes, funcionários e máquinas

-- ============================================================================
-- CLIENTES DE EXEMPLO
-- ============================================================================

INSERT INTO public.clientes (nome_razao_social, cnpj, endereco, observacoes, ativo)
VALUES
  ('Empresa Exemplo Ltda', '12.345.678/0001-90', 'Rua Exemplo, 123 - São Paulo, SP', 'Cliente de testes', true),
  ('Metalúrgica ABC S/A', '98.765.432/0001-10', 'Av. Industrial, 456 - Campinas, SP', 'Cliente principal', true),
  ('Indústria XYZ', '11.222.333/0001-44', 'Rodovia SP-330, Km 100 - Jundiaí, SP', 'Cliente secundário', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CONTATOS DOS CLIENTES
-- ============================================================================

-- Pegar IDs dos clientes inseridos
DO $$
DECLARE
  cliente_exemplo_id UUID;
  cliente_abc_id UUID;
  cliente_xyz_id UUID;
BEGIN
  -- Buscar IDs dos clientes
  SELECT id INTO cliente_exemplo_id FROM public.clientes WHERE cnpj = '12.345.678/0001-90';
  SELECT id INTO cliente_abc_id FROM public.clientes WHERE cnpj = '98.765.432/0001-10';
  SELECT id INTO cliente_xyz_id FROM public.clientes WHERE cnpj = '11.222.333/0001-44';

  -- Inserir contatos para Empresa Exemplo
  IF cliente_exemplo_id IS NOT NULL THEN
    INSERT INTO public.contatos_cliente (cliente_id, nome, celular, email, principal, observacoes)
    VALUES
      (cliente_exemplo_id, 'João Silva', '(11) 98765-4321', 'joao@exemplo.com.br', true, 'Gerente de compras'),
      (cliente_exemplo_id, 'Maria Santos', '(11) 97654-3210', 'maria@exemplo.com.br', false, 'Assistente')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Inserir contatos para Metalúrgica ABC
  IF cliente_abc_id IS NOT NULL THEN
    INSERT INTO public.contatos_cliente (cliente_id, nome, celular, email, principal, observacoes)
    VALUES
      (cliente_abc_id, 'Pedro Costa', '(19) 99876-5432', 'pedro@abc.com.br', true, 'Diretor técnico'),
      (cliente_abc_id, 'Ana Oliveira', '(19) 98765-4321', 'ana@abc.com.br', false, 'Engenheira')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Inserir contatos para Indústria XYZ
  IF cliente_xyz_id IS NOT NULL THEN
    INSERT INTO public.contatos_cliente (cliente_id, nome, celular, email, principal, observacoes)
    VALUES
      (cliente_xyz_id, 'Carlos Ferreira', '(11) 96543-2109', 'carlos@xyz.com.br', true, 'Coordenador de produção')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- FUNCIONÁRIOS DE EXEMPLO
-- ============================================================================

INSERT INTO public.funcionarios (nome, email, ativo, capacidade_maxima)
VALUES
  ('José Torneiro', 'jose.torneiro@hmc.com', true, 'Torno até 1200mm'),
  ('Marcos Soldador', 'marcos.soldador@hmc.com', true, 'Solda MIG/TIG até 15mm'),
  ('Paulo CNC', 'paulo.cnc@hmc.com', true, 'CNC TF - 5 eixos'),
  ('André Montador', 'andre.montador@hmc.com', true, 'Montagem e balanceamento'),
  ('Ricardo Pintor', 'ricardo.pintor@hmc.com', true, 'Pintura industrial')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROCESSOS DOS FUNCIONÁRIOS
-- ============================================================================

DO $$
DECLARE
  jose_id UUID;
  marcos_id UUID;
  paulo_id UUID;
  andre_id UUID;
  ricardo_id UUID;
BEGIN
  -- Buscar IDs dos funcionários
  SELECT id INTO jose_id FROM public.funcionarios WHERE email = 'jose.torneiro@hmc.com';
  SELECT id INTO marcos_id FROM public.funcionarios WHERE email = 'marcos.soldador@hmc.com';
  SELECT id INTO paulo_id FROM public.funcionarios WHERE email = 'paulo.cnc@hmc.com';
  SELECT id INTO andre_id FROM public.funcionarios WHERE email = 'andre.montador@hmc.com';
  SELECT id INTO ricardo_id FROM public.funcionarios WHERE email = 'ricardo.pintor@hmc.com';

  -- José Torneiro - processos de usinagem
  IF jose_id IS NOT NULL THEN
    INSERT INTO public.funcionario_processos (funcionario_id, processo)
    VALUES
      (jose_id, 'torno_grande'),
      (jose_id, 'torno_pequeno'),
      (jose_id, 'fresa_furad'),
      (jose_id, 'mandrilhamento')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Marcos Soldador - processos de solda
  IF marcos_id IS NOT NULL THEN
    INSERT INTO public.funcionario_processos (funcionario_id, processo)
    VALUES
      (marcos_id, 'macarico_solda'),
      (marcos_id, 'plasma_oxicorte'),
      (marcos_id, 'dobra')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Paulo CNC - processos CNC
  IF paulo_id IS NOT NULL THEN
    INSERT INTO public.funcionario_processos (funcionario_id, processo)
    VALUES
      (paulo_id, 'cnc_tf'),
      (paulo_id, 'programacao_cam'),
      (paulo_id, 'fresa_furad')
    ON CONFLICT DO NOTHING;
  END IF;

  -- André Montador - montagem e acabamento
  IF andre_id IS NOT NULL THEN
    INSERT INTO public.funcionario_processos (funcionario_id, processo)
    VALUES
      (andre_id, 'des_montg'),
      (andre_id, 'balanceamento'),
      (andre_id, 'lavagem_acab')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Ricardo Pintor - acabamento superficial
  IF ricardo_id IS NOT NULL THEN
    INSERT INTO public.funcionario_processos (funcionario_id, processo)
    VALUES
      (ricardo_id, 'pintura'),
      (ricardo_id, 'lavagem_acab'),
      (ricardo_id, 'tratamento')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.clientes IS 'Dados de exemplo: 3 clientes com contatos';
COMMENT ON TABLE public.funcionarios IS 'Dados de exemplo: 5 funcionários com processos específicos';
