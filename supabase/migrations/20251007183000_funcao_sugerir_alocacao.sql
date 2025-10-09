-- Migration: Função de Auto-Alocação de Processos
-- Sugere funcionários para cada processo baseado em habilidades e carga de trabalho
-- Capacidade mensal: 165h (7.5h/dia × 22 dias úteis)

-- ============================================================
-- FUNÇÃO AUXILIAR: Calcular carga atual do funcionário
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_carga_funcionario(p_funcionario_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_horas NUMERIC;
BEGIN
  -- Somar todas as horas previstas dos processos alocados para este funcionário
  -- que ainda não foram concluídos (status != 'concluido')
  SELECT COALESCE(SUM(po.horas_previstas), 0)
  INTO v_total_horas
  FROM processos_os po
  WHERE po.funcionario_id = p_funcionario_id
    AND po.status != 'concluido';

  RETURN v_total_horas;
END;
$$;

COMMENT ON FUNCTION calcular_carga_funcionario IS
'Calcula a carga atual de trabalho de um funcionário (soma de horas previstas em processos não concluídos)';

-- ============================================================
-- FUNÇÃO PRINCIPAL: Sugerir Alocação de Processos
-- ============================================================
CREATE OR REPLACE FUNCTION sugerir_alocacao_processos(p_os_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_ficha_id UUID;
  v_processos JSONB := '[]'::JSONB;
  v_processo_info JSONB;
  v_processo_nome TEXT;
  v_horas_previstas NUMERIC;
  v_funcionarios_aptos JSONB;
  v_melhor_funcionario JSONB;
  v_funcionario RECORD;
  v_carga NUMERIC;
  v_carga_percentual NUMERIC;
  v_menor_carga NUMERIC := 999999;
  v_capacidade_mensal CONSTANT NUMERIC := 165; -- 7.5h/dia × 22 dias
BEGIN
  -- Buscar ficha_id da OS
  SELECT ficha_id INTO v_ficha_id
  FROM ordens_servico
  WHERE id = p_os_id;

  IF v_ficha_id IS NULL THEN
    RAISE EXCEPTION 'OS não encontrada ou sem ficha vinculada';
  END IF;

  -- Array de todos os 24 processos possíveis
  FOR v_processo_nome IN
    SELECT unnest(ARRAY[
      'torno_grande', 'torno_pequeno', 'torno_cnc', 'centro_usinagem', 'fresa', 'furadeira',
      'plasma_oxicorte', 'macarico', 'solda', 'serra', 'dobra', 'calandra', 'caldeiraria',
      'des_montg', 'montagem', 'balanceamento', 'mandrilhamento', 'tratamento',
      'lavagem', 'acabamento', 'pintura_horas', 'programacao_cam', 'eng_tec', 'tecnico_horas'
    ])
  LOOP
    -- Buscar horas previstas para este processo na ficha técnica
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM fichas_tecnicas WHERE id = $1',
      v_processo_nome
    ) INTO v_horas_previstas USING v_ficha_id;

    -- Apenas processar se tiver horas > 0
    IF v_horas_previstas > 0 THEN
      v_funcionarios_aptos := '[]'::JSONB;
      v_melhor_funcionario := NULL;
      v_menor_carga := 999999;

      -- Buscar funcionários que dominam este processo
      FOR v_funcionario IN
        SELECT
          f.id,
          f.nome,
          f.ativo
        FROM funcionarios f
        INNER JOIN funcionario_processos fp ON fp.funcionario_id = f.id
        WHERE fp.processo = v_processo_nome
          AND f.ativo = true
        ORDER BY f.nome
      LOOP
        -- Calcular carga atual do funcionário
        v_carga := calcular_carga_funcionario(v_funcionario.id);
        v_carga_percentual := ROUND((v_carga / v_capacidade_mensal) * 100, 2);

        -- Adicionar à lista de funcionários aptos
        v_funcionarios_aptos := v_funcionarios_aptos || jsonb_build_object(
          'id', v_funcionario.id,
          'nome', v_funcionario.nome,
          'carga_horas', v_carga,
          'carga_percentual', v_carga_percentual
        );

        -- Se for o menos ocupado até agora, marcar como melhor opção
        IF v_carga < v_menor_carga THEN
          v_menor_carga := v_carga;
          v_melhor_funcionario := jsonb_build_object(
            'id', v_funcionario.id,
            'nome', v_funcionario.nome,
            'carga_horas', v_carga,
            'carga_percentual', v_carga_percentual
          );
        END IF;
      END LOOP;

      -- Montar objeto do processo
      v_processo_info := jsonb_build_object(
        'processo', v_processo_nome,
        'horas_previstas', v_horas_previstas,
        'funcionario_sugerido', v_melhor_funcionario,
        'funcionarios_disponiveis', v_funcionarios_aptos
      );

      -- Adicionar ao array de processos
      v_processos := v_processos || v_processo_info;
    END IF;
  END LOOP;

  RETURN v_processos;
END;
$$;

COMMENT ON FUNCTION sugerir_alocacao_processos IS
'Retorna sugestões de alocação de funcionários para cada processo de uma OS.
Leva em conta habilidades (funcionario_processos) e carga de trabalho atual.
Capacidade mensal: 165h (7.5h/dia × 22 dias).';

-- ============================================================
-- EXEMPLOS DE USO:
-- ============================================================
-- SELECT sugerir_alocacao_processos('uuid-da-os-aqui');
--
-- Retorno esperado (JSON):
-- [
--   {
--     "processo": "torno_cnc",
--     "horas_previstas": 12,
--     "funcionario_sugerido": {
--       "id": "uuid",
--       "nome": "João Silva",
--       "carga_horas": 75,
--       "carga_percentual": 45.45
--     },
--     "funcionarios_disponiveis": [
--       {
--         "id": "uuid",
--         "nome": "João Silva",
--         "carga_horas": 75,
--         "carga_percentual": 45.45
--       },
--       {
--         "id": "uuid2",
--         "nome": "Maria Santos",
--         "carga_horas": 120,
--         "carga_percentual": 72.73
--       }
--     ]
--   }
-- ]
