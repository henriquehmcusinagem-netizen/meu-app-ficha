import { Button } from "@/components/ui/button";
import { Download, Paperclip, Link, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FichaSalva } from "@/types/ficha-tecnica";
import { downloadHTML, openHTMLInNewWindow, generateHTMLContent } from "@/utils/htmlGenerator";
import { getAppBaseUrl } from "@/utils/helpers";
import { supabase } from "@/integrations/supabase/client";
import { calculateTotals } from "@/utils/calculations";
import { getCurrentDate } from "@/utils/helpers";

interface ShareActionsProps {
  ficha: FichaSalva;
  variant?: 'compact' | 'full';
  showLabels?: boolean;
}

export function ShareActions({ ficha, variant = 'compact', showLabels = false }: ShareActionsProps) {
  const { toast } = useToast();

  const uploadHTMLAndGetLink = async (): Promise<string | null> => {
    try {
      const htmlContent = generateHTMLContent(ficha);
      const fileName = `ficha-${ficha.numeroFTC}-${Date.now()}.html`;
      const filePath = `temp/${fileName}`;

      const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });

      const { data, error } = await supabase.storage
        .from('ficha-fotos')
        .upload(filePath, htmlBlob, {
          contentType: 'text/html',
          upsert: true
        });

      if (error) throw error;

      const viewerUrl = `${getAppBaseUrl()}/view-html/${encodeURIComponent(filePath)}`;
      return viewerUrl;
    } catch (error) {
      return null;
    }
  };

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

      const horasEquipamentos = [];
      if (ficha.formData.torno_grande && parseFloat(ficha.formData.torno_grande) > 0) {
        horasEquipamentos.push(`Torno Grande ${ficha.formData.torno_grande}h`);
      }
      if (ficha.formData.torno_pequeno && parseFloat(ficha.formData.torno_pequeno) > 0) {
        horasEquipamentos.push(`Torno Pequeno ${ficha.formData.torno_pequeno}h`);
      }
      if (ficha.formData.cnc_tf && parseFloat(ficha.formData.cnc_tf) > 0) {
        horasEquipamentos.push(`CNC/TF ${ficha.formData.cnc_tf}h`);
      }
      if (ficha.formData.fresa_furad && parseFloat(ficha.formData.fresa_furad) > 0) {
        horasEquipamentos.push(`Fresa/Furad ${ficha.formData.fresa_furad}h`);
      }
      if (ficha.formData.plasma_oxicorte && parseFloat(ficha.formData.plasma_oxicorte) > 0) {
        horasEquipamentos.push(`Plasma/Oxicorte ${ficha.formData.plasma_oxicorte}h`);
      }
      if (ficha.formData.dobra && parseFloat(ficha.formData.dobra) > 0) {
        horasEquipamentos.push(`Dobra ${ficha.formData.dobra}h`);
      }
      if (ficha.formData.calandra && parseFloat(ficha.formData.calandra) > 0) {
        horasEquipamentos.push(`Calandra ${ficha.formData.calandra}h`);
      }
      if (ficha.formData.macarico_solda && parseFloat(ficha.formData.macarico_solda) > 0) {
        horasEquipamentos.push(`Maçarico/Solda ${ficha.formData.macarico_solda}h`);
      }
      if (ficha.formData.des_montg && parseFloat(ficha.formData.des_montg) > 0) {
        horasEquipamentos.push(`Des/Montagem ${ficha.formData.des_montg}h`);
      }
      if (ficha.formData.balanceamento && parseFloat(ficha.formData.balanceamento) > 0) {
        horasEquipamentos.push(`Balanceamento ${ficha.formData.balanceamento}h`);
      }
      if (ficha.formData.mandrilhamento && parseFloat(ficha.formData.mandrilhamento) > 0) {
        horasEquipamentos.push(`Mandrilhamento ${ficha.formData.mandrilhamento}h`);
      }
      if (ficha.formData.tratamento && parseFloat(ficha.formData.tratamento) > 0) {
        horasEquipamentos.push(`Tratamento ${ficha.formData.tratamento}h`);
      }
      if (ficha.formData.pintura_horas && parseFloat(ficha.formData.pintura_horas) > 0) {
        horasEquipamentos.push(`Pintura ${ficha.formData.pintura_horas}h`);
      }
      if (ficha.formData.lavagem_acab && parseFloat(ficha.formData.lavagem_acab) > 0) {
        horasEquipamentos.push(`Lavagem/Acab ${ficha.formData.lavagem_acab}h`);
      }
      if (ficha.formData.programacao_cam && parseFloat(ficha.formData.programacao_cam) > 0) {
        horasEquipamentos.push(`Prog. CAM ${ficha.formData.programacao_cam}h`);
      }
      if (ficha.formData.eng_tec && parseFloat(ficha.formData.eng_tec) > 0) {
        horasEquipamentos.push(`Eng. Técnica ${ficha.formData.eng_tec}h`);
      }

      const horasDetalhadas = horasEquipamentos.length > 0
        ? ` (${horasEquipamentos.join(', ')})`
        : '';

      // Formatar data para formato brasileiro
      const dataFormatada = new Date(ficha.dataCriacao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const valorTotal = ficha.calculos.materialTodasPecas;
      const message = `🔧 *Ficha Técnica de Cotação*\n\n` +
        `📋 *FTC:* ${ficha.numeroFTC}\n` +
        `👤 *Cliente:* ${ficha.resumo.cliente}\n` +
        `⚙️ *Serviço:* ${ficha.resumo.servico || ficha.formData.nome_peca || '—'}\n` +
        `⏱️ *Total Horas:* ${ficha.calculos.horasTodasPecas}h${horasDetalhadas}\n` +
        `💰 *Valor Total:* R$ ${valorTotal.toFixed(2)}\n` +
        `📅 *Data:* ${dataFormatada}\n\n` +
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

      const horasEquipamentos = [];
      if (ficha.formData.torno_grande && parseFloat(ficha.formData.torno_grande) > 0) {
        horasEquipamentos.push(`Torno Grande ${ficha.formData.torno_grande}h`);
      }
      if (ficha.formData.torno_pequeno && parseFloat(ficha.formData.torno_pequeno) > 0) {
        horasEquipamentos.push(`Torno Pequeno ${ficha.formData.torno_pequeno}h`);
      }
      if (ficha.formData.cnc_tf && parseFloat(ficha.formData.cnc_tf) > 0) {
        horasEquipamentos.push(`CNC/TF ${ficha.formData.cnc_tf}h`);
      }
      if (ficha.formData.fresa_furad && parseFloat(ficha.formData.fresa_furad) > 0) {
        horasEquipamentos.push(`Fresa/Furad ${ficha.formData.fresa_furad}h`);
      }
      if (ficha.formData.plasma_oxicorte && parseFloat(ficha.formData.plasma_oxicorte) > 0) {
        horasEquipamentos.push(`Plasma/Oxicorte ${ficha.formData.plasma_oxicorte}h`);
      }
      if (ficha.formData.dobra && parseFloat(ficha.formData.dobra) > 0) {
        horasEquipamentos.push(`Dobra ${ficha.formData.dobra}h`);
      }
      if (ficha.formData.calandra && parseFloat(ficha.formData.calandra) > 0) {
        horasEquipamentos.push(`Calandra ${ficha.formData.calandra}h`);
      }
      if (ficha.formData.macarico_solda && parseFloat(ficha.formData.macarico_solda) > 0) {
        horasEquipamentos.push(`Maçarico/Solda ${ficha.formData.macarico_solda}h`);
      }
      if (ficha.formData.des_montg && parseFloat(ficha.formData.des_montg) > 0) {
        horasEquipamentos.push(`Des/Montagem ${ficha.formData.des_montg}h`);
      }
      if (ficha.formData.balanceamento && parseFloat(ficha.formData.balanceamento) > 0) {
        horasEquipamentos.push(`Balanceamento ${ficha.formData.balanceamento}h`);
      }
      if (ficha.formData.mandrilhamento && parseFloat(ficha.formData.mandrilhamento) > 0) {
        horasEquipamentos.push(`Mandrilhamento ${ficha.formData.mandrilhamento}h`);
      }
      if (ficha.formData.tratamento && parseFloat(ficha.formData.tratamento) > 0) {
        horasEquipamentos.push(`Tratamento ${ficha.formData.tratamento}h`);
      }
      if (ficha.formData.pintura_horas && parseFloat(ficha.formData.pintura_horas) > 0) {
        horasEquipamentos.push(`Pintura ${ficha.formData.pintura_horas}h`);
      }
      if (ficha.formData.lavagem_acab && parseFloat(ficha.formData.lavagem_acab) > 0) {
        horasEquipamentos.push(`Lavagem/Acab ${ficha.formData.lavagem_acab}h`);
      }
      if (ficha.formData.programacao_cam && parseFloat(ficha.formData.programacao_cam) > 0) {
        horasEquipamentos.push(`Prog. CAM ${ficha.formData.programacao_cam}h`);
      }
      if (ficha.formData.eng_tec && parseFloat(ficha.formData.eng_tec) > 0) {
        horasEquipamentos.push(`Eng. Técnica ${ficha.formData.eng_tec}h`);
      }

      const horasDetalhadas = horasEquipamentos.length > 0
        ? ` (${horasEquipamentos.join(', ')})`
        : '';

      // Formatar data para formato brasileiro
      const dataFormatada = new Date(ficha.dataCriacao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const valorTotal = ficha.calculos.materialTodasPecas;
      const subject = `Ficha Técnica - ${ficha.numeroFTC}`;
      const body = `Prezado(a),

Segue em anexo a Ficha Técnica de Cotação:

📋 FTC: ${ficha.numeroFTC}
👤 Cliente: ${ficha.resumo.cliente}
⚙️ Serviço: ${ficha.resumo.servico || ficha.formData.nome_peca || '—'}
⏱️ Total Horas: ${ficha.calculos.horasTodasPecas}h${horasDetalhadas}
💰 Valor Total: R$ ${valorTotal.toFixed(2)}
📅 Data: ${dataFormatada}

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

  if (variant === 'compact') {
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

  // Full variant para modals
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Exportar</h4>
        <Button onClick={exportToHTML} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
          <Download className="h-4 w-4" />
          {showLabels && "Baixar HTML"}
        </Button>
      </div>

      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Compartilhar</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={sendEmailWithHTML} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800">
            <Paperclip className="h-4 w-4" />
            {showLabels && "E-mail + HTML"}
          </Button>
          <Button onClick={sendWhatsAppWithHTML} className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800">
            <Link className="h-4 w-4" />
            {showLabels && "WhatsApp + HTML"}
          </Button>
        </div>
      </div>
    </div>
  );
}