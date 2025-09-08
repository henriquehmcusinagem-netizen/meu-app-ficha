import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFichaTecnica } from "@/hooks/useFichaTecnica";
import Index from "./Index";

export default function NovaFicha() {
  const navigate = useNavigate();
  const location = useLocation();
  const { carregarFichaTecnica } = useFichaTecnica();

  // Load ficha if coming from consultation page
  useEffect(() => {
    if (location.state?.loadFichaId) {
      carregarFichaTecnica(location.state.loadFichaId);
    }
  }, [location.state, carregarFichaTecnica]);

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
          <h1 className="text-xl font-semibold text-muted-foreground">Nova Ficha Técnica</h1>
        </div>
        
        {/* Render the original Index component */}
        <Index />
      </div>
    </div>
  );
}