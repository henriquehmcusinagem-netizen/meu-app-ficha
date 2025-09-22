import { supabase } from '@/integrations/supabase/client';
import { FormData, Material, Foto, Calculos, FichaSalva } from '@/types/ficha-tecnica';

// Generate UUID
function generateId(): string {
  return 'ficha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Convert database row to FichaSalva format
async function convertDbRowToFichaSalva(row: any, materiais: any[], fotos: any[]): Promise<FichaSalva> {
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
    
    // Material para Cotação
    material_por_peca: '',
    material_todas_pecas: '',
    
    // Execução e Detalhes
    execucao: row.tipo_execucao || '',
    visita_tecnica: row.visita_tecnica || '',
    visita_horas: row.horas_visita?.toString() || '',
    tem_peca_amostra: row.peca_amostra || '',
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
    peso_peca_trat: row.peso_peca_trat || '',
    tempera_reven: row.tempera_reven || '',
    cementacao: row.cementacao || '',
    dureza: row.dureza || '',
    teste_lp: row.ensaio_lp || '',
    balanceamento_campo: row.balanceamento_campo || '',
    rotacao: row.rotacao?.toString() || '',
    fornecimento_desenho: row.fornecimento_desenho || '',
    fotos_relatorio: row.fotos_relatorio || '',
    relatorio_tecnico: row.relatorio_tecnico || '',
    emissao_art: row.emissao_art || '',
    servicos_terceirizados: row.servicos_terceirizados || '',
    
    // Horas de Serviço - usando as novas colunas criadas
    horas_por_peca: '',
    horas_todas_pecas: '',
    torno_grande: row.torno_grande?.toString() || '',
    torno_pequeno: row.torno_pequeno?.toString() || '',
    cnc_tf: row.cnc_tf?.toString() || '',
    fresa_furad: row.fresa_furad?.toString() || '',
    plasma_oxicorte: row.plasma_oxicorte?.toString() || '',
    dobra: row.dobra?.toString() || '',
    calandra: row.calandra?.toString() || '',
    macarico_solda: row.macarico_solda?.toString() || '',
    des_montg: row.des_montg?.toString() || '',
    balanceamento: row.balanceamento?.toString() || '',
    mandrilhamento: row.mandrilhamento?.toString() || '',
    tratamento: row.tratamento?.toString() || '',
    pintura_horas: row.pintura_horas?.toString() || '',
    lavagem_acab: row.lavagem_acab?.toString() || '',
    programacao_cam: row.programacao_cam?.toString() || '',
    eng_tec: row.eng_tec?.toString() || '',
    
    // Controle
    num_orcamento: row.numero_orcamento || '',
    num_os: row.numero_os || '',
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

  console.log(`📋 ${fotosMetadata.length} fotos metadata preparadas (sem carregamento)`);

  // Convert materials from database format to Material interface
  const materiaisConvertidos: Material[] = materiais.map((material, index) => ({
    id: index + 1,
    descricao: material.descricao || '',
    quantidade: material.quantidade || '',
    unidade: material.unidade || 'UN',
    valor_unitario: material.valor_unitario?.toString() || '0',
    fornecedor: material.fornecedor || '',
    cliente_interno: material.cliente_interno || '',
    valor_total: material.valor_total?.toString() || '0'
  }));

  return {
    id: row.id,
    numeroFTC: row.numero_ftc,
    dataCriacao: row.data_criacao,
    dataUltimaEdicao: row.data_ultima_edicao,
    status: row.status,
    formData,
    materiais: materiaisConvertidos,
    fotos: fotosMetadata,
    calculos,
    resumo: {
      cliente: row.cliente,
      servico: row.servico,
      quantidade: row.quantidade,
      valorTotal: row.total_material_todas_pecas || 0
    }
  };
}

// Get all saved fichas
export async function carregarFichasSalvas(): Promise<FichaSalva[]> {
  try {
    console.log('Carregando fichas técnicas do Supabase...');
    
    const { data: fichas, error: fichasError } = await supabase
      .from('fichas_tecnicas')
      .select('*')
      .order('data_ultima_edicao', { ascending: false });

    if (fichasError) {
      console.error('Erro ao carregar fichas:', fichasError);
      return [];
    }

    if (!fichas) {
      console.log('Nenhuma ficha encontrada no banco');
      return [];
    }

    console.log(`${fichas.length} fichas encontradas no banco`);

    // Load related data for each ficha
    const fichasCompletas = await Promise.all(
      fichas.map(async (ficha) => {
        const [materiaisResult, fotosResult] = await Promise.all([
          supabase
            .from('materiais')
            .select('*')
            .eq('ficha_id', ficha.id)
            .order('ordem'),
          supabase
            .from('fotos')
            .select('*')
            .eq('ficha_id', ficha.id)
        ]);

        const materiais = materiaisResult.data || [];
        const fotos = fotosResult.data || [];

        return await convertDbRowToFichaSalva(ficha, materiais, fotos);
      })
    );

    return fichasCompletas;
  } catch (error) {
    console.error('Erro ao carregar fichas salvas:', error);
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
  fichaId?: string
): Promise<{ success: boolean; id?: string; error?: string; numeroFTC?: string }> {
  try {
    console.log('🔄 Iniciando salvamento da ficha...');
    console.log('📋 Dados recebidos:', { 
      cliente: formData.cliente, 
      materiais: materiais.length, 
      fotos: fotos.length,
      fichaId 
    });
    // Generate FTC number if this is a new ficha (no fichaId) or if it's a draft
    let finalNumeroFTC = numeroFTC;
    if (!fichaId || numeroFTC.startsWith('DRAFT')) {
      console.log('🔢 Gerando novo número FTC...');
      const { data, error } = await supabase
        .rpc('get_next_ftc_number');
        
      if (error) {
        console.error('❌ Erro ao gerar número FTC:', error);
        return { success: false, error: 'Erro ao gerar número FTC.' };
      }
      
      if (data) {
        finalNumeroFTC = data;
        console.log('✅ Número FTC gerado:', finalNumeroFTC);
      }
    }

    // Convert form data to database format - include ALL new fields
    const dbData = {
      numero_ftc: finalNumeroFTC,
      status: formData.desenho_finalizado === 'SIM' ? 'finalizada' : 'rascunho',
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
      solda: '',
      usinagem: '',
      // Horas de serviço - usando as novas colunas
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
      // Horas antigas para compatibilidade
      horas_torno: parseFloat(formData.torno_grande) || 0,
      horas_fresa: parseFloat(formData.fresa_furad) || 0,
      horas_furadeira: 0,
      horas_solda: parseFloat(formData.macarico_solda) || 0,
      horas_pintura: parseFloat(formData.pintura_horas) || 0,
      horas_montagem: parseFloat(formData.des_montg) || 0,
      horas_outros: 0,
      // Controle
      numero_orcamento: formData.num_orcamento,
      numero_os: formData.num_os,
      numero_nf: formData.num_nf_remessa,
      total_horas_servico: calculos.horasTodasPecas,
      total_material_peca: calculos.materialPorPeca,
      total_material_todas_pecas: calculos.materialTodasPecas
    };

    let savedFichaId: string;

    if (fichaId) {
      // Update existing ficha
      console.log('🔄 Atualizando ficha existente:', fichaId);
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .update(dbData)
        .eq('id', fichaId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar ficha:', error);
        return { success: false, error: `Erro ao atualizar ficha: ${error.message}` };
      }

      console.log('✅ Ficha atualizada com sucesso');
      savedFichaId = fichaId;
    } else {
      // Create new ficha
      console.log('✨ Criando nova ficha...');
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar ficha:', error);
        console.error('📋 Dados enviados:', dbData);
        return { success: false, error: `Erro ao criar ficha: ${error.message}` };
      }

      console.log('✅ Ficha criada com sucesso:', data.id);
      savedFichaId = data.id;
    }

    // Delete existing materials and fotos for this ficha
    console.log('🗑️ Removendo materiais e fotos existentes...');
    await Promise.all([
      supabase.from('materiais').delete().eq('ficha_id', savedFichaId),
      supabase.from('fotos').delete().eq('ficha_id', savedFichaId)
    ]);

    // Insert materials
    if (materiais.length > 0) {
      console.log(`📦 Inserindo ${materiais.length} materiais...`);
      const materiaisData = materiais.map((material, index) => ({
        ficha_id: savedFichaId,
        ordem: index + 1,
        descricao: material.descricao,
        quantidade: material.quantidade,
        unidade: material.unidade,
        valor_unitario: parseFloat(material.valor_unitario.toString()) || 0,
        fornecedor: material.fornecedor,
        cliente_interno: material.cliente_interno,
        valor_total: parseFloat(material.valor_total.toString()) || 0
      }));

      const { error: materiaisError } = await supabase
        .from('materiais')
        .insert(materiaisData);

      if (materiaisError) {
        console.error('❌ Erro ao salvar materiais:', materiaisError);
      } else {
        console.log('✅ Materiais salvos com sucesso');
      }
    }

    // Upload real photos to Supabase Storage and save metadata
    if (fotos.length > 0) {
      console.log(`📸 Processando ${fotos.length} fotos...`);
      console.log('📸 Fotos recebidas:', fotos.map(f => ({ 
        id: f.id, 
        name: f.name, 
        hasFile: !!f.file, 
        hasStoragePath: !!f.storagePath,
        preview: f.preview?.substring(0, 50) + '...' 
      })));
      
      const fotosData = await Promise.all(
        fotos.map(async (foto, index) => {
          console.log(`📸 Processando foto ${index + 1}/${fotos.length}: ${foto.name}`);
          console.log(`📸 Detalhes da foto:`, { 
            id: foto.id, 
            hasFile: !!foto.file, 
            hasStoragePath: !!foto.storagePath,
            fileType: foto.file?.type,
            fileSize: foto.file?.size 
          });
          
          let storagePath = null;
          
          if (foto.file) {
            // Upload new photo to Supabase Storage
            console.log(`📤 Fazendo upload de nova foto: ${foto.name}`);
            // Sanitize filename
            const sanitizedName = foto.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${savedFichaId}/${Date.now()}_${index}_${sanitizedName}`;
            console.log(`📤 Nome do arquivo no storage: ${fileName}`);
            
            try {
              // Check if file is valid
              if (!foto.file.type.startsWith('image/')) {
                console.error('❌ Arquivo não é uma imagem:', foto.file.type);
                throw new Error('Tipo de arquivo inválido');
              }
              
              if (foto.file.size > 5 * 1024 * 1024) { // 5MB limit
                console.error('❌ Arquivo muito grande:', foto.file.size);
                throw new Error('Arquivo muito grande');
              }
              
              console.log(`📤 Fazendo upload - Size: ${foto.file.size}, Type: ${foto.file.type}`);
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('ficha-fotos')
                .upload(fileName, foto.file, {
                  cacheControl: '3600',
                  upsert: false
                });
                
              if (uploadError) {
                console.error('❌ Erro no upload da foto:', foto.name, uploadError);
                console.error('❌ Detalhes do erro:', uploadError.message);
                // Don't save photo metadata if upload failed
              } else if (uploadData?.path) {
                storagePath = uploadData.path;
                console.log('✅ Upload bem-sucedido:', fileName, 'Path:', storagePath);
              } else {
                console.error('❌ Upload retornou dados inválidos:', uploadData);
              }
            } catch (uploadException) {
              console.error('💥 Exceção durante upload:', foto.name, uploadException);
            }
          } else if (foto.storagePath) {
            // Keep existing storage path for saved photos
            storagePath = foto.storagePath;
            console.log('🔄 Mantendo foto existente:', foto.name, 'Path:', storagePath);
          } else {
            console.warn('⚠️ Foto sem file nem storagePath:', foto.name);
          }
          
          const fotoData = {
            ficha_id: savedFichaId,
            name: foto.name,
            size: foto.size,
            type: foto.file?.type || 'image/jpeg',
            storage_path: storagePath
          };
          
          console.log(`📋 Dados da foto para DB:`, fotoData);
          return fotoData;
        })
      );

      console.log(`💾 Inserindo metadados de ${fotosData.length} fotos no banco...`);
      console.log('💾 Dados para inserção:', fotosData);
      
      try {
        const { error: fotosError } = await supabase
          .from('fotos')
          .insert(fotosData);

        if (fotosError) {
          console.error('❌ Erro ao salvar metadados das fotos:', fotosError);
          console.error('❌ Mensagem do erro:', fotosError.message);
          console.error('❌ Dados que causaram erro:', fotosData);
        } else {
          console.log('✅ Fotos e metadados salvos com sucesso');
        }
      } catch (insertException) {
        console.error('💥 Exceção ao inserir metadados das fotos:', insertException);
      }
    }

    console.log('🎉 Ficha salva com sucesso!', { id: savedFichaId, numeroFTC: finalNumeroFTC });
    return { success: true, id: savedFichaId, numeroFTC: finalNumeroFTC };
  } catch (error) {
    console.error('💥 Erro crítico ao salvar ficha:', error);
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
      console.error('Erro ao carregar ficha:', fichaError);
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
    console.error('Erro ao carregar ficha:', error);
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
      console.error('Erro ao excluir ficha:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao excluir ficha:', error);
    return false;
  }
}

// Validate required fields (validation disabled - allow saving partial forms)
export function validarCamposObrigatorios(formData: FormData, materiais: Material[]): string[] {
  // No validation - users can save partially filled forms
  return [];
}

// Check storage quota (not needed for Supabase, but keeping for compatibility)
export function checkStorageQuota(): { available: boolean; usage: number } {
  return { available: true, usage: 0 };
}
