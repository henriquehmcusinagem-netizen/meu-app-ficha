import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SaveButtonProps {
  isSaved: boolean;
  isModified: boolean;
  isSaving: boolean;
  onSave: () => Promise<{ success: boolean; errors?: string[] }>;
  onSaveSuccess?: () => void;
}

export function SaveButton({ 
  isSaved, 
  isModified, 
  isSaving, 
  onSave,
  onSaveSuccess
}: SaveButtonProps) {
  const { toast } = useToast();

  const handleSave = async () => {
    const result = await onSave();
    
    if (result.success) {
      toast({
        title: "Ficha Salva com Sucesso",
        description: "Ficha técnica salva e número FTC gerado automaticamente.",
        variant: "default",
      });
      onSaveSuccess?.();
    } else {
      toast({
        title: "Erro ao Salvar",
        description: result.errors?.[0] || "Erro desconhecido.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center my-6">
      <Button 
        onClick={handleSave} 
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
  );
}