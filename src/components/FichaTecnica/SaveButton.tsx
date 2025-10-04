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
  onSave: (status?: string) => Promise<{ success: boolean; errors?: string[]; numeroFTC?: string }>;
  materiais: Material[];
  formData: FormData;
  numeroFTC: string;
  ficha?: FichaSalva;
  currentStatus?: StatusFicha;
}

export function SaveButton({
  isSaved,
  isModified,
  isSaving,
  onSave,
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

  // Função para calcular próximo status baseado no fluxo de trabalho
  const getNextStatus = (currentStatus: StatusFicha, selectedStatus: StatusFicha): StatusFicha => {
    // Se foi escolhido "continuar", mantém o status atual
    if (selectedStatus === currentStatus) {
      return currentStatus;
    }

    // Se foi escolhido "finalizar", avança no fluxo
    switch (currentStatus) {
      case 'rascunho':
        return 'aguardando_cotacao_compras';
      case 'aguardando_cotacao_compras':
        return 'aguardando_orcamento_comercial';
      case 'aguardando_orcamento_comercial':
        return 'orcamento_enviado_cliente';
      case 'orcamento_enviado_cliente':
        return 'orcamento_enviado_cliente';
      default:
        return selectedStatus;
    }
  };

  const handleConfirmSave = async (selectedStatus: StatusFicha) => {
    const result = await onSave(selectedStatus);

    if (result.success) {
      const nextStatus = getNextStatus(currentStatus || 'rascunho', selectedStatus);

      toast({
        title: "Ficha Salva com Sucesso",
        description: "Redirecionando para a próxima etapa...",
        variant: "default",
      });

      // Redirecionar com state para auto-seleção da aba correta
      setTimeout(() => {
        navigate('/consultar-fichas', {
          state: {
            autoSelectStatus: nextStatus,
            fromSave: true
          }
        });
      }, 1500);
    } else {
      toast({
        title: "Erro ao Salvar",
        description: result.errors?.[0] || "Erro desconhecido.",
        variant: "destructive",
      });
    }

    return result;
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