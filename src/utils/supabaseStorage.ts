import { supabase } from '@/integrations/supabase/client';
import { FormData, Material, Foto, Calculos } from '@/types/ficha-tecnica';

export interface FichaSalva {
  id: string;
  numeroFTC: string;
  dataCriacao: string;
  dataUltimaEdicao: string;
  status: 'rascunho' | 'finalizada';
  formData: FormData;
  materiais: Material[];
  fotos: { id: number; name: string; size: number; type: string }[];
  calculos: Calculos;
  resumo: {
    cliente: string;
    servico: string;
    quantidade: string;
    valorTotal: number;
  };
}

// Generate UUID
function generateId(): string {
  return 'ficha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Convert database row to FichaSalva format
function convertDbRowToFichaSalva(row: any, materiais: any[], fotos: any[]): FichaSalva {
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
    visita_horas: '',
    tem_peca_amostra: row.peca_amostra || '',
    projeto_desenvolvido_por: row.origem_projeto || '',
    desenho_peca: '',
    desenho_finalizado: row.desenho_finalizado || '',
    transporte_caminhao_hmc: false,
    transporte_pickup_hmc: false,
    transporte_cliente: true,
    
    // Tratamentos e Acabamentos
    pintura: row.pintura || '',
    cor_pintura: '',
    galvanizacao: row.galvanizacao || '',
    peso_peca_galv: '',
    tratamento_termico: row.tratamento_termico || '',
    peso_peca_trat: '',
    tempera_reven: '',
    cementacao: '',
    dureza: row.dureza || '',
    teste_lp: row.ensaio_lp || '',
    balanceamento_campo: '',
    rotacao: '',
    fornecimento_desenho: '',
    fotos_relatorio: '',
    relatorio_tecnico: '',
    emissao_art: '',
    servicos_terceirizados: '',
    
    // Horas de Serviço
    horas_por_peca: '',
    horas_todas_pecas: '',
    torno_grande: row.horas_torno?.toString() || '',
    torno_pequeno: '',
    cnc_tf: '',
    fresa_furad: row.horas_fresa?.toString() || '',
    plasma_oxicorte: '',
    dobra: '',
    calandra: '',
    macarico_solda: row.horas_solda?.toString() || '',
    des_montg: row.horas_montagem?.toString() || '',
    balanceamento: '',
    mandrilhamento: '',
    tratamento: '',
    pintura_horas: row.horas_pintura?.toString() || '',
    lavagem_acab: '',
    programacao_cam: '',
    eng_tec: '',
    
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

  const fotosMetadata = fotos.map(foto => ({
    id: parseInt(foto.id),
    name: foto.name,
    size: foto.size,
    type: foto.type
  }));

  return {
    id: row.id,
    numeroFTC: row.numero_ftc,
    dataCriacao: row.data_criacao,
    dataUltimaEdicao: row.data_ultima_edicao,
    status: row.status,
    formData,
    materiais,
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
    const { data: fichas, error: fichasError } = await supabase
      .from('fichas_tecnicas')
      .select('*')
      .order('data_ultima_edicao', { ascending: false });

    if (fichasError) {
      console.error('Erro ao carregar fichas:', fichasError);
      return [];
    }

    if (!fichas) return [];

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

        return convertDbRowToFichaSalva(ficha, materiais, fotos);
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
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Convert form data to database format
    const dbData = {
      numero_ftc: numeroFTC,
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
      desenho_finalizado: formData.desenho_finalizado,
      transporte: formData.transporte_cliente ? 'CLIENTE' : 'HMC',
      pintura: formData.pintura,
      galvanizacao: formData.galvanizacao,
      tratamento_termico: formData.tratamento_termico,
      dureza: formData.dureza,
      ensaio_lp: formData.teste_lp,
      solda: '',
      usinagem: '',
      horas_torno: parseFloat(formData.torno_grande) || 0,
      horas_fresa: parseFloat(formData.fresa_furad) || 0,
      horas_furadeira: 0,
      horas_solda: parseFloat(formData.macarico_solda) || 0,
      horas_pintura: parseFloat(formData.pintura_horas) || 0,
      horas_montagem: parseFloat(formData.des_montg) || 0,
      horas_outros: 0,
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
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .update(dbData)
        .eq('id', fichaId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar ficha:', error);
        return { success: false, error: 'Erro ao atualizar ficha.' };
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
        console.error('Erro ao criar ficha:', error);
        return { success: false, error: 'Erro ao criar ficha.' };
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
        valor_total: parseFloat(material.valor_total.toString()) || 0
      }));

      const { error: materiaisError } = await supabase
        .from('materiais')
        .insert(materiaisData);

      if (materiaisError) {
        console.error('Erro ao salvar materiais:', materiaisError);
      }
    }

    // Insert fotos metadata
    if (fotos.length > 0) {
      const fotosData = fotos.map(foto => ({
        ficha_id: savedFichaId,
        name: foto.name,
        size: foto.size,
        type: foto.file?.type || 'image/jpeg'
      }));

      const { error: fotosError } = await supabase
        .from('fotos')
        .insert(fotosData);

      if (fotosError) {
        console.error('Erro ao salvar fotos:', fotosError);
      }
    }

    return { success: true, id: savedFichaId };
  } catch (error) {
    console.error('Erro ao salvar ficha:', error);
    return { success: false, error: 'Erro ao salvar ficha.' };
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

    return convertDbRowToFichaSalva(ficha, materiais, fotos);
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

// Validate required fields
export function validarCamposObrigatorios(formData: FormData, materiais: Material[]): string[] {
  const erros: string[] = [];
  
  if (!formData.cliente.trim()) erros.push('Cliente é obrigatório');
  if (!formData.solicitante.trim()) erros.push('Solicitante é obrigatório');
  if (!formData.nome_peca.trim()) erros.push('Nome da Peça é obrigatório');
  if (!formData.quantidade.trim()) erros.push('Quantidade é obrigatória');
  if (!formData.servico.trim()) erros.push('Serviço é obrigatório');
  
  // Validate at least one material with valid data
  const materiaisValidos = materiais.filter(m => 
    m.descricao.trim() && m.quantidade.trim() && m.valor_unitario.toString().trim()
  );
  
  if (materiaisValidos.length === 0) {
    erros.push('Pelo menos um material com dados completos é obrigatório');
  }
  
  return erros;
}

// Check storage quota (not needed for Supabase, but keeping for compatibility)
export function checkStorageQuota(): { available: boolean; usage: number } {
  return { available: true, usage: 0 };
}
