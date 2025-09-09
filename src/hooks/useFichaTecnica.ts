import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FormData, Material, Foto, Calculos, FichaSalva } from '@/types/ficha-tecnica';
import { calculateTotals } from '@/utils/calculations';
import { getCurrentDate } from '@/utils/helpers';
import { 
  salvarFicha, 
  carregarFicha, 
  validarCamposObrigatorios 
} from '@/utils/supabaseStorage';

const initialFormData: FormData = {
  // Dados do Cliente
  cliente: "",
  solicitante: "",
  fone_email: "",
  data_visita: "",
  data_entrega: "",
  
  // Dados da Peça/Equipamento  
  nome_peca: "",
  quantidade: "1",
  servico: "",
  
  // Material para Cotação
  material_por_peca: "",
  material_todas_pecas: "",
  
  // Execução e Detalhes
  execucao: "",
  visita_tecnica: "",
  visita_horas: "",
  tem_peca_amostra: "",
  projeto_desenvolvido_por: "",
  desenho_peca: "",
  desenho_finalizado: "",
  transporte_caminhao_hmc: false,
  transporte_pickup_hmc: false,
  transporte_cliente: false,
  
  // Tratamentos e Acabamentos
  pintura: "",
  cor_pintura: "",
  galvanizacao: "",
  peso_peca_galv: "",
  tratamento_termico: "",
  peso_peca_trat: "",
  tempera_reven: "",
  cementacao: "",
  dureza: "",
  teste_lp: "",
  balanceamento_campo: "",
  rotacao: "",
  fornecimento_desenho: "",
  fotos_relatorio: "",
  relatorio_tecnico: "",
  emissao_art: "",
  servicos_terceirizados: "",
  
  // Horas de Serviço
  horas_por_peca: "",
  horas_todas_pecas: "",
  torno_grande: "",
  torno_pequeno: "",
  cnc_tf: "",
  fresa_furad: "",
  plasma_oxicorte: "",
  dobra: "",
  calandra: "",
  macarico_solda: "",
  des_montg: "",
  balanceamento: "",
  mandrilhamento: "",
  tratamento: "",
  pintura_horas: "",
  lavagem_acab: "",
  programacao_cam: "",
  eng_tec: "",
  
  // Campos Adicionais
  observacoes: "",
  descricao_geral: "",
  material_base: "",
  dimensoes: "",
  tolerancia: "",
  acabamento_superficie: "",
  norma_aplicavel: "",
  certificacao: "",
  condicoes_especiais: "",
  
  // Controle
  num_orcamento: "",
  num_os: "",
  num_nf_remessa: "",
};

export function useFichaTecnica() {
  const location = useLocation();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [numeroFTC, setNumeroFTC] = useState('');
  const [dataAtual, setDataAtual] = useState('');
  
  // Save state management
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize FTC number and date for new fichas
  useEffect(() => {
    const locationState = location.state as { loadFichaId?: string };
    const urlParams = new URLSearchParams(location.search);
    const editParam = urlParams.get('edit');
    const sessionStorageId = sessionStorage.getItem('loadFichaId');
    const hasLoadRequest = editParam || locationState?.loadFichaId || sessionStorageId;
    
    console.log('🔄 useEffect inicialização - Estado atual:', {
      isInitialized,
      fichaId,
      hasLoadRequest,
      editParam,
      isLoading,
      locationState: location.state
    });
    
    // Only initialize new ficha if:
    // 1. Not initialized yet
    // 2. No fichaId (not editing existing) 
    // 3. No load request pending (URL param, location state, or sessionStorage)
    // 4. Not currently loading
    if (!isInitialized && !fichaId && !hasLoadRequest && !isLoading) {
      console.log('✨ useFichaTecnica - Criando nova ficha');
      setNumeroFTC('DRAFT-' + Date.now());
      setDataAtual(getCurrentDate());
      
      // Add initial materials
      const initialMaterials: Material[] = Array.from({ length: 1 }, (_, index) => ({
        id: Date.now() + index,
        descricao: '',
        quantidade: '',
        unidade: '',
        valor_unitario: '',
        fornecedor: '',
        cliente_interno: '',
        valor_total: '0',
      }));
      
      setMateriais(initialMaterials);
      setIsInitialized(true);
    } else {
      console.log('⏸️ Não criou nova ficha - Condições:', {
        isInitialized: !isInitialized,
        noFichaId: !fichaId,
        noLoadRequest: !hasLoadRequest,
        notLoading: !isLoading,
        hasLoadRequestDetails: { editParam, locationStateId: locationState?.loadFichaId, sessionStorageId }
      });
    }
  }, [isInitialized, fichaId, isLoading, location.search, location.state]);

  const updateFormData = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsModified(true);
    setIsSaved(false);
  }, []);

  const addMaterial = useCallback(() => {
    const newMaterial: Material = {
      id: Date.now(),
      descricao: '',
      quantidade: '',
      unidade: '',
      valor_unitario: '',
      fornecedor: '',
      cliente_interno: '',
      valor_total: '0',
    };
    setMateriais(prev => [...prev, newMaterial]);
  }, []);

  const updateMaterial = useCallback((id: number, field: keyof Material, value: string | number) => {
    setMateriais(prev => prev.map(material => {
      if (material.id === id) {
        const updated = { ...material, [field]: value };
        
        // Calculate total if quantity or unit value changes
        if (field === 'quantidade' || field === 'valor_unitario') {
          const quantidade = parseFloat(field === 'quantidade' ? value.toString() : updated.quantidade) || 0;
          const valorUnitario = parseFloat(field === 'valor_unitario' ? value.toString() : updated.valor_unitario) || 0;
          updated.valor_total = (quantidade * valorUnitario).toFixed(2);
        }
        
        return updated;
      }
      return material;
    }));
    setIsModified(true);
    setIsSaved(false);
  }, []);

  const removeMaterial = useCallback((id: number) => {
    setMateriais(prev => prev.filter(material => material.id !== id));
  }, []);

  const addFoto = useCallback((foto: Foto) => {
    console.log('📸 useFichaTecnica - addFoto chamado:', { 
      foto: foto.name, 
      fichaId, 
      isInitialized,
      currentFotosCount: fotos.length 
    });
    setFotos(prev => [...prev, foto]);
    setIsModified(true);
    setIsSaved(false);
  }, [fichaId, isInitialized, fotos.length]);

  const removeFoto = useCallback((id: number) => {
    setFotos(prev => prev.filter(foto => foto.id !== id));
    setIsModified(true);
    setIsSaved(false);
  }, []);

  // Save ficha function
  const salvarFichaTecnica = useCallback(async (): Promise<{ success: boolean; errors?: string[]; numeroFTC?: string }> => {
    console.log('💾 SALVAMENTO INICIADO');
    console.log('💾 Estado atual:', { 
      fichaId, 
      isSaved, 
      isModified, 
      numeroFTC 
    });
    console.log('💾 Dados para salvar:', { 
      cliente: formData.cliente, 
      materiais: materiais.length, 
      fotos: fotos.length,
      fotosComFile: fotos.filter(f => f.file).length,
      fotosExistentes: fotos.filter(f => f.storagePath).length
    });
    
    setIsSaving(true);
    
    try {
      // Validate required fields
      console.log('✅ Validando campos obrigatórios...');
      const erros = validarCamposObrigatorios(formData, materiais);
      
      if (erros.length > 0) {
        console.error('❌ Erros de validação:', erros);
        setIsSaving(false);
        return { success: false, errors: erros };
      }
      
      // Calculate totals for saving
      console.log('🧮 Calculando totais...');
      const calculos = calculateTotals(materiais, formData);
      console.log('🧮 Totais calculados:', calculos);
      
      // Save to Supabase
      console.log('💾 Chamando salvarFicha...');
      console.log('💾 Parâmetros:', { 
        fichaId: fichaId || undefined, 
        numeroFTC,
        fotosTotal: fotos.length 
      });
      
      const result = await salvarFicha(formData, materiais, fotos, calculos, numeroFTC, fichaId || undefined);
      
      console.log('💾 Resultado do salvarFicha:', result);
      
      if (result.success) {
        console.log('✅ SALVAMENTO BEM-SUCEDIDO!');
        console.log('✅ Atualizando estado...');
        
        if (result.id) {
          console.log('🆔 Definindo fichaId para:', result.id);
          setFichaId(result.id);
        }
        
        // Update FTC number with the real one from database
        if (result.numeroFTC) {
          console.log('🔢 Atualizando numeroFTC para:', result.numeroFTC);
          setNumeroFTC(result.numeroFTC);
        }
        
        setIsSaved(true);
        setIsModified(false);
        setIsSaving(false);
        
        console.log('✅ Estado final após salvamento:', { 
          fichaId: result.id, 
          numeroFTC: result.numeroFTC 
        });
        
        return { success: true };
      } else {
        console.error('❌ ERRO NO SALVAMENTO:', result.error);
        console.error('❌ NÃO vou resetar o fichaId - mantendo sessão de edição');
        setIsSaving(false);
        return { success: false, errors: [result.error || 'Erro ao salvar'] };
      }
    } catch (error) {
      console.error('💥 EXCEÇÃO DURANTE SALVAMENTO:', error);
      console.error('💥 NÃO vou resetar o fichaId - mantendo sessão de edição');
      setIsSaving(false);
      return { success: false, errors: ['Erro inesperado ao salvar'] };
    }
  }, [formData, materiais, fotos, numeroFTC, fichaId]);

  // Load ficha function
  const carregarFichaTecnica = useCallback(async (id: string) => {
    console.log('🚀 useFichaTecnica - Iniciando carregamento da ficha:', id);
    setIsLoading(true);
    
    try {
      console.log('📡 Fazendo chamada para carregarFicha...');
      const ficha = await carregarFicha(id);
      
      if (ficha) {
        console.log('✅ useFichaTecnica - Ficha carregada com sucesso:', {
          id: ficha.id,
          numeroFTC: ficha.numeroFTC,
          cliente: ficha.formData.cliente,
          materiaisCount: ficha.materiais.length,
          fotosCount: ficha.fotos.length
        });
        
        // Set the loaded data
        setFichaId(ficha.id);
        setFormData(ficha.formData);
        setMateriais(ficha.materiais);
        setNumeroFTC(ficha.numeroFTC);
        setDataAtual(getCurrentDate()); // Keep current date for editing
        
        // Load real fotos with Storage URLs
        setFotos(ficha.fotos);
        
        setIsSaved(true);
        setIsModified(false);
        setIsInitialized(true);
        
        console.log('📋 useFichaTecnica - Estado após carregamento:', {
          fichaId: ficha.id,
          numeroFTC: ficha.numeroFTC,
          cliente: ficha.formData.cliente,
          materiaisCount: ficha.materiais.length,
          isInitialized: true,
          isSaved: true
        });
      } else {
        console.error('❌ useFichaTecnica - Ficha não encontrada para ID:', id);
      }
    } catch (error) {
      console.error('💥 useFichaTecnica - Erro ao carregar ficha:', error);
    } finally {
      console.log('🏁 useFichaTecnica - Finalizando carregamento');
      setIsLoading(false);
    }
  }, []);

  // Create new ficha function
  const criarNovaFicha = useCallback(() => {
    console.log('useFichaTecnica - Criando nova ficha');
    setFichaId(null);
    setFormData(initialFormData);
    setMateriais([{
      id: Date.now(),
      descricao: '',
      quantidade: '',
      unidade: '',
      valor_unitario: '',
      fornecedor: '',
      cliente_interno: '',
      valor_total: '0',
    }]);
    setFotos([]);
    setNumeroFTC('DRAFT-' + Date.now());
    setDataAtual(getCurrentDate());
    setIsSaved(false);
    setIsModified(false);
    setIsInitialized(true);
  }, []);

  // Calculate totals
  const calculos: Calculos = calculateTotals(materiais, formData);

  // Load ficha from location state if needed
  useEffect(() => {
    const locationState = location.state as { loadFichaId?: string };
    
    // Get ID from URL params first
    const urlParams = new URLSearchParams(location.search);
    const editParam = urlParams.get('edit');
    console.log('🔍 URL param edit:', editParam);
    
    const sessionStorageId = sessionStorage.getItem('loadFichaId');
    const loadFichaId = editParam || locationState?.loadFichaId || sessionStorageId;
    
    console.log('🔍 useEffect carregamento - DETALHADO');
    console.log('🔍 location.state:', location.state);
    console.log('🔍 locationState?.loadFichaId:', locationState?.loadFichaId);
    console.log('🔍 sessionStorage loadFichaId:', sessionStorageId);
    console.log('🔍 loadFichaId final:', loadFichaId);
    console.log('🔍 Estado atual:', { isInitialized, fichaId, isLoading });
    
    if (loadFichaId && !fichaId && !isLoading && isInitialized) {
      console.log('🎯 CONDIÇÕES ATENDIDAS - Iniciando carregamento da ficha:', loadFichaId);
      sessionStorage.removeItem('loadFichaId'); // Clean up after loading
      carregarFichaTecnica(loadFichaId);
    } else {
      console.log('❌ Não carregou ficha - Análise detalhada:', {
        hasLoadFichaId: !!loadFichaId,
        loadFichaIdValue: loadFichaId,
        hasFichaId: !!fichaId,
        fichaIdValue: fichaId,
        isLoading,
        isInitialized,
        decisão: !loadFichaId ? 'Sem loadFichaId' : 
                 fichaId ? 'Já tem fichaId' : 
                 isLoading ? 'Já carregando' : 
                 !isInitialized ? 'Não inicializado' : 'Condições não atendidas'
      });
    }
  }, [location.search, location.state?.loadFichaId, fichaId, carregarFichaTecnica, isLoading, isInitialized]);

  return {
    // Original data
    formData,
    updateFormData,
    materiais,
    addMaterial,
    updateMaterial,
    removeMaterial,
    fotos,
    addFoto,
    removeFoto,
    calculos,
    numeroFTC,
    dataAtual,
    
    // Save functionality
    fichaId,
    isSaved,
    isModified,
    isSaving,
    isLoading,
    salvarFichaTecnica,
    carregarFichaTecnica,
    criarNovaFicha,
  };
}