import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Printer, Mail, MessageCircle, Search, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FormData, Material, FichaSalva } from "@/types/ficha-tecnica";
import { exportToHTML } from "@/utils/htmlExporter";
import { calculateTotals } from "@/utils/calculations";
import { getCurrentDate } from "@/utils/helpers";

interface PostSaveActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  materiais: Material[];
}

export function PostSaveActionsModal({ 
  open, 
  onOpenChange, 
  formData, 
  materiais 
}: PostSaveActionsModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();


  // Create temporary FichaSalva object for consistent exports
  const createTempFicha = (): FichaSalva => {
    const calculos = calculateTotals(materiais, formData);
    return {
      id: 'temp',
      numeroFTC: 'temp-' + Date.now(),
      dataCriacao: getCurrentDate(),
      dataUltimaEdicao: getCurrentDate(),
      status: 'rascunho',
      formData,
      materiais,
      fotos: [],
      calculos,
      resumo: {
        cliente: formData.cliente,
        servico: formData.servico,
        quantidade: formData.quantidade,
        valorTotal: calculos.materialTodasPecas
      }
    };
  };

  const exportToHTMLFile = () => {
    try {
      const tempFicha = createTempFicha();
      exportToHTML(tempFicha);
      toast({
        title: "HTML Exportado",
        description: `Arquivo HTML da ficha baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar HTML",
        description: "Não foi possível exportar o HTML. Tente novamente.",
        variant: "destructive",
      });
    }
    onOpenChange(false);
  };

  const sendWhatsApp = () => {
    const tempFicha = createTempFicha();
    const valorTotal = tempFicha.calculos.materialTodasPecas;
    const message = `🔧 *Ficha Técnica de Cotação*\n\n` +
      `📋 *FTC:* ${tempFicha.numeroFTC}\n` +
      `👤 *Cliente:* ${tempFicha.resumo.cliente}\n` +
      `⚙️ *Serviço:* ${tempFicha.resumo.servico}\n` +
      `💰 *Valor Total Material:* R$ ${valorTotal.toFixed(2)}\n` +
      `📅 *Data:* ${tempFicha.dataCriacao}\n\n` +
      `_Gerado pelo sistema HMC_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    toast({
      title: "WhatsApp aberto",
      description: "Mensagem preparada para envio.",
    });
    onOpenChange(false);
  };

  const sendEmail = () => {
    const tempFicha = createTempFicha();
    const valorTotal = tempFicha.calculos.materialTodasPecas;
    const subject = `Ficha Técnica de Cotação - ${tempFicha.resumo.cliente} - FTC ${tempFicha.numeroFTC}`;
    const body = `Prezado(a),\n\n` +
      `Segue informações da Ficha Técnica de Cotação:\n\n` +
      `FTC: ${tempFicha.numeroFTC}\n` +
      `Cliente: ${tempFicha.resumo.cliente}\n` +
      `Solicitante: ${tempFicha.formData.solicitante || 'Não informado'}\n` +
      `Serviço: ${tempFicha.resumo.servico}\n` +
      `Peça/Equipamento: ${tempFicha.formData.nome_peca || 'Não informado'}\n` +
      `Quantidade: ${tempFicha.formData.quantidade || '1'}\n` +
      `Valor Total Material: R$ ${valorTotal.toFixed(2)}\n` +
      `Horas Totais: ${tempFicha.calculos.horasTodasPecas.toFixed(1)}h\n` +
      `Data de Criação: ${tempFicha.dataCriacao}\n\n` +
      `Atenciosamente,\n` +
      `Equipe HMC`;
    
    const mailtoLink = `mailto:${tempFicha.formData.fone_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    toast({
      title: "Email aberto",
      description: "Cliente de email padrão aberto com os dados da ficha.",
    });
    onOpenChange(false);
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
              <Button onClick={exportToHTMLFile} variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                HTML
              </Button>
            </div>
          </div>

          {/* Compartilhar Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Compartilhar</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={sendWhatsApp} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button onClick={sendEmail} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800">
                <Mail className="h-4 w-4" />
                E-mail
              </Button>
            </div>
          </div>

          {/* Outras Ações Seção */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Outras Ações</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
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