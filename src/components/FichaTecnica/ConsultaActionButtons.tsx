import { Button } from "@/components/ui/button";
import { Eye, Paperclip, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/types/ficha-tecnica";
import { generatePDF, generatePDFBlob } from "@/utils/pdfGenerator";
import { supabase } from "@/integrations/supabase/client";

interface ConsultaActionButtonsProps {
  ficha: FichaSalva;
}

export function ConsultaActionButtons({ ficha }: ConsultaActionButtonsProps) {
  const { toast } = useToast();



  const previewPDF = async () => {
    try {
      const pdfBlob = await generatePDFBlob(ficha);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const newWindow = window.open(pdfUrl, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          URL.revokeObjectURL(pdfUrl);
        };
        toast({
          title: "PDF Aberto",
          description: `Visualização do PDF da ficha ${ficha.numeroFTC} aberta em nova aba!`,
        });
      } else {
        URL.revokeObjectURL(pdfUrl);
        toast({
          title: "Erro",
          description: "Não foi possível abrir o PDF. Verifique se o bloqueador de pop-ups está desabilitado.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao gerar preview do PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar visualização do PDF",
        variant: "destructive"
      });
    }
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


  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={(e) => { e.stopPropagation(); previewPDF(); }} 
        variant="outline" 
        size="sm"
        className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
      >
        <Eye className="h-3 w-3" />
        Visualizar PDF
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
        onClick={(e) => { e.stopPropagation(); sendWhatsAppWithPDF(); }} 
        size="sm" 
        className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
      >
        <Link className="h-3 w-3" />
        WA+PDF
      </Button>
    </div>
  );
}