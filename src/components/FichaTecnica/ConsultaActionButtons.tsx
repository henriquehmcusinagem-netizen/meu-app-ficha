import { Button } from "@/components/ui/button";
import { FileText, Printer, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/types/ficha-tecnica";
import { exportToHTML } from "@/utils/htmlExporter";
import { ConsultaPrintLayout } from "./ConsultaPrintLayout";
import { createRoot } from "react-dom/client";

interface ConsultaActionButtonsProps {
  ficha: FichaSalva;
}

export function ConsultaActionButtons({ ficha }: ConsultaActionButtonsProps) {
  const { toast } = useToast();


  const exportToHTMLFile = () => {
    try {
      exportToHTML(ficha);
      toast({
        title: "HTML Exportado",
        description: `Arquivo HTML da FTC ${ficha.numeroFTC} baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar HTML",
        description: "Não foi possível exportar o HTML. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const sendWhatsApp = () => {
    const valorTotal = ficha.calculos.materialTodasPecas;
    const message = `🔧 *Ficha Técnica de Cotação*\n\n` +
      `📋 *FTC:* ${ficha.numeroFTC}\n` +
      `👤 *Cliente:* ${ficha.resumo.cliente}\n` +
      `⚙️ *Serviço:* ${ficha.resumo.servico}\n` +
      `💰 *Valor Total Material:* R$ ${valorTotal.toFixed(2)}\n` +
      `📅 *Data:* ${ficha.dataCriacao}\n\n` +
      `_Gerado pelo sistema HMC_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    
    toast({
      title: "WhatsApp aberto",
      description: "Mensagem preparada para envio.",
    });
  };

  const sendEmail = () => {
    import('@/utils/htmlViewer').then(({ openHTMLInNewTab }) => {
      const success = openHTMLInNewTab(ficha);
      
      if (success) {
        toast({
          title: "HTML Aberto",
          description: "Nova aba aberta com a ficha técnica formatada para visualização e compartilhamento!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a nova aba. Verifique se popups estão permitidos.",
          variant: "destructive"
        });
      }
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o visualizador HTML.",
        variant: "destructive"
      });
    });
  };

  const printFicha = () => {
    // Create a temporary div to render the print layout
    const printDiv = document.createElement('div');
    document.body.appendChild(printDiv);
    
    // Create root and render the print layout
    const root = createRoot(printDiv);
    root.render(<ConsultaPrintLayout ficha={ficha} />);
    
    // Wait for render and then print
    setTimeout(() => {
      window.print();
      
      // Cleanup after print
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(printDiv);
      }, 100);
    }, 100);
    
    toast({
      title: "Preparando impressão",
      description: "Janela de impressão será aberta.",
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={(e) => { e.stopPropagation(); exportToHTMLFile(); }} 
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
        onClick={(e) => { e.stopPropagation(); printFicha(); }} 
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