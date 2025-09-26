import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Search, CheckCircle2, Download, Paperclip, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FormData, Material, Foto, FichaSalva, Calculos } from "@/types/ficha-tecnica";
import { generatePDF, generatePDFBlob } from "@/utils/pdfGenerator";
import { generateHTMLContent } from "@/utils/htmlGenerator";
import { calculateTotals, formatCurrency } from "@/utils/calculations";
import { getCurrentDate, getAppBaseUrl } from "@/utils/helpers";
import { supabase } from "@/integrations/supabase/client";

interface PostSaveActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  materiais: Material[];
  fotos: Foto[];
  numeroFTC?: string;
  dataAtual?: string;
}

export function PostSaveActionsModal({
  open,
  onOpenChange,
  formData,
  materiais,
  fotos,
  numeroFTC,
  dataAtual
}: PostSaveActionsModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();


  // Create temporary FichaSalva object for export compatibility
  const createTempFicha = (): FichaSalva => {
    const calculos = calculateTotals(materiais, formData);
    const currentDate = dataAtual || getCurrentDate();
    // Use real FTC number if available, otherwise create temporary one
    const realFTCNumber = numeroFTC && !numeroFTC.startsWith('DRAFT')
      ? numeroFTC
      : `${new Date().getFullYear()}${Date.now().toString().slice(-3)}`;

    console.log('📋 PostSaveActionsModal - createTempFicha:', {
      numeroFTCRecebido: numeroFTC,
      numeroFTCFinal: realFTCNumber,
      isDraft: numeroFTC?.startsWith('DRAFT')
    });

    return {
      id: 'temp-' + Date.now(),
      numeroFTC: realFTCNumber,
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


  const exportToPDFFile = () => {
    try {
      const tempFicha = createTempFicha();
      generatePDF(tempFicha);
      
      toast({
        title: "PDF Exportado",
        description: "Download do arquivo PDF iniciado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível gerar o arquivo PDF.",
        variant: "destructive"
      });
    }
    onOpenChange(false);
  };


  const uploadHTMLAndGetLink = async (tempFicha: FichaSalva): Promise<string | null> => {
    try {
      const htmlContent = generateHTMLContent(tempFicha);
      const fileName = `ficha-${tempFicha.numeroFTC}-${Date.now()}.html`;
      const filePath = `temp/${fileName}`;

      const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });

      const { data, error } = await supabase.storage
        .from('ficha-fotos')
        .upload(filePath, htmlBlob, {
          contentType: 'text/html',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Retorna URL do visualizador interno ao invés do link direto
      // Simplifica o path para compatibilidade com WhatsApp
      const simplePath = filePath.replace('temp/', '');
      const viewerUrl = `${getAppBaseUrl()}/view-html/${encodeURIComponent('temp/' + simplePath)}`;
      return viewerUrl;
    } catch (error) {
      return null;
    }
  };

  const sendWhatsAppWithHTML = async () => {
    const tempFicha = createTempFicha();

    try {
      toast({
        title: "Gerando link...",
        description: "Criando HTML e gerando link de compartilhamento...",
      });

      const htmlLink = await uploadHTMLAndGetLink(tempFicha);
      if (!htmlLink) {
        throw new Error('Não foi possível gerar o link do HTML');
      }

      const calculos = calculateTotals(materiais, formData);

      // Formatar horas dos equipamentos
      const horasEquipamentos = [];
      if (formData.torno_grande && parseFloat(formData.torno_grande) > 0) {
        horasEquipamentos.push(`${formData.torno_grande}h Torno Grande`);
      }
      if (formData.torno_pequeno && parseFloat(formData.torno_pequeno) > 0) {
        horasEquipamentos.push(`${formData.torno_pequeno}h Torno Pequeno`);
      }
      if (formData.fresa_furad && parseFloat(formData.fresa_furad) > 0) {
        horasEquipamentos.push(`${formData.fresa_furad}h Fresa/Furad`);
      }
      if (formData.macarico_solda && parseFloat(formData.macarico_solda) > 0) {
        horasEquipamentos.push(`${formData.macarico_solda}h Maçarico/Solda`);
      }

      const horasDetalhadas = horasEquipamentos.length > 0
        ? ` (${horasEquipamentos.join(', ')})`
        : '';

      const message = `🔧 *Ficha Técnica de Cotação*\n\n` +
        `📋 *FTC:* ${tempFicha.numeroFTC}\n` +
        `👤 *Cliente:* ${formData.cliente}\n` +
        `⚙️ *Serviço:* ${formData.servico || formData.nome_peca || '—'}\n` +
        `⏱️ *Total Horas:* ${calculos.horasTodasPecas}h${horasDetalhadas}\n` +
        `💰 *Valor Total:* R$ ${calculos.materialTodasPecas.toFixed(2)}\n` +
        `📅 *Data:* ${getCurrentDate()}\n\n` +
        `📄 *Visualizar Ficha Completa:*\n${htmlLink}\n\n` +
        `_Clique no link acima para ver a ficha técnica completa._`;

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');

      toast({
        title: "Link gerado!",
        description: "HTML salvo e link copiado para WhatsApp.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível criar o link do HTML.",
        variant: "destructive",
      });
    }

    onOpenChange(false);
  };


  const sendEmailWithHTML = async () => {
    const tempFicha = createTempFicha();

    try {
      toast({
        title: "Preparando email...",
        description: "Gerando HTML e preparando email...",
      });

      const htmlLink = await uploadHTMLAndGetLink(tempFicha);
      if (!htmlLink) {
        throw new Error('Não foi possível gerar o link do HTML');
      }

      const valorTotal = tempFicha.calculos.materialTodasPecas;
      const calculos = calculateTotals(materiais, formData);

      // Formatar horas dos equipamentos para email
      const horasEquipamentos = [];
      if (formData.torno_grande && parseFloat(formData.torno_grande) > 0) {
        horasEquipamentos.push(`${formData.torno_grande}h Torno Grande`);
      }
      if (formData.torno_pequeno && parseFloat(formData.torno_pequeno) > 0) {
        horasEquipamentos.push(`${formData.torno_pequeno}h Torno Pequeno`);
      }
      if (formData.fresa_furad && parseFloat(formData.fresa_furad) > 0) {
        horasEquipamentos.push(`${formData.fresa_furad}h Fresa/Furad`);
      }
      if (formData.macarico_solda && parseFloat(formData.macarico_solda) > 0) {
        horasEquipamentos.push(`${formData.macarico_solda}h Maçarico/Solda`);
      }

      const horasDetalhadas = horasEquipamentos.length > 0
        ? ` (${horasEquipamentos.join(', ')})`
        : '';

      const subject = `Ficha Técnica - ${tempFicha.numeroFTC}`;
      const body = `Prezado(a),

Segue em anexo a Ficha Técnica de Cotação:

📋 FTC: ${tempFicha.numeroFTC}
👤 Cliente: ${formData.cliente}
⚙️ Serviço: ${formData.servico || formData.nome_peca || '—'}
⏱️ Total Horas: ${calculos.horasTodasPecas}h${horasDetalhadas}
💰 Valor Total: R$ ${valorTotal.toFixed(2)}
📅 Data: ${getCurrentDate()}

📄 Link para o HTML: ${htmlLink}

Atenciosamente,
Equipe Técnica`;

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      toast({
        title: "Email preparado!",
        description: "HTML salvo e link incluído no email.",
      });
    } catch (error) {
      toast({
        title: "Erro ao preparar email",
        description: "Não foi possível preparar o email com HTML.",
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
    console.log('🚨 NAVEGAÇÃO DETECTADA: PostSaveActionsModal -> consultarFichas()');
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
              <Button onClick={exportToPDFFile} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800">
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Compartilhar Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Compartilhar</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={sendEmailWithHTML} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800">
                <Paperclip className="h-4 w-4" />
                E-mail + HTML
              </Button>
              <Button onClick={sendWhatsAppWithHTML} className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800">
                <Link className="h-4 w-4" />
                WA + HTML
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