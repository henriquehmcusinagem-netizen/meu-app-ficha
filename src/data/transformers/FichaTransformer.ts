/**
 * FichaTransformer.ts
 *
 * Responsável por transformações bidirecionais entre:
 * - Formato do banco de dados (Supabase) ↔ Formato da aplicação (FormData)
 *
 * Extraído de supabaseStorage.ts para melhor organização e testabilidade.
 */

import { FormData, Material, Foto, Calculos, FichaSalva, StatusFicha } from '@/types/ficha-tecnica';

/**
 * Converte uma row do banco de dados para o formato FichaSalva da aplicação
 *
 * @param row - Linha da tabela fichas_tecnicas do Supabase
 * @param materiais - Array de materiais do banco
 * @param fotos - Array de fotos do banco
 * @param fotosCount - Contador opcional de fotos (para otimização)
 * @returns Promise<FichaSalva> - Objeto completo da ficha para uso na aplicação
 */
export async function convertDbToFichaSalva(
  row: any,
  materiais: any[],
  fotos: any[],
  fotosCount?: number
): Promise<FichaSalva> {
  const formData: FormData = {
    // Integração com Módulo Cadastros
    cliente_id: row.cliente_id || '',
    contato_id: row.contato_id || '',

    // Dados do Cliente
    cliente: row.cliente || '',
    cnpj: row.cnpj || '',
    cliente_predefinido: '',  // Deprecated - não usado mais
    solicitante: row.solicitante || '',
    telefone: row.telefone || row.contato || '',  // Fallback para fichas antigas
    email: row.email || '',
    fone_email: row.contato || row.telefone || '',  // Compatibilidade - fallback
    data_visita: row.data_visita || '',
    data_entrega: row.data_entrega || '',

    // Dados da Peça/Equipamento
    nome_peca: row.nome_peca || '',
    quantidade: row.quantidade || '',
    servico: row.servico || '',
    transporte: '',
    inspecao: '',
    outros_servicos: '',

    // Material para Cotação
    material_por_peca: '',
    material_todas_pecas: '',

    // Execução e Detalhes
    execucao: row.tipo_execucao || '',
    visita_tecnica: row.visita_tecnica || '',
    visita_horas: row.horas_visita?.toString() || '',
    tem_peca_amostra: row.peca_amostra || '',

    // 🆕 NOVOS CAMPOS - Peças e Amostras
    peca_foi_desmontada: row.peca_foi_desmontada || '',
    peca_condicao: row.peca_condicao || 'NOVA',
    precisa_peca_teste: row.precisa_peca_teste || '',
    responsavel_tecnico: row.responsavel_tecnico || '',

    projeto_desenvolvido_por: row.origem_projeto || '',
    desenho_peca: row.desenho || '',
    desenho_finalizado: row.desenho_finalizado || '',
    transporte_caminhao_hmc: row.transporte === 'HMC' || row.transporte === 'CAMINHAO_HMC',
    transporte_pickup_hmc: row.transporte === 'PICKUP_HMC',
    transporte_cliente: row.transporte === 'CLIENTE' || !row.transporte,

    // Tratamentos e Acabamentos
    pintura: row.pintura || '',
    cor_pintura: row.cor_pintura || '',
    galvanizacao: row.galvanizacao || '',
    peso_peca_galv: row.peso_peca_galv || '',
    tratamento_termico: row.tratamento_termico || '',
    peso_peca_trat: '', // Campo não existe no banco - valor padrão
    tempera_reven: row.tempera_reven || '',
    cementacao: '', // Campo não existe no banco - valor padrão
    dureza: row.dureza || '',
    teste_lp: row.ensaio_lp || '',
    balanceamento_campo: row.balanceamento_campo || 'NAO',
    rotacao: row.rotacao || '',
    fornecimento_desenho: row.fornecimento_desenho || 'NAO',
    fotos_relatorio: row.fotos_relatorio || 'NAO',
    relatorio_tecnico: row.relatorio_tecnico || 'NAO',
    emissao_art: row.emissao_art || 'NAO',
    servicos_terceirizados: '', // Campo não existe no banco - valor padrão

    // 🆕 NOVOS CAMPOS EXTRAS
    observacoes_adicionais: row.observacoes_adicionais || '',
    prioridade: row.prioridade || 'Normal',
    dados_orcamento: row.dados_orcamento || '',

    // Horas de Serviço - CAMPOS ANTIGOS (manter por compatibilidade)
    horas_por_peca: '',
    horas_todas_pecas: '',
    torno_grande: row.torno_grande?.toString() || '',
    torno_pequeno: row.torno_pequeno?.toString() || '',
    cnc_tf: row.cnc_tf?.toString() || '', // DEPRECATED - usar torno_cnc
    fresa_furad: row.fresa_furad?.toString() || '', // DEPRECATED - usar fresa + furadeira
    plasma_oxicorte: row.plasma_oxicorte?.toString() || '',
    dobra: row.dobra?.toString() || '',
    calandra: row.calandra?.toString() || '',
    macarico_solda: row.macarico_solda?.toString() || '', // DEPRECATED - usar macarico + solda
    des_montg: row.des_montg?.toString() || '', // Mantido para DESMONTAGEM
    balanceamento: row.balanceamento?.toString() || '',
    mandrilhamento: row.mandrilhamento?.toString() || '',
    tratamento: row.tratamento?.toString() || '',
    pintura_horas: row.pintura_horas?.toString() || '',
    lavagem_acab: row.lavagem_acab?.toString() || '', // DEPRECATED - usar lavagem + acabamento
    programacao_cam: row.programacao_cam?.toString() || '',
    eng_tec: row.eng_tec?.toString() || '',

    // 🆕 NOVOS CAMPOS - Horas de Produção (com fallback para campos antigos)
    torno_cnc: row.torno_cnc?.toString() || row.cnc_tf?.toString() || '',
    centro_usinagem: row.centro_usinagem?.toString() || '',
    fresa: row.fresa?.toString() || '',
    furadeira: row.furadeira?.toString() || '',
    macarico: row.macarico?.toString() || '',
    solda: row.solda?.toString() || '',  // TEXT field (SIM/NAO flag)
    horas_solda: row.horas_solda?.toString() || '',  // NUMERIC field (horas de solda)
    serra: row.serra?.toString() || '',
    caldeiraria: row.caldeiraria?.toString() || '',
    montagem: row.montagem?.toString() || '',
    lavagem: row.lavagem?.toString() || '',
    acabamento: row.acabamento?.toString() || '',
    tecnico_horas: row.tecnico_horas?.toString() || '',

    // Controle
    num_orcamento: row.numero_orcamento || '',
    num_os: row.numero_os || '',
    num_desenho: row.numero_desenho || '',
    num_nf_remessa: row.numero_nf || ''
  };

  const calculos: Calculos = {
    horasPorPeca: 0,
    horasTodasPecas: row.total_horas_servico || 0,
    materialPorPeca: row.total_material_peca || 0,
    materialTodasPecas: row.total_material_todas_pecas || 0
  };

  // Convert fotos from database format - NO auto-loading for performance
  const fotosMetadata: Foto[] = fotos.map((foto, index) => ({
    id: index + 1,
    name: foto.name,
    size: foto.size,
    file: undefined, // No file for saved photos
    preview: undefined, // Will be loaded lazily when needed
    storagePath: foto.storage_path // Keep storage path for lazy loading
  }));

  // Convert materials from database format to Material interface
  const materiaisConvertidos: Material[] = materiais.map((material, index) => ({
    id: index + 1,
    descricao: material.descricao || '',
    quantidade: material.quantidade || '',
    unidade: material.unidade || 'UN',
    valor_unitario: material.valor_unitario?.toString() || '0',
    fornecedor: material.fornecedor || '',
    cliente_interno: material.cliente_interno || '',
    cliente_interno_tipo: '', // Temporariamente vazio até migration ser aplicada
    valor_total: material.valor_total?.toString() || '0'
  }));

  return {
    id: row.id,
    numeroFTC: row.numero_ftc,
    dataCriacao: row.data_criacao,
    dataUltimaEdicao: row.data_ultima_edicao,
    status: row.status as StatusFicha, // Status já está correto no banco após migration
    formData,
    materiais: materiaisConvertidos,
    fotos: fotosMetadata,
    fotosCount: fotosCount !== undefined ? fotosCount : fotosMetadata.length,
    calculos,
    resumo: {
      cliente: row.cliente,
      servico: row.servico,
      quantidade: row.quantidade,
      valorTotal: row.total_material_todas_pecas || 0
    }
  };
}

/**
 * Converte FormData da aplicação para formato do banco de dados
 *
 * @param formData - Dados do formulário da ficha
 * @param calculos - Totalizadores calculados
 * @param numeroFTC - Número da FTC
 * @param status - Status da ficha (opcional, padrão: 'rascunho')
 * @returns Objeto formatado para inserção/atualização no Supabase
 */
export function convertFormDataToDb(
  formData: FormData,
  calculos: Calculos,
  numeroFTC: string,
  status?: string
): any {
  const finalStatus = status || 'rascunho';

  // Helper function to parse numeric fields, converting empty strings and "NAO" to null
  const parseNumericField = (value: string | undefined): number | null => {
    if (!value || value.trim() === '' || value.toUpperCase() === 'NAO') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  return {
    numero_ftc: numeroFTC,
    status: finalStatus as StatusFicha,
    // Integração com Módulo Cadastros
    cliente_id: formData.cliente_id || null,
    contato_id: formData.contato_id || null,
    // Dados "congelados" (snapshot)
    cliente: formData.cliente,
    cnpj: formData.cnpj || null,
    solicitante: formData.solicitante,
    telefone: formData.telefone || null,
    email: formData.email || null,
    contato: formData.telefone || formData.fone_email || null,  // Compatibilidade - fallback
    data_visita: formData.data_visita,
    data_entrega: formData.data_entrega,
    nome_peca: formData.nome_peca,
    quantidade: formData.quantidade,
    servico: formData.servico,
    tipo_execucao: formData.execucao,
    visita_tecnica: formData.visita_tecnica,
    peca_amostra: formData.tem_peca_amostra,

    // 🆕 NOVOS CAMPOS - Peças e Amostras
    peca_foi_desmontada: formData.peca_foi_desmontada || null,
    peca_condicao: formData.peca_condicao || 'NOVA',
    precisa_peca_teste: formData.precisa_peca_teste || null,
    responsavel_tecnico: formData.responsavel_tecnico || null,

    origem_projeto: formData.projeto_desenvolvido_por,
    desenho: formData.desenho_peca,
    desenho_finalizado: formData.desenho_finalizado,
    transporte: formData.transporte_cliente ? 'CLIENTE' :
                formData.transporte_caminhao_hmc ? 'HMC' :
                formData.transporte_pickup_hmc ? 'PICKUP_HMC' : 'CLIENTE',
    pintura: formData.pintura,
    cor_pintura: formData.cor_pintura,
    galvanizacao: formData.galvanizacao,
    // FIX: Parse numeric fields properly, converting "NAO" to null
    peso_peca_galv: parseNumericField(formData.peso_peca_galv),
    tratamento_termico: formData.tratamento_termico,
    tempera_reven: parseNumericField(formData.tempera_reven),
    dureza: parseNumericField(formData.dureza),
    ensaio_lp: formData.teste_lp,

    // 🆕 NOVOS CAMPOS EXTRAS
    balanceamento_campo: formData.balanceamento_campo || 'NAO',
    rotacao: parseNumericField(formData.rotacao),
    observacoes_adicionais: formData.observacoes_adicionais || null,
    dados_orcamento: formData.dados_orcamento || null,
    numero_orcamento: formData.num_orcamento || null,
    prioridade: formData.prioridade || 'Normal',

    // ⚡ SERVIÇOS ESPECIAIS
    fornecimento_desenho: formData.fornecimento_desenho || 'NAO',
    fotos_relatorio: formData.fotos_relatorio || 'NAO',
    relatorio_tecnico: formData.relatorio_tecnico || 'NAO',
    emissao_art: formData.emissao_art || 'NAO',

    // Campos de controle SIM/NAO (TEXT)
    usinagem: formData.usinagem_controle || 'NAO',  // Campo TEXT de controle

    // Horas de serviço - CAMPOS ANTIGOS (manter por compatibilidade)
    torno_grande: parseFloat(formData.torno_grande) || 0,
    torno_pequeno: parseFloat(formData.torno_pequeno) || 0,
    cnc_tf: parseFloat(formData.cnc_tf) || 0,
    fresa_furad: parseFloat(formData.fresa_furad) || 0,
    plasma_oxicorte: parseFloat(formData.plasma_oxicorte) || 0,
    dobra: parseFloat(formData.dobra) || 0,
    calandra: parseFloat(formData.calandra) || 0,
    macarico_solda: parseFloat(formData.macarico_solda) || 0,
    des_montg: parseFloat(formData.des_montg) || 0,
    balanceamento: parseFloat(formData.balanceamento) || 0,
    mandrilhamento: parseFloat(formData.mandrilhamento) || 0,
    tratamento: parseFloat(formData.tratamento) || 0,
    pintura_horas: parseFloat(formData.pintura_horas) || 0,
    lavagem_acab: parseFloat(formData.lavagem_acab) || 0,
    programacao_cam: parseFloat(formData.programacao_cam) || 0,
    eng_tec: parseFloat(formData.eng_tec) || 0,

    // 🆕 NOVOS CAMPOS - Horas de Produção (NUMERIC)
    torno_cnc: parseFloat(formData.torno_cnc) || 0,
    centro_usinagem: parseFloat(formData.centro_usinagem) || 0,
    fresa: parseFloat(formData.fresa) || 0,
    furadeira: parseFloat(formData.furadeira) || 0,
    macarico: parseFloat(formData.macarico) || 0,
    solda: parseFloat(formData.solda) || 0,  // Campo NUMERIC para horas de solda
    serra: parseFloat(formData.serra) || 0,
    caldeiraria: parseFloat(formData.caldeiraria) || 0,
    montagem: parseFloat(formData.montagem) || 0,
    lavagem: parseFloat(formData.lavagem) || 0,
    acabamento: parseFloat(formData.acabamento) || 0,
    tecnico_horas: parseFloat(formData.tecnico_horas) || 0,

    // Horas antigas para compatibilidade
    horas_torno: parseFloat(formData.torno_grande) || 0,
    horas_fresa: parseFloat(formData.fresa_furad) || 0,
    horas_furadeira: 0,
    horas_solda: parseFloat(formData.horas_solda) || 0,  // FIXED: usar horas_solda ao invés de macarico_solda
    horas_pintura: parseFloat(formData.pintura_horas) || 0,
    horas_montagem: parseFloat(formData.des_montg) || 0,
    horas_outros: 0,
    // Controle
    numero_orcamento: formData.num_orcamento || null,
    numero_os: formData.num_os || null,
    numero_desenho: formData.num_desenho || null,
    numero_nf: formData.num_nf_remessa || null,
    total_horas_servico: calculos.horasTodasPecas,
    total_material_peca: calculos.materialPorPeca,
    total_material_todas_pecas: calculos.materialTodasPecas
  };
}
