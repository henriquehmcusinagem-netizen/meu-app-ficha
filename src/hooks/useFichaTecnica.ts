import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FormData, Material, Foto, Calculos, FichaSalva } from '@/types/ficha-tecnica';
import { calculateTotals } from '@/utils/calculations';
import { getCurrentDate } from '@/utils/helpers';
import {
  salvarFicha,
  validarCamposObrigatorios,
  carregarFotosFicha
} from '@/utils/supabaseStorage';
import { useFichaQuery, useFichasQuery } from './useFichasQuery';
import { logger } from '@/utils/logger';

const initialFormData: FormData = {
  // Dados do Cliente
  cliente: "",
  cliente_predefinido: "",
  solicitante: "",
  fone_email: "",
  data_visita: "",
  data_entrega: "",
  
  // Dados da Peça/Equipamento
  nome_peca: "",
  quantidade: "",
  servico: "",
  
  // Material para Cotação
  material_por_peca: "",
  material_todas_pecas: "",
  
  // Execução e Detalhes
  execucao: "",
  visita_tecnica: "",
  visita_horas: "",
  tem_peca_amostra: "",

  // 🆕 NOVOS CAMPOS - Peças e Amostras
  peca_foi_desmontada: "",
  peca_condicao: "",
  precisa_peca_teste: "",
  responsavel_tecnico: "",

  projeto_desenvolvido_por: "",
  desenho_peca: "",
  desenho_finalizado: "",
  transporte_caminhao_hmc: false,
  transporte_pickup_hmc: false,
  transporte_cliente: false,
  transporte: "",
  
  // Campos extras para outlookIntegration
  inspecao: "",
  outros_servicos: "",
  
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

  // ⚡ SERVIÇOS ESPECIAIS
  fornecimento_desenho: "",
  fotos_relatorio: "",
  relatorio_tecnico: "",
  emissao_art: "",
  servicos_terceirizados: "",

  // 🆕 NOVOS CAMPOS EXTRAS
  observacoes_adicionais: "",
  prioridade: "Normal", // Valor padrão: Normal

  // Horas de Serviço - ANTIGOS
  horas_por_peca: "",
  horas_todas_pecas: "",
  torno_grande: "",
  torno_pequeno: "",
  cnc_tf: "", // DEPRECATED
  fresa_furad: "", // DEPRECATED
  plasma_oxicorte: "",
  dobra: "",
  calandra: "",
  macarico_solda: "", // DEPRECATED
  des_montg: "",
  balanceamento: "",
  mandrilhamento: "",
  tratamento: "",
  pintura_horas: "",
  lavagem_acab: "", // DEPRECATED
  programacao_cam: "",
  eng_tec: "",

  // 🆕 NOVOS CAMPOS - Horas
  torno_cnc: "",
  centro_usinagem: "",
  fresa: "",
  furadeira: "",
  macarico: "",
  solda: "",
  serra: "",
  caldeiraria: "",
  montagem: "",
  lavagem: "",
  acabamento: "",
  tecnico_horas: "",
  
  
  // Controle
  num_orcamento: "",
  num_os: "",
  num_desenho: "",
  num_nf_remessa: "",
};

export function useFichaTecnica() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClone, setIsClone] = useState(false);
  
  // Get edit ID from URL params or location state
  const editId = searchParams.get('edit') ||
                (location.state as { loadFichaId?: string })?.loadFichaId ||
                sessionStorage.getItem('loadFichaId');

  // Get clone ID from URL params
  const cloneId = searchParams.get('clone');

  // Use React Query for loading ficha (clone or edit)
  const { data: fichaCarregada, isLoading, error } = useFichaQuery(cloneId || editId);
  const { invalidateFichas } = useFichasQuery();

  // Function to check if user has entered any significant data
  const hasUserData = useCallback(() => {
    return formData.cliente.trim() !== '' ||
           formData.nome_peca.trim() !== '' ||
           formData.servico.trim() !== '' ||
           formData.num_orcamento.trim() !== '' ||
           materiais.some(m => m.descricao.trim() !== '' || m.quantidade.trim() !== '');
  }, [formData, materiais]);

  // Reset initialization flag when URL changes
  useEffect(() => {
    setIsInitialized(false);
    setIsClone(!!cloneId);
  }, [editId, cloneId]);

  // Initialize ficha based on React Query data or create new
  useEffect(() => {
    // Prevent re-initialization if already done
    if (isInitialized) return;

    if (cloneId && fichaCarregada && !fichaId) {
      // Clone existing ficha: load data but DON'T set fichaId (creates new ficha)
      setFormData(fichaCarregada.formData);
      setMateriais(fichaCarregada.materiais);
      setFotos([]); // DON'T clone photos - user will add new ones
      setNumeroFTC('DRAFT-' + Date.now()); // Generate new draft number
      setDataAtual(getCurrentDate());
      setIsSaved(false); // Not saved yet
      setIsModified(false); // Not modified yet
      setIsInitialized(true); // Mark as initialized

      // Cleanup
      sessionStorage.removeItem('loadFichaId');
    } else if (editId && fichaCarregada && !fichaId) {
      // Load existing ficha from React Query data for editing
      setFichaId(fichaCarregada.id);
      setFormData(fichaCarregada.formData);
      setMateriais(fichaCarregada.materiais);
      setNumeroFTC(fichaCarregada.numeroFTC);
      setDataAtual(getCurrentDate());
      setIsInitialized(true); // Mark as initialized

      // Load photos on-demand for editing
      const loadFotos = async () => {
        try {
          const fotosCarregadas = await carregarFotosFicha(fichaCarregada.id);
          setFotos(fotosCarregadas);
        } catch (error) {
          logger.error('Erro ao carregar fotos da ficha', error);
          setFotos([]);
        }
      };

      loadFotos();
      setIsSaved(true);
      setIsModified(false);

      // Cleanup
      sessionStorage.removeItem('loadFichaId');
    } else if (!editId && !cloneId && !fichaId && !isLoading && !numeroFTC && !isInitialized) {
      // Create new ficha only on first load without any existing data
      setNumeroFTC('DRAFT-' + Date.now());
      setDataAtual(getCurrentDate());
      setMateriais([{
        id: Date.now(),
        descricao: '',
        quantidade: '',
        unidade: '',
        valor_unitario: '',
        fornecedor: '',
        cliente_interno: '',
        cliente_interno_tipo: '',
        valor_total: '0',
      }]);
      setIsSaved(false);
      setIsModified(false);
      setIsInitialized(true); // Mark as initialized
    }
  }, [editId, cloneId, fichaCarregada, fichaId, isLoading, numeroFTC, isInitialized]);

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
      cliente_interno_tipo: '',
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
    setFotos(prev => [...prev, foto]);
    setIsModified(true);
    setIsSaved(false);
  }, []);

  const removeFoto = useCallback((id: number) => {
    setFotos(prev => prev.filter(foto => foto.id !== id));
    setIsModified(true);
    setIsSaved(false);
  }, []);

  // Save ficha function
  const salvarFichaTecnica = useCallback(async (status?: string): Promise<{ success: boolean; errors?: string[]; numeroFTC?: string }> => {
    
    setIsSaving(true);
    
    try {
      // Validate required fields
      const erros = validarCamposObrigatorios(formData, materiais);
      
      if (erros.length > 0) {
        logger.warn('Erros de validação encontrados', { erros });
        setIsSaving(false);
        return { success: false, errors: erros };
      }
      
      // Calculate totals for saving
      const calculos = calculateTotals(materiais, formData);

      // Save to Supabase
      // Se não tem fichaId, força status rascunho (para clones e novas fichas)
      const finalStatus = fichaId ? status : (status || 'rascunho');
      const result = await salvarFicha(formData, materiais, fotos, calculos, numeroFTC, fichaId || undefined, finalStatus);
      
      
      if (result.success) {
        if (result.id) {
          setFichaId(result.id);
        }

        // Update FTC number with the real one from database
        if (result.numeroFTC) {
          setNumeroFTC(result.numeroFTC);
        }

        setIsSaved(true);
        setIsModified(false);
        setIsSaving(false);

        // Invalidate React Query cache
        invalidateFichas();

        return { success: true, numeroFTC: result.numeroFTC };
      } else {
        logger.error('Erro no salvamento da ficha', result.error);
        logger.info('Mantendo sessão de edição ativa');
        setIsSaving(false);
        return { success: false, errors: [result.error || 'Erro ao salvar'] };
      }
    } catch (error) {
      logger.error('Exceção durante salvamento', error);
      logger.info('Mantendo sessão de edição ativa');
      setIsSaving(false);
      return { success: false, errors: ['Erro inesperado ao salvar'] };
    }
  }, [formData, materiais, fotos, numeroFTC, fichaId, invalidateFichas]);

  // Create new ficha function
  const criarNovaFicha = useCallback(() => {
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
      cliente_interno_tipo: '',
      valor_total: '0',
    }]);
    setFotos([]);
    setNumeroFTC('DRAFT-' + Date.now());
    setDataAtual(getCurrentDate());
    setIsSaved(false);
    setIsModified(false);
  }, []);

  // Calculate totals
  const calculos: Calculos = calculateTotals(materiais, formData);

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
    criarNovaFicha,

    // Status da ficha carregada
    fichaCarregada,
    isClone
  };
}