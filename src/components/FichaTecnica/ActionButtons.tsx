import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Printer, Mail, MessageCircle, Search, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormData, Material, Foto } from "@/types/ficha-tecnica";

interface ActionButtonsProps {
  formData: FormData;
  materiais: Material[];
  fotos: Foto[];
  // Save functionality
  isSaved: boolean;
  isModified: boolean;
  isSaving: boolean;
  onSave: () => Promise<{ success: boolean; errors?: string[] }>;
}

export function ActionButtons({ 
  formData, 
  materiais, 
  fotos, 
  isSaved, 
  isModified, 
  isSaving, 
  onSave 
}: ActionButtonsProps) {
  const { toast } = useToast();

  const handleSave = async () => {
    const result = await onSave();
    
    if (result.success) {
      toast({
        title: "Ficha Salva!",
        description: "Ficha técnica salva com sucesso.",
      });
    } else {
      toast({
        title: "Erro ao Salvar",
        description: result.errors?.[0] || "Erro desconhecido.",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Funcionalidade será implementada com o backend.",
    });
  };

  const exportToHTML = () => {
    toast({
      title: "Exportando HTML",
      description: "Funcionalidade será implementada com o backend.",
    });
  };

  const sendWhatsApp = () => {
    const message = `Ficha Técnica de Cotação - Cliente: ${formData.cliente} - Serviço: ${formData.servico}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const sendEmail = () => {
    const subject = `Ficha Técnica de Cotação - ${formData.cliente}`;
    const body = `Cliente: ${formData.cliente}\nSolicitante: ${formData.solicitante}\nServiço: ${formData.servico}`;
    
    const mailtoLink = `mailto:${formData.fone_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const consultarFichas = () => {
    toast({
      title: "Consultar Fichas",
      description: "Funcionalidade de consulta será implementada com o backend.",
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Ficha'}
          </Button>

          <Button onClick={exportToPDF} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>

          <Button onClick={exportToHTML} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exportar HTML
          </Button>

          <Button onClick={sendWhatsApp} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
            <MessageCircle className="h-4 w-4" />
            Enviar WhatsApp
          </Button>

          <Button onClick={sendEmail} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800">
            <Mail className="h-4 w-4" />
            Enviar E-mail
          </Button>

          <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>

          <Button onClick={consultarFichas} variant="secondary" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Consultar Fichas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}