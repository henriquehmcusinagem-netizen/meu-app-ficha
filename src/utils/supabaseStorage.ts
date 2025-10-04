import { supabase } from '@/integrations/supabase/client';
import { FormData, Material, Foto, Calculos, FichaSalva } from '@/types/ficha-tecnica';
import { mapInterfaceStatusToDatabase, mapDatabaseStatusToInterface, getPreviousStatus } from './statusMapping';
import { logger } from './logger';

// Função wrapper para manter compatibilidade e logs
function mapStatusToDatabase(status: string): string {
  const mappedStatus = mapInterfaceStatusToDatabase(status as any);
  return mappedStatus;
}

// Generate UUID
function generateId(): string {
  return 'ficha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Convert database row to FichaSalva format
async function convertDbRowToFichaSalva(row: any, materiais: any[], fotos: any[], fotosCount?: number): Promise<FichaSalva> {
  const formData: FormData = {
    // Dados do Cliente
    cliente: row.cliente || '',
    solicitante: row.solicitante || '',
    fone_email: row.contato || '',
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
    solda: row.solda?.toString() || '',
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
    status: mapDatabaseStatusToInterface(row.status),
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

// Load photos for a specific ficha on-demand
export async function carregarFotosFicha(fichaId: string): Promise<Foto[]> {
  try {
    const { data: fotos, error } = await supabase
      .from('fotos')
      .select('*')
      .eq('ficha_id', fichaId)
      .order('id');

    if (error) {
      logger.error('Erro ao carregar fotos da ficha', { fichaId, error });
      return [];
    }

    // Convert fotos from database format with lazy loading capability
    const fotosMetadata: Foto[] = fotos.map((foto, index) => ({
      id: index + 1,
      name: foto.name,
      size: foto.size,
      file: undefined, // No file for saved photos
      preview: undefined, // Will be loaded lazily when needed
      storagePath: foto.storage_path // Keep storage path for lazy loading
    }));

    logger.database('SELECT', 'fotos', { fichaId, count: fotos.length });
    return fotosMetadata;
  } catch (error) {
    logger.error('Erro ao carregar fotos da ficha', { fichaId, error });
    return [];
  }
}

// Get all saved fichas
export async function carregarFichasSalvas(): Promise<FichaSalva[]> {
  try {
    
    const { data: fichas, error: fichasError } = await supabase
      .from('fichas_tecnicas')
      .select('*')
      .order('data_ultima_edicao', { ascending: false });

    if (fichasError) {
      logger.error('Erro ao carregar fichas', fichasError);
      return [];
    }

    if (!fichas) {
      return [];
    }


    // Load related data for each ficha - OTIMIZADO: não carrega fotos
    const fichasCompletas = await Promise.all(
      fichas.map(async (ficha) => {
        const [materiaisResult, fotosCountResult] = await Promise.all([
          supabase
            .from('materiais')
            .select('*')
            .eq('ficha_id', ficha.id)
            .order('ordem'),
          supabase
            .from('fotos')
            .select('*', { count: 'exact', head: true })
            .eq('ficha_id', ficha.id)
        ]);

        const materiais = materiaisResult.data || [];
        const fotosCount = fotosCountResult.count || 0;

        return await convertDbRowToFichaSalva(ficha, materiais, [], fotosCount);
      })
    );

    return fichasCompletas;
  } catch (error) {
    logger.error('Erro ao carregar fichas salvas', error);
    return [];
  }
}

// Save a ficha
export async function salvarFicha(
  formData: FormData,
  materiais: Material[],
  fotos: Foto[],
  calculos: Calculos,
  numeroFTC: string,
  fichaId?: string,
  status?: string
): Promise<{ success: boolean; id?: string; error?: string; numeroFTC?: string }> {
  try {
    // Generate FTC number only for truly new fichas (no fichaId)
    // For existing fichas (with fichaId), only generate new number if it's still a draft
    let finalNumeroFTC = numeroFTC;
    if (!fichaId) {
      const { data, error } = await supabase
        .rpc('get_next_ftc_number');

      if (error) {
        logger.error('Erro ao gerar número FTC', error);
        return { success: false, error: 'Erro ao gerar número FTC.' };
      }

      if (data) {
        finalNumeroFTC = data;
      }
    } else if (fichaId && numeroFTC.startsWith('DRAFT')) {
      const { data, error } = await supabase
        .rpc('get_next_ftc_number');

      if (error) {
        logger.error('Erro ao gerar número FTC', error);
        return { success: false, error: 'Erro ao gerar número FTC.' };
      }

      if (data) {
        finalNumeroFTC = data;
      }
    } else {
    }

    // Convert form data to database format - include ALL new fields
    const rawStatus = status || (formData.desenho_finalizado === 'SIM' ? 'finalizada' : 'rascunho');
    const mappedStatus = mapStatusToDatabase(rawStatus);

    // Log das horas de produção

    const dbData = {
      numero_ftc: finalNumeroFTC,
      status: mappedStatus,
      cliente: formData.cliente,
      solicitante: formData.solicitante,
      contato: formData.fone_email,
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
      peso_peca_galv: formData.peso_peca_galv,
      tratamento_termico: formData.tratamento_termico,
      tempera_reven: formData.tempera_reven,
      dureza: formData.dureza,
      ensaio_lp: formData.teste_lp,

      // 🆕 NOVOS CAMPOS EXTRAS
      balanceamento_campo: formData.balanceamento_campo || 'NAO',
      rotacao: formData.rotacao || null,
      observacoes_adicionais: formData.observacoes_adicionais || null,
      prioridade: formData.prioridade || 'Normal',

      // ⚡ SERVIÇOS ESPECIAIS
      fornecimento_desenho: formData.fornecimento_desenho || 'NAO',
      fotos_relatorio: formData.fotos_relatorio || 'NAO',
      relatorio_tecnico: formData.relatorio_tecnico || 'NAO',
      emissao_art: formData.emissao_art || 'NAO',

      solda: '',
      usinagem: '',
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

      // 🆕 NOVOS CAMPOS - Horas de Produção
      torno_cnc: parseFloat(formData.torno_cnc) || 0,
      centro_usinagem: parseFloat(formData.centro_usinagem) || 0,
      fresa: parseFloat(formData.fresa) || 0,
      furadeira: parseFloat(formData.furadeira) || 0,
      macarico: parseFloat(formData.macarico) || 0,
      solda: parseFloat(formData.solda) || 0,
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
      horas_solda: parseFloat(formData.macarico_solda) || 0,
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

    let savedFichaId: string;

    if (fichaId) {
      // Update existing ficha
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .update(dbData)
        .eq('id', fichaId)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao atualizar ficha', error);
        return { success: false, error: `Erro ao atualizar ficha: ${error.message}` };
      }

      savedFichaId = fichaId;
    } else {
      // Create new ficha
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao criar ficha', { error, dbData });
        return { success: false, error: `Erro ao criar ficha: ${error.message}` };
      }

      savedFichaId = data.id;
    }

    // Delete existing materials and fotos for this ficha
    await Promise.all([
      supabase.from('materiais').delete().eq('ficha_id', savedFichaId),
      supabase.from('fotos').delete().eq('ficha_id', savedFichaId)
    ]);

    // Insert materials
    if (materiais.length > 0) {

      const materiaisData = materiais.map((material, index) => ({
        ficha_id: savedFichaId,
        ordem: index + 1,
        descricao: material.descricao,
        quantidade: material.quantidade,
        unidade: material.unidade,
        valor_unitario: parseFloat(material.valor_unitario.toString()) || 0,
        fornecedor: material.fornecedor,
        cliente_interno: material.cliente_interno,
        // cliente_interno_tipo: material.cliente_interno_tipo, // Temporariamente removido até migration ser aplicada
        valor_total: parseFloat(material.valor_total.toString()) || 0
      }));


      const { error: materiaisError } = await supabase
        .from('materiais')
        .insert(materiaisData);

      if (materiaisError) {
        logger.error('Erro ao salvar materiais', { error: materiaisError, data: materiaisData });
      } else {
      }
    }

    // Upload real photos to Supabase Storage and save metadata
    if (fotos.length > 0) {
      
      const fotosData = await Promise.all(
        fotos.map(async (foto, index) => {
          
          let storagePath = null;
          
          if (foto.file) {
            // Upload new photo to Supabase Storage
            // Sanitize filename
            const sanitizedName = foto.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${savedFichaId}/${Date.now()}_${index}_${sanitizedName}`;
            
            try {
              // Check if file is valid
              if (!foto.file.type.startsWith('image/')) {
                logger.warn('Arquivo não é uma imagem', { fileName: foto.name, fileType: foto.file.type });
                throw new Error('Tipo de arquivo inválido');
              }
              
              if (foto.file.size > 5 * 1024 * 1024) { // 5MB limit
                logger.warn('Arquivo muito grande', { fileName: foto.name, fileSize: foto.file.size });
                throw new Error('Arquivo muito grande');
              }
              
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('ficha-fotos')
                .upload(fileName, foto.file, {
                  cacheControl: '3600',
                  upsert: false
                });
                
              if (uploadError) {
                logger.error('Erro no upload da foto', { fileName: foto.name, error: uploadError });
                // Don't save photo metadata if upload failed
              } else if (uploadData?.path) {
                storagePath = uploadData.path;
              } else {
                logger.error('Upload retornou dados inválidos', { fileName: foto.name, uploadData });
              }
            } catch (uploadException) {
              logger.error('Exceção durante upload', { fileName: foto.name, error: uploadException });
            }
          } else if (foto.storagePath) {
            // Keep existing storage path for saved photos
            storagePath = foto.storagePath;
          } else {
            logger.warn('Foto sem file nem storagePath', { fileName: foto.name });
          }
          
          const fotoData = {
            ficha_id: savedFichaId,
            name: foto.name,
            size: foto.size,
            type: foto.file?.type || 'image/jpeg',
            storage_path: storagePath
          };
          
          return fotoData;
        })
      );

      
      try {
        const { error: fotosError } = await supabase
          .from('fotos')
          .insert(fotosData);

        if (fotosError) {
          logger.error('Erro ao salvar metadados das fotos', { error: fotosError, data: fotosData });
        } else {
        }
      } catch (insertException) {
        logger.error('Exceção ao inserir metadados das fotos', insertException);
      }
    }

    return { success: true, id: savedFichaId, numeroFTC: finalNumeroFTC };
  } catch (error) {
    logger.error('Erro crítico ao salvar ficha', error);
    return { success: false, error: `Erro ao salvar ficha: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
  }
}

// Load a specific ficha
export async function carregarFicha(id: string): Promise<FichaSalva | null> {
  try {
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_tecnicas')
      .select('*')
      .eq('id', id)
      .single();

    if (fichaError || !ficha) {
      logger.error('Erro ao carregar ficha', fichaError);
      return null;
    }

    const [materiaisResult, fotosResult] = await Promise.all([
      supabase
        .from('materiais')
        .select('*')
        .eq('ficha_id', id)
        .order('ordem'),
      supabase
        .from('fotos')
        .select('*')
        .eq('ficha_id', id)
    ]);

    const materiais = materiaisResult.data || [];
    const fotos = fotosResult.data || [];

    return await convertDbRowToFichaSalva(ficha, materiais, fotos);
  } catch (error) {
    logger.error('Erro ao carregar ficha', error);
    return null;
  }
}

// Delete a ficha
export async function excluirFicha(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('fichas_tecnicas')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Erro ao excluir ficha', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Erro ao excluir ficha', error);
    return false;
  }
}

// Validate required fields for production use
export function validarCamposObrigatorios(formData: FormData, materiais: Material[]): string[] {
  const erros: string[] = [];

  // Validate basic client information
  if (!formData.cliente?.trim()) {
    erros.push('Cliente é obrigatório');
  }

  if (!formData.solicitante?.trim()) {
    erros.push('Solicitante é obrigatório');
  }

  if (!formData.fone_email?.trim()) {
    erros.push('Contato é obrigatório');
  }

  // Validate piece/service information
  if (!formData.nome_peca?.trim()) {
    erros.push('Nome da Peça/Equipamento é obrigatório');
  }

  if (!formData.quantidade?.trim() || parseFloat(formData.quantidade) <= 0) {
    erros.push('Quantidade deve ser maior que zero');
  }

  if (!formData.servico?.trim()) {
    erros.push('Tipo de Serviço é obrigatório');
  }

  // Validate at least one service hour is filled
  const horasServico = [
    formData.torno_grande, formData.torno_pequeno, formData.cnc_tf,
    formData.fresa_furad, formData.plasma_oxicorte, formData.dobra,
    formData.calandra, formData.macarico_solda, formData.des_montg,
    formData.balanceamento, formData.mandrilhamento, formData.tratamento,
    formData.pintura_horas, formData.lavagem_acab, formData.programacao_cam,
    formData.eng_tec
  ];

  const temHorasServico = horasServico.some(hora =>
    hora && parseFloat(String(hora)) > 0
  );

  if (!temHorasServico) {
    erros.push('Pelo menos um campo de horas de serviço deve ser preenchido');
  }

  // Validate materials if present
  if (materiais.length > 0) {
    materiais.forEach((material, index) => {
      if (material.descricao?.trim() && (!material.quantidade?.trim() || parseFloat(material.quantidade) <= 0)) {
        erros.push(`Material ${index + 1}: Quantidade é obrigatória quando descrição está preenchida`);
      }

      // Removido: validação obrigatória de valor_unitario
      // O fluxo correto é: Técnico cadastra descrição/quantidade → Compras adiciona preços
      // Valor unitário não deve ser obrigatório para permitir o fluxo normal
    });
  }

  return erros;
}

// Check storage quota (not needed for Supabase, but keeping for compatibility)
export function checkStorageQuota(): { available: boolean; usage: number } {
  return { available: true, usage: 0 };
}

// Revert ficha to previous status
export async function estornarFicha(
  fichaId: string,
  motivo: string
): Promise<{ success: boolean; error?: string; previousStatus?: string }> {
  try {
    logger.info('Iniciando estorno', { fichaId, motivo });

    // Load current ficha
    const ficha = await carregarFicha(fichaId);

    if (!ficha) {
      logger.error('Ficha não encontrada para estorno', { fichaId });
      return { success: false, error: 'Ficha não encontrada' };
    }

    logger.info('Ficha carregada', {
      fichaId,
      numeroFTC: ficha.numeroFTC,
      currentStatus: ficha.status
    });

    // Get previous status
    const previousStatus = getPreviousStatus(ficha.status);

    if (!previousStatus) {
      logger.error('Status não permite estorno', {
        fichaId,
        currentStatus: ficha.status
      });
      return {
        success: false,
        error: 'Esta ficha não pode ser estornada. Status atual: ' + ficha.status
      };
    }

    // Validate motivo
    if (!motivo || motivo.trim().length < 10) {
      logger.error('Motivo inválido', { fichaId, motivoLength: motivo?.length });
      return {
        success: false,
        error: 'O motivo do estorno deve ter no mínimo 10 caracteres'
      };
    }

    // Map to database status
    const dbPreviousStatus = mapInterfaceStatusToDatabase(previousStatus);

    logger.info('Estornando ficha', {
      fichaId,
      numeroFTC: ficha.numeroFTC,
      currentStatus: ficha.status,
      previousStatus,
      dbPreviousStatus,
      motivo
    });

    // Update status in database
    const { data: updateData, error: updateError } = await supabase
      .from('fichas_tecnicas')
      .update({
        status: dbPreviousStatus,
        data_ultima_edicao: new Date().toISOString()
      })
      .eq('id', fichaId)
      .select();

    if (updateError) {
      logger.error('Erro ao atualizar status no banco', {
        fichaId,
        error: updateError,
        errorMessage: updateError.message,
        errorDetails: updateError.details,
        errorHint: updateError.hint
      });
      return {
        success: false,
        error: `Erro ao estornar ficha: ${updateError.message}`
      };
    }

    if (!updateData || updateData.length === 0) {
      logger.error('Nenhuma linha foi atualizada', { fichaId });
      return {
        success: false,
        error: 'Nenhuma ficha foi atualizada. Verifique se a ficha existe.'
      };
    }

    logger.info('Ficha estornada com sucesso', {
      fichaId,
      numeroFTC: ficha.numeroFTC,
      previousStatus,
      updatedRows: updateData.length
    });

    return {
      success: true,
      previousStatus
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Erro crítico ao estornar ficha', {
      fichaId,
      error,
      errorMessage,
      errorStack,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name
    });

    return {
      success: false,
      error: `Erro ao estornar ficha: ${errorMessage}`
    };
  }
}
