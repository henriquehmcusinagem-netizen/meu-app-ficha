import { Button } from "@/components/ui/button";
import { Download, Paperclip, Link, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/types/ficha-tecnica";
import { downloadHTML, openHTMLInNewWindow, generateHTMLContent } from "@/utils/htmlGenerator";
import { getAppBaseUrl } from "@/utils/helpers";
import { supabase } from "@/integrations/supabase/client";

interface ConsultaActionButtonsProps {
  ficha: FichaSalva;
}

export function ConsultaActionButtons({ ficha }: ConsultaActionButtonsProps) {
  const { toast } = useToast();




  const exportToHTML = () => {
    try {
      downloadHTML(ficha);
      toast({
        title: "HTML Exportado!",
        description: `Arquivo HTML da FTC ${ficha.numeroFTC} baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o arquivo HTML.",
        variant: "destructive"
      });
    }
  };

  const viewHTML = () => {
    try {
      openHTMLInNewWindow(ficha);
      toast({
        title: "Visualização HTML",
        description: "Ficha aberta em nova aba.",
      });
    } catch (error) {
      toast({
        title: "Erro ao visualizar",
        description: "Não foi possível abrir a visualização HTML.",
        variant: "destructive"
      });
    }
  };


  const uploadHTMLAndGetLink = async (): Promise<string | null> => {
    try {
      const htmlContent = await generateHTMLContent(ficha);
      const fileName = `ficha-${ficha.numeroFTC}-${Date.now()}.html`;
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
    try {
      toast({
        title: "Gerando link...",
        description: "Criando HTML e gerando link de compartilhamento...",
      });

      const htmlLink = await uploadHTMLAndGetLink();
      if (!htmlLink) {
        throw new Error('Não foi possível gerar o link do HTML');
      }

      const valorTotal = ficha.calculos.materialTodasPecas;

      // Formatar horas dos equipamentos
      const horasEquipamentos = [];
      if (ficha.formData.torno_grande && parseFloat(ficha.formData.torno_grande) > 0) {
        horasEquipamentos.push(`${ficha.formData.torno_grande}h Torno Grande`);
      }
      if (ficha.formData.torno_pequeno && parseFloat(ficha.formData.torno_pequeno) > 0) {
        horasEquipamentos.push(`${ficha.formData.torno_pequeno}h Torno Pequeno`);
      }
      if (ficha.formData.fresa_furad && parseFloat(ficha.formData.fresa_furad) > 0) {
        horasEquipamentos.push(`${ficha.formData.fresa_furad}h Fresa/Furad`);
      }
      if (ficha.formData.macarico_solda && parseFloat(ficha.formData.macarico_solda) > 0) {
        horasEquipamentos.push(`${ficha.formData.macarico_solda}h Maçarico/Solda`);
      }

      const horasDetalhadas = horasEquipamentos.length > 0
        ? ` (${horasEquipamentos.join(', ')})`
        : '';

      const message = `🔧 *Ficha Técnica de Cotação*\n\n` +
        `📋 *FTC:* ${ficha.numeroFTC}\n` +
        `👤 *Cliente:* ${ficha.resumo.cliente}\n` +
        `⚙️ *Serviço:* ${ficha.resumo.servico || ficha.formData.nome_peca || '—'}\n` +
        `⏱️ *Total Horas:* ${ficha.calculos.horasTodasPecas}h${horasDetalhadas}\n` +
        `💰 *Valor Total:* R$ ${valorTotal.toFixed(2)}\n` +
        `📅 *Data:* ${ficha.dataCriacao}\n\n` +
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
  };


  const sendEmailWithHTML = async () => {
    try {
      toast({
        title: "Preparando email...",
        description: "Gerando HTML e preparando email...",
      });

      const htmlLink = await uploadHTMLAndGetLink();
      if (!htmlLink) {
        throw new Error('Não foi possível gerar o link do HTML');
      }

      const valorTotal = ficha.calculos.materialTodasPecas;

      // Formatar horas dos equipamentos para email
      const horasEquipamentos = [];
      if (ficha.formData.torno_grande && parseFloat(ficha.formData.torno_grande) > 0) {
        horasEquipamentos.push(`${ficha.formData.torno_grande}h Torno Grande`);
      }
      if (ficha.formData.torno_pequeno && parseFloat(ficha.formData.torno_pequeno) > 0) {
        horasEquipamentos.push(`${ficha.formData.torno_pequeno}h Torno Pequeno`);
      }
      if (ficha.formData.fresa_furad && parseFloat(ficha.formData.fresa_furad) > 0) {
        horasEquipamentos.push(`${ficha.formData.fresa_furad}h Fresa/Furad`);
      }
      if (ficha.formData.macarico_solda && parseFloat(ficha.formData.macarico_solda) > 0) {
        horasEquipamentos.push(`${ficha.formData.macarico_solda}h Maçarico/Solda`);
      }

      const horasDetalhadas = horasEquipamentos.length > 0
        ? ` (${horasEquipamentos.join(', ')})`
        : '';

      const subject = `Ficha Técnica - ${ficha.numeroFTC}`;
      const body = `Prezado(a),

Segue em anexo a Ficha Técnica de Cotação:

📋 FTC: ${ficha.numeroFTC}
👤 Cliente: ${ficha.resumo.cliente}
⚙️ Serviço: ${ficha.resumo.servico || ficha.formData.nome_peca || '—'}
⏱️ Total Horas: ${ficha.calculos.horasTodasPecas}h${horasDetalhadas}
💰 Valor Total: R$ ${valorTotal.toFixed(2)}
📅 Data: ${ficha.dataCriacao}

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
  };



  return (
    <div className="flex gap-0.5">
      <Button
        type="button"
        onClick={(e) => { e.stopPropagation(); viewHTML(); }}
        variant="outline"
        size="sm"
        className="h-6 w-6 p-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
        title="Visualizar HTML"
      >
        <FileText className="h-2.5 w-2.5" />
      </Button>

      <Button
        type="button"
        onClick={(e) => { e.stopPropagation(); exportToHTML(); }}
        variant="outline"
        size="sm"
        className="h-6 w-6 p-0 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
        title="Baixar HTML"
      >
        <Download className="h-2.5 w-2.5" />
      </Button>


      <Button
        type="button"
        onClick={(e) => { e.stopPropagation(); sendEmailWithHTML(); }}
        size="sm"
        className="h-6 w-6 p-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
        title="Email com HTML"
      >
        <Paperclip className="h-2.5 w-2.5" />
      </Button>

      <Button
        type="button"
        onClick={(e) => { e.stopPropagation(); sendWhatsAppWithHTML(); }}
        size="sm"
        className="h-6 w-6 p-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
        title="WhatsApp com HTML"
      >
        <Link className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}