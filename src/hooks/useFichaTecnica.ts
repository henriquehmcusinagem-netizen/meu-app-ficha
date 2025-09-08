import { useState, useEffect, useCallback } from 'react';
import { FormData, Material, Foto, Calculos } from '@/types/ficha-tecnica';
import { calculateTotals } from '@/utils/calculations';
import { generateFTCNumber, getCurrentDate } from '@/utils/helpers';

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
  
  // Controle
  num_orcamento: "",
  num_os: "",
  num_nf_remessa: "",
  num_nf_entrega: "",
};

export function useFichaTecnica() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [numeroFTC, setNumeroFTC] = useState('');
  const [dataAtual, setDataAtual] = useState('');

  // Initialize FTC number and date
  useEffect(() => {
    setNumeroFTC(generateFTCNumber());
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
  }, []);

  const updateFormData = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
  }, []);

  const removeMaterial = useCallback((id: number) => {
    setMateriais(prev => prev.filter(material => material.id !== id));
  }, []);

  const addFoto = useCallback((foto: Foto) => {
    setFotos(prev => [...prev, foto]);
  }, []);

  const removeFoto = useCallback((id: number) => {
    setFotos(prev => prev.filter(foto => foto.id !== id));
  }, []);

  // Calculate totals
  const calculos: Calculos = calculateTotals(materiais, formData);

  return {
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
  };
}