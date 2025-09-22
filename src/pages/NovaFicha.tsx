import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFichaTecnica } from "@/hooks/useFichaTecnica";
import { useToast } from "@/hooks/use-toast";
import FichaTecnicaForm from "./FichaTecnicaForm";
import VoiceFTC from "@/components/VoiceFTC";

export default function NovaFicha() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isLoading, fichaId } = useFichaTecnica();

  // Debug location state
  useEffect(() => {
    console.log('🏠 NovaFicha - Component mounted');
    console.log('🏠 NovaFicha - location:', location);
    console.log('🏠 NovaFicha - location.state:', location.state);
    
    const urlParams = new URLSearchParams(location.search);
    const editParam = urlParams.get('edit');
    console.log('🏠 NovaFicha - URL param edit:', editParam);
    console.log('🏠 NovaFicha - loadFichaId from state:', location.state?.loadFichaId);
    console.log('🏠 NovaFicha - sessionStorage loadFichaId:', sessionStorage.getItem('loadFichaId'));
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-xl font-semibold text-muted-foreground">
            {fichaId ? 'Editando Ficha Técnica' : 'Nova Ficha Técnica'}
          </h1>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
        
        {/* Voice Recording Button */}
        <div className="mb-6">
          <VoiceFTC />
        </div>
        
        {/* Render the original FichaTecnicaForm component */}
        <FichaTecnicaForm />
      </div>
    </div>
  );
}