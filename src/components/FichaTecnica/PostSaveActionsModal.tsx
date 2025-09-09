import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Search, CheckCircle2, Eye, Paperclip, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FormData, Material, Foto, FichaSalva, Calculos } from "@/types/ficha-tecnica";
import { generatePDF, generatePDFBlob } from "@/utils/pdfGenerator";
import { calculateTotals, formatCurrency } from "@/utils/calculations";
import { getCurrentDate } from "@/utils/helpers";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();


  // Create temporary FichaSalva object for export compatibility
  const createTempFicha = (): FichaSalva => {
    const calculos = calculateTotals(materiais, formData);
    const currentDate = getCurrentDate();
    const tempFTCNumber = `${new Date().getFullYear()}${Date.now().toString().slice(-3)}`;
    
    return {
      id: 'temp-' + Date.now(),
      numeroFTC: tempFTCNumber,
      dataCriacao: currentDate,
      dataUltimaEdicao: currentDate,
      status: 'rascunho',
      formData: formData,
      materiais: materiais,
      fotos: fotos,
      calculos: calculos,
      resumo: {
        cliente: formData.cliente,
        servico: formData.servico,
        quantidade: formData.quantidade,
        valorTotal: calculos.materialTodasPecas
      }
    };
  };


  const previewPDF = async () => {
    try {
      const tempFicha = createTempFicha();
      const pdfBlob = await generatePDFBlob(tempFicha);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const newWindow = window.open(pdfUrl, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          URL.revokeObjectURL(pdfUrl);
        };
        toast({
          title: "PDF Aberto",
          description: "Visualização do PDF aberta em nova aba!",
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
    onOpenChange(false);
  };


  const sendWhatsAppWithPDF = async () => {
    const tempFicha = createTempFicha();
    
    try {
      toast({
        title: "Gerando link...",
        description: "Criando PDF e gerando link de compartilhamento...",
      });

      const pdfLink = await uploadPDFAndGetLink(tempFicha);
      if (!pdfLink) {
        throw new Error('Não foi possível gerar o link do PDF');
      }

      const calculos = calculateTotals(materiais, formData);
      const message = `🔧 *Ficha Técnica de Cotação*\n\n` +
        `📋 *FTC:* ${tempFicha.numeroFTC}\n` +
        `👤 *Cliente:* ${formData.cliente}\n` +
        `⚙️ *Serviço:* ${formData.servico}\n` +
        `💰 *Valor Total:* R$ ${calculos.materialTodasPecas.toFixed(2)}\n` +
        `📅 *Data:* ${getCurrentDate()}\n\n` +
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
    
    onOpenChange(false);
  };


  const sendEmailWithPDF = async () => {
    const email = prompt('Digite o email de destino:');
    if (!email) return;
    
    const tempFicha = createTempFicha();
    
    try {
      toast({
        title: "Enviando email...",
        description: "Gerando PDF e enviando por email. Aguarde...",
      });

      const response = await supabase.functions.invoke('send-email-with-pdf', {
        body: {
          ficha: tempFicha,
          to: email,
          subject: `Ficha Técnica - ${tempFicha.numeroFTC}`
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
    
    onOpenChange(false);
  };

  const uploadPDFAndGetLink = async (tempFicha: FichaSalva): Promise<string | null> => {
    try {
      const pdfBlob = await generatePDFBlob(tempFicha);
      const fileName = `ficha-${tempFicha.numeroFTC}-${Date.now()}.pdf`;
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

  const consultarFichas = () => {
    navigate('/consultar-fichas');
    toast({
      title: "Navegando para Consultas",
      description: "Redirecionando para a página de consulta de fichas.",
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
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={previewPDF} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800">
                <Eye className="h-4 w-4" />
                Visualizar PDF
              </Button>
            </div>
          </div>

          {/* Compartilhar Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Compartilhar</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={sendEmailWithPDF} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800">
                <Paperclip className="h-4 w-4" />
                E-mail + PDF
              </Button>
              <Button onClick={sendWhatsAppWithPDF} className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800">
                <Link className="h-4 w-4" />
                WA + PDF
              </Button>
            </div>
          </div>

          {/* Outras Ações Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Outras Ações</h4>
            <div className="grid grid-cols-1 gap-2">
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