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
  const { carregarFichaTecnica, isLoading, fichaId } = useFichaTecnica();

  // Load ficha if coming from consultation page
  useEffect(() => {
    const loadFichaId = location.state?.loadFichaId;
    console.log('NovaFicha - useEffect executado, loadFichaId:', loadFichaId);
    
    if (loadFichaId) {
      console.log('NovaFicha - Carregando ficha:', loadFichaId);
      toast({
        title: "Carregando ficha...",
        description: "Aguarde enquanto a ficha é carregada.",
      });
      
      carregarFichaTecnica(loadFichaId).then(() => {
        toast({
          title: "Ficha carregada",
          description: "A ficha foi carregada com sucesso.",
        });
      }).catch((error) => {
        console.error('NovaFicha - Erro ao carregar ficha:', error);
        toast({
          title: "Erro ao carregar ficha",
          description: "Ocorreu um erro ao carregar a ficha.",
          variant: "destructive",
        });
      });
    }
  }, [location.state?.loadFichaId, carregarFichaTecnica, toast]);

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
        
        {/* Render the original FichaTecnicaForm component */}
        <FichaTecnicaForm />
      </div>
    </div>
  );
}