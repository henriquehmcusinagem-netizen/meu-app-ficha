import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Printer, Mail, MessageCircle, Search, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FormData, Material, Foto, FichaSalva, Calculos } from "@/types/ficha-tecnica";
import { exportToHTML } from "@/utils/htmlExporter";
import { calculateTotals, formatCurrency } from "@/utils/calculations";
import { getCurrentDate } from "@/utils/helpers";

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

  const exportToHTMLFile = () => {
    try {
      const tempFicha = createTempFicha();
      exportToHTML(tempFicha);
      
      toast({
        title: "HTML Exportado",
        description: "Download do arquivo HTML iniciado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível gerar o arquivo HTML.",
        variant: "destructive"
      });
    }
    onOpenChange(false);
  };

  const sendWhatsApp = () => {
    const calculos = calculateTotals(materiais, formData);
    const tempFTCNumber = `${new Date().getFullYear()}${Date.now().toString().slice(-3)}`;
    
    const totalMaterial = formatCurrency(calculos.materialTodasPecas);
    const totalHoras = calculos.horasTodasPecas.toFixed(1);
    
    const message = `🔧 *FICHA TÉCNICA DE COTAÇÃO*

📋 *FTC:* ${tempFTCNumber}
📅 *Data:* ${getCurrentDate()}

👥 *CLIENTE*
• Cliente: ${formData.cliente}
• Solicitante: ${formData.solicitante}
• Contato: ${formData.fone_email}

🔩 *PEÇA/EQUIPAMENTO*
• Nome: ${formData.nome_peca}
• Quantidade: ${formData.quantidade}
• Serviço: ${formData.servico}

📊 *RESUMO FINANCEIRO*
💰 Material Total: ${totalMaterial}
⏰ Horas Total: ${totalHoras}h

📋 *MATERIAIS PRINCIPAIS*
${materiais.filter(m => m.descricao && (parseFloat(m.quantidade) > 0 || parseFloat(m.valor_unitario || '0') > 0))
  .slice(0, 5)
  .map(material => 
    `• ${material.descricao} - Qtd: ${material.quantidade} ${material.unidade} - ${formatCurrency(parseFloat(material.valor_total || '0'))}`
  ).join('\n')}${materiais.length > 5 ? '\n• ... e mais materiais' : ''}

${formData.observacoes ? `📝 *Observações:* ${formData.observacoes}` : ''}

---
Ficha técnica gerada automaticamente`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    toast({
      title: "WhatsApp Aberto",
      description: "Mensagem preparada para envio!",
    });
    onOpenChange(false);
  };

  const sendEmail = () => {
    const calculos = calculateTotals(materiais, formData);
    const tempFTCNumber = `${new Date().getFullYear()}${Date.now().toString().slice(-3)}`;
    
    const subject = `Ficha Técnica de Cotação - ${formData.cliente}`;
    
    const body = `FICHA TÉCNICA DE COTAÇÃO

FTC: ${tempFTCNumber}
Data: ${getCurrentDate()}

=== DADOS DO CLIENTE ===
Cliente: ${formData.cliente}
Solicitante: ${formData.solicitante}
Contato: ${formData.fone_email}

=== DADOS DA PEÇA/EQUIPAMENTO ===
Nome da Peça: ${formData.nome_peca}
Quantidade: ${formData.quantidade}
Serviço: ${formData.servico}

=== RESUMO FINANCEIRO ===
Material Total: ${formatCurrency(calculos.materialTodasPecas)}
Horas Totais: ${calculos.horasTodasPecas.toFixed(1)}h

=== MATERIAIS ===
${materiais
  .filter(m => m.descricao && (parseFloat(m.quantidade) > 0 || parseFloat(m.valor_unitario || '0') > 0))
  .map(material => 
    `${material.descricao} - Qtd: ${material.quantidade} ${material.unidade} - Unit: ${formatCurrency(parseFloat(material.valor_unitario || '0'))} - Total: ${formatCurrency(parseFloat(material.valor_total || '0'))}`
  ).join('\n')}

${formData.observacoes ? `=== OBSERVAÇÕES ===\n${formData.observacoes}\n` : ''}

---
Ficha técnica gerada automaticamente`;
    
    const mailtoLink = `mailto:${formData.fone_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    toast({
      title: "E-mail Aberto",
      description: "Cliente de e-mail aberto com os dados preenchidos!",
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