import { useState, useEffect, useCallback } from 'react';
import { FormData, Material, Foto, Calculos } from '@/types/ficha-tecnica';
import { calculateTotals } from '@/utils/calculations';
import { generateFTCNumber, getCurrentDate } from '@/utils/helpers';

const initialFormData: FormData = {
  cliente: '',
  obra: '',
  endereco: '',
  responsavel: '',
  telefone: '',
  email: '',
  equipamento: '',
  modelo: '',
  marca: '',
  numeroSerie: '',
  ano: '',
  horimetro: '',
  servico: '',
  observacoes: '',
  solda: '',
  pintura: '',
  usinagem: '',
  outros: '',
  horasMecanico: '0',
  valorHoraMecanico: '0',
  horasSoldador: '0',
  valorHoraSoldador: '0',
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
    const initialMaterials: Material[] = Array.from({ length: 3 }, (_, index) => ({
      id: Date.now() + index,
      item: index + 1,
      quantidade: '',
      unidade: '',
      descricao: '',
      valorUnitario: '',
      total: '0',
    }));
    
    setMateriais(initialMaterials);
  }, []);

  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const addMaterial = useCallback(() => {
    const newMaterial: Material = {
      id: Date.now(),
      item: materiais.length + 1,
      quantidade: '',
      unidade: '',
      descricao: '',
      valorUnitario: '',
      total: '0',
    };
    setMateriais(prev => [...prev, newMaterial]);
  }, [materiais.length]);

  const updateMaterial = useCallback((id: number, field: keyof Material, value: string | number) => {
    setMateriais(prev => prev.map(material => {
      if (material.id === id) {
        const updated = { ...material, [field]: value };
        
        // Calculate total if quantity or unit value changes
        if (field === 'quantidade' || field === 'valorUnitario') {
          const quantidade = parseFloat(field === 'quantidade' ? value.toString() : updated.quantidade) || 0;
          const valorUnitario = parseFloat(field === 'valorUnitario' ? value.toString() : updated.valorUnitario) || 0;
          updated.total = (quantidade * valorUnitario).toFixed(2);
        }
        
        return updated;
      }
      return material;
    }));
  }, []);

  const removeMaterial = useCallback((id: number) => {
    setMateriais(prev => {
      const filtered = prev.filter(material => material.id !== id);
      // Reorder item numbers
      return filtered.map((material, index) => ({
        ...material,
        item: index + 1
      }));
    });
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