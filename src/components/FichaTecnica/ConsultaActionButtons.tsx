import { Button } from "@/components/ui/button";
import { FileText, Printer, Mail, MessageCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/types/ficha-tecnica";
import { exportToHTML } from "@/utils/htmlExporter";
import { generatePDF } from "@/utils/pdfGenerator";
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

  const exportToPDFFile = () => {
    try {
      generatePDF(ficha);
      toast({
        title: "PDF Exportado",
        description: `Arquivo PDF da FTC ${ficha.numeroFTC} baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar PDF",
        description: "Não foi possível exportar o PDF. Tente novamente.",
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
    const subject = `Ficha Técnica de Cotação - ${ficha.resumo.cliente} - FTC ${ficha.numeroFTC}`;
    
    // Import the HTML generator
    import('@/utils/htmlGenerator').then(({ generateHTMLContent }) => {
      const htmlContent = generateHTMLContent(ficha);
      
      const mailtoLink = `mailto:${ficha.formData.fone_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(htmlContent)}`;
      window.open(mailtoLink);
      
      toast({
        title: "Email aberto",
        description: "Cliente de email aberto com HTML completo da ficha técnica!",
      });
    }).catch(() => {
      // Fallback to basic email if import fails
      const valorTotal = ficha.calculos.materialTodasPecas;
      const body = `Prezado(a),

Segue informações da Ficha Técnica de Cotação:

FTC: ${ficha.numeroFTC}
Cliente: ${ficha.resumo.cliente}
Solicitante: ${ficha.formData.solicitante || 'Não informado'}
Serviço: ${ficha.resumo.servico}
Valor Total Material: R$ ${valorTotal.toFixed(2)}
Horas Totais: ${ficha.calculos.horasTodasPecas.toFixed(1)}h

Atenciosamente,
Equipe HMC`;
      
      const mailtoLink = `mailto:${ficha.formData.fone_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      toast({
        title: "Email aberto",
        description: "Cliente de email aberto com os dados da ficha.",
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
        onClick={(e) => { e.stopPropagation(); exportToPDFFile(); }} 
        variant="outline" 
        size="sm"
        className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
      >
        <Download className="h-3 w-3" />
        PDF
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