import { Button } from "@/components/ui/button";
import { FileText, Printer, Mail, MessageCircle, Download, Paperclip, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/types/ficha-tecnica";
import { exportToHTML } from "@/utils/htmlExporter";
import { generatePDF, generatePDFBlob } from "@/utils/pdfGenerator";
import { ConsultaPrintLayout } from "./ConsultaPrintLayout";
import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";

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

  const sendWhatsAppWithPDF = async () => {
    try {
      toast({
        title: "Gerando link...",
        description: "Criando PDF e gerando link de compartilhamento...",
      });

      const pdfLink = await uploadPDFAndGetLink();
      if (!pdfLink) {
        throw new Error('Não foi possível gerar o link do PDF');
      }

      const valorTotal = ficha.calculos.materialTodasPecas;
      const message = `🔧 *Ficha Técnica de Cotação*\n\n` +
        `📋 *FTC:* ${ficha.numeroFTC}\n` +
        `👤 *Cliente:* ${ficha.resumo.cliente}\n` +
        `⚙️ *Serviço:* ${ficha.resumo.servico}\n` +
        `💰 *Valor Total:* R$ ${valorTotal.toFixed(2)}\n` +
        `📅 *Data:* ${ficha.dataCriacao}\n\n` +
        `📄 *PDF Completo:* ${pdfLink}\n\n` +
        `_Clique no link acima para visualizar/baixar o PDF completo._`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');

      toast({
        title: "Link gerado!",
        description: "PDF salvo e link copiado para WhatsApp.",
      });
    } catch (error) {
      console.error('Error creating WhatsApp link:', error);
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível criar o link do PDF.",
        variant: "destructive",
      });
    }
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

  const sendEmailWithPDF = async () => {
    const email = prompt('Digite o email de destino:');
    if (!email) return;
    
    try {
      toast({
        title: "Enviando email...",
        description: "Gerando PDF e enviando por email. Aguarde...",
      });

      const response = await supabase.functions.invoke('send-email-with-pdf', {
        body: {
          ficha: ficha,
          to: email,
          subject: `Ficha Técnica - ${ficha.numeroFTC}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Email enviado!",
        description: `PDF enviado com sucesso para ${email}`,
      });
    } catch (error) {
      console.error('Error sending email with PDF:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email com PDF.",
        variant: "destructive",
      });
    }
  };

  const uploadPDFAndGetLink = async (): Promise<string | null> => {
    try {
      const pdfBlob = await generatePDFBlob(ficha);
      const fileName = `ficha-${ficha.numeroFTC}-${Date.now()}.pdf`;
      const filePath = `temp/${fileName}`;

      const { data, error } = await supabase.storage
        .from('ficha-fotos')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ficha-fotos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
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
        onClick={(e) => { e.stopPropagation(); sendEmail(); }} 
        size="sm" 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
      >
        <Mail className="h-3 w-3" />
        Email
      </Button>

      <Button 
        onClick={(e) => { e.stopPropagation(); sendEmailWithPDF(); }} 
        size="sm" 
        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
      >
        <Paperclip className="h-3 w-3" />
        Email+PDF
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
        onClick={(e) => { e.stopPropagation(); sendWhatsAppWithPDF(); }} 
        size="sm" 
        className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
      >
        <Link className="h-3 w-3" />
        WA+PDF
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