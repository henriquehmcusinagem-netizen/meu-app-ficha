import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SaveConfirmModal } from "./SaveConfirmModal";
import { StatusFicha, Material, FormData, FichaSalva } from "@/types/ficha-tecnica";

interface SaveButtonProps {
  isSaved: boolean;
  isModified: boolean;
  isSaving: boolean;
  onSave: (status?: string) => Promise<{ success: boolean; errors?: string[] }>;
  onSaveSuccess?: () => void;
  materiais: Material[];
  formData: FormData;
  numeroFTC: string;
  ficha?: FichaSalva; // Para integração com Outlook
  currentStatus?: StatusFicha; // Status atual da ficha
}

export function SaveButton({
  isSaved,
  isModified,
  isSaving,
  onSave,
  onSaveSuccess,
  materiais,
  formData,
  numeroFTC,
  ficha,
  currentStatus
}: SaveButtonProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async (selectedStatus: StatusFicha) => {
    console.log('💾 SaveButton: Iniciando salvamento com status:', selectedStatus);
    const result = await onSave(selectedStatus);
    console.log('💾 SaveButton: Resultado do salvamento:', result);

    if (result.success) {
      console.log('✅ SaveButton: Salvamento bem-sucedido, chamando onSaveSuccess');
      toast({
        title: "Ficha Salva com Sucesso",
        description: "Redirecionando para consulta de fichas...",
        variant: "default",
      });
      console.log('📞 SaveButton: Chamando onSaveSuccess callback');
      onSaveSuccess?.();
      console.log('🎯 SaveButton: onSaveSuccess executado');

      // Redirecionar para consultas após pequeno delay
      setTimeout(() => {
        console.log('🔄 SaveButton: Redirecionando para /consultar-fichas');
        navigate('/consultar-fichas');
      }, 1500);
    } else {
      toast({
        title: "Erro ao Salvar",
        description: result.errors?.[0] || "Erro desconhecido.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex justify-center my-6">
        <Button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          size="lg"
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 px-8 py-3 text-lg font-semibold"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {isSaving ? 'Salvando...' : 'Salvar Ficha'}
        </Button>
      </div>

      <SaveConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        currentStatus={currentStatus || 'rascunho'}
        materiais={materiais}
        isSaving={isSaving}
        formData={formData}
        numeroFTC={numeroFTC}
        ficha={ficha}
      />
    </>
  );
}