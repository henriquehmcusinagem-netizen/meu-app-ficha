import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Printer, Mail, MessageCircle, Search, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormData, Material, Foto } from "@/types/ficha-tecnica";

interface PostSaveActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  materiais: Material[];
  fotos: Foto[];
}

export function PostSaveActionsModal({ 
  open, 
  onOpenChange, 
  formData, 
  materiais, 
  fotos 
}: PostSaveActionsModalProps) {
  const { toast } = useToast();

  const exportToPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Funcionalidade será implementada com o backend.",
    });
    onOpenChange(false);
  };

  const exportToHTML = () => {
    toast({
      title: "Exportando HTML",
      description: "Funcionalidade será implementada com o backend.",
    });
    onOpenChange(false);
  };

  const sendWhatsApp = () => {
    const message = `Ficha Técnica de Cotação - Cliente: ${formData.cliente} - Serviço: ${formData.servico}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    onOpenChange(false);
  };

  const sendEmail = () => {
    const subject = `Ficha Técnica de Cotação - ${formData.cliente}`;
    const body = `Cliente: ${formData.cliente}\nSolicitante: ${formData.solicitante}\nServiço: ${formData.servico}`;
    
    const mailtoLink = `mailto:${formData.fone_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    onOpenChange(false);
  };

  const consultarFichas = () => {
    toast({
      title: "Consultar Fichas",
      description: "Funcionalidade de consulta será implementada com o backend.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <DialogTitle className="text-xl">Ficha Salva com Sucesso!</DialogTitle>
          </div>
          <DialogDescription>
            Escolha uma das opções abaixo para compartilhar ou exportar sua ficha técnica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Exportar Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Exportar</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={exportToPDF} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80">
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button onClick={exportToHTML} variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                HTML
              </Button>
            </div>
          </div>

          {/* Compartilhar Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Compartilhar</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={sendWhatsApp} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button onClick={sendEmail} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800">
                <Mail className="h-4 w-4" />
                E-mail
              </Button>
            </div>
          </div>

          {/* Outras Ações Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Outras Ações</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={consultarFichas} variant="secondary" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Consultar
              </Button>
            </div>
          </div>
        </div>

        <Button variant="ghost" onClick={() => onOpenChange(false)} className="mt-4 w-full">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}