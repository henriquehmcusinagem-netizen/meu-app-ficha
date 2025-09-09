import { Button } from "@/components/ui/button";
import { Download, Paperclip, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/types/ficha-tecnica";
import { generatePDF, generatePDFBlob } from "@/utils/pdfGenerator";
import { supabase } from "@/integrations/supabase/client";

interface ConsultaActionButtonsProps {
  ficha: FichaSalva;
}

export function ConsultaActionButtons({ ficha }: ConsultaActionButtonsProps) {
  const { toast } = useToast();



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
    try {
      toast({
        title: "Preparando email...",
        description: "Gerando PDF e preparando email...",
      });

      const pdfLink = await uploadPDFAndGetLink();
      if (!pdfLink) {
        throw new Error('Não foi possível gerar o link do PDF');
      }

      const valorTotal = ficha.calculos.materialTodasPecas;
      const subject = `Ficha Técnica - ${ficha.numeroFTC}`;
      const body = `Prezado(a),

Segue em anexo a Ficha Técnica de Cotação:

📋 FTC: ${ficha.numeroFTC}
👤 Cliente: ${ficha.resumo.cliente}
⚙️ Serviço: ${ficha.resumo.servico}
💰 Valor Total: R$ ${valorTotal.toFixed(2)}
📅 Data: ${ficha.dataCriacao}

📄 Link para o PDF: ${pdfLink}

Atenciosamente,
Equipe Técnica`;

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      toast({
        title: "Email preparado!",
        description: "Seu cliente de email foi aberto com o PDF anexado.",
      });
    } catch (error) {
      console.error('Error preparing email with PDF:', error);
      toast({
        title: "Erro ao preparar email",
        description: "Não foi possível preparar o email com PDF.",
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
        onClick={(e) => { e.stopPropagation(); exportToPDFFile(); }} 
        variant="outline" 
        size="sm"
        className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
      >
        <Download className="h-3 w-3" />
        PDF
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