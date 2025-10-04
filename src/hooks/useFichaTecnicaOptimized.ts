import { useCallback, useMemo } from 'react';
import { FormData, Material, Foto } from '@/types/ficha-tecnica';

interface UseFichaTecnicaOptimizedProps {
  formData: FormData;
  materiais: Material[];
  fotos: Foto[];
  updateFormData: (field: keyof FormData, value: string | boolean) => void;
  addMaterial: () => void;
  updateMaterial: (index: number, field: keyof Material, value: string) => void;
  removeMaterial: (index: number) => void;
  addFoto: (foto: Foto) => void;
  removeFoto: (index: number) => void;
}

/**
 * Hook otimizado para gerenciar estado do formulário de ficha técnica
 * Utiliza useCallback e useMemo para evitar re-renders desnecessários
 */
export function useFichaTecnicaOptimized({
  formData,
  materiais,
  fotos,
  updateFormData,
  addMaterial,
  updateMaterial,
  removeMaterial,
  addFoto,
  removeFoto
}: UseFichaTecnicaOptimizedProps) {

  // Memoizar estilos para evitar recriação a cada render
  const styles = useMemo(() => ({
    sectionStyle: "bg-card rounded-md mb-2 p-3 md:p-4 shadow-sm border border-border",
    gridStyle: "grid gap-2 md:gap-3",
    fieldStyle: "flex flex-col",
    labelStyle: "text-xs font-medium text-muted-foreground mb-0.5 uppercase tracking-wide",
    inputStyle: "h-11 border border-border rounded px-3 text-base transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background text-foreground",
    textareaStyle: "min-h-[60px] border border-border rounded px-3 py-2 text-base resize-y transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background text-foreground"
  }), []);

  // Memoizar handlers para evitar recriação a cada render
  const handlers = useMemo(() => ({
    updateFormData: useCallback((field: keyof FormData, value: string | boolean) => {
      updateFormData(field, value);
    }, [updateFormData]),

    addMaterial: useCallback(() => {
      addMaterial();
    }, [addMaterial]),

    updateMaterial: useCallback((index: number, field: keyof Material, value: string) => {
      updateMaterial(index, field, value);
    }, [updateMaterial]),

    removeMaterial: useCallback((index: number) => {
      removeMaterial(index);
    }, [removeMaterial]),

    addFoto: useCallback((foto: Foto) => {
      addFoto(foto);
    }, [addFoto]),

    removeFoto: useCallback((index: number) => {
      removeFoto(index);
    }, [removeFoto])
  }), [updateFormData, addMaterial, updateMaterial, removeMaterial, addFoto, removeFoto]);

  // Memoizar dados calculados
  const memoizedData = useMemo(() => ({
    hasCliente: formData.cliente.trim().length > 0,
    hasPeca: formData.nome_peca.trim().length > 0,
    hasServico: formData.servico.trim().length > 0,
    hasMateriais: materiais.length > 0,
    hasFotos: fotos.length > 0,
    isFormValid: formData.cliente.trim().length > 0 &&
                 formData.nome_peca.trim().length > 0 &&
                 formData.servico.trim().length > 0
  }), [
    formData.cliente,
    formData.nome_peca,
    formData.servico,
    materiais.length,
    fotos.length
  ]);

  // Memoizar props para componentes filhos
  const componentProps = useMemo(() => ({
    dadosCliente: {
      formData,
      updateFormData: handlers.updateFormData,
      ...styles
    },
    dadosPeca: {
      formData,
      updateFormData: handlers.updateFormData,
      ...styles
    },
    materiais: {
      materiais,
      addMaterial: handlers.addMaterial,
      updateMaterial: handlers.updateMaterial,
      removeMaterial: handlers.removeMaterial,
      ...styles
    },
    fotos: {
      fotos,
      addFoto: handlers.addFoto,
      removeFoto: handlers.removeFoto,
      ...styles
    }
  }), [
    formData,
    materiais,
    fotos,
    handlers,
    styles
  ]);

  return {
    styles,
    handlers,
    memoizedData,
    componentProps
  };
}