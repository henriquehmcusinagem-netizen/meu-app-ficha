import { Button } from "@/components/ui/button";
import { FileText, Printer, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/utils/supabaseStorage";

interface ConsultaActionButtonsProps {
  ficha: FichaSalva;
}

export function ConsultaActionButtons({ ficha }: ConsultaActionButtonsProps) {
  const { toast } = useToast();

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
    const message = `Ficha Técnica de Cotação - Cliente: ${ficha.resumo.cliente} - Serviço: ${ficha.resumo.servico} - FTC: ${ficha.numeroFTC}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const sendEmail = () => {
    const subject = `Ficha Técnica de Cotação - ${ficha.resumo.cliente} - FTC ${ficha.numeroFTC}`;
    const body = `Cliente: ${ficha.resumo.cliente}\nServiço: ${ficha.resumo.servico}\nFTC: ${ficha.numeroFTC}\nValor Total: R$ ${ficha.resumo.valorTotal.toFixed(2)}`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        onClick={(e) => { e.stopPropagation(); exportToPDF(); }} 
        size="sm" 
        className="bg-gradient-to-r from-primary to-primary/80"
      >
        <FileText className="h-3 w-3" />
        PDF
      </Button>

      <Button 
        onClick={(e) => { e.stopPropagation(); exportToHTML(); }} 
        variant="outline" 
        size="sm"
      >
        <FileText className="h-3 w-3" />
        HTML
      </Button>

      <Button 
        onClick={(e) => { e.stopPropagation(); sendWhatsApp(); }} 
        size="sm" 
        className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
      >
        <MessageCircle className="h-3 w-3" />
        WhatsApp
      </Button>

      <Button 
        onClick={(e) => { e.stopPropagation(); sendEmail(); }} 
        size="sm" 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
      >
        <Mail className="h-3 w-3" />
        Email
      </Button>

      <Button 
        onClick={(e) => { e.stopPropagation(); window.print(); }} 
        variant="outline" 
        size="sm" 
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
      >
        <Printer className="h-3 w-3" />
        Imprimir
      </Button>
    </div>
  );
}