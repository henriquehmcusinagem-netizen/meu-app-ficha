import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFichaTecnica } from "@/hooks/useFichaTecnica";
import { useToast } from "@/hooks/use-toast";
import FichaTecnicaForm from "./FichaTecnicaForm";

export default function NovaFicha() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isLoading, fichaId } = useFichaTecnica();

  // Debug location state
  useEffect(() => {
    
    const urlParams = new URLSearchParams(location.search);
    const editParam = urlParams.get('edit');
    const viewParam = urlParams.get('view');
  }, [location]);

  // Show toast for loading state
  useEffect(() => {
    const loadFichaId = location.state?.loadFichaId;
    
    if (loadFichaId && isLoading) {
      toast({
        title: "Carregando ficha...",
        description: "Aguarde enquanto a ficha é carregada.",
      });
    }
    
    if (loadFichaId && !isLoading && fichaId) {
      toast({
        title: "Ficha carregada com sucesso!",
        description: "Você pode agora editar a ficha técnica.",
      });
    }
  }, [location.state?.loadFichaId, isLoading, fichaId, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header - Compacto */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-3 py-1 text-sm h-8"
            size="sm"
          >
            <Home className="h-3 w-3" />
            Dashboard
          </Button>
          <div className="h-3 w-px bg-border" />
          <h1 className="text-lg font-semibold text-muted-foreground">
            {fichaId ? 'Editando Ficha Técnica' : 'Nova Ficha Técnica'}
          </h1>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          )}
        </div>


        {/* Render the original FichaTecnicaForm component */}
        <FichaTecnicaForm />
      </div>
    </div>
  );
}