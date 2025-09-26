import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Printer, Mail, MessageCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormData, Material, Foto, FichaSalva } from "@/types/ficha-tecnica";
import { downloadHTML, openHTMLInNewWindow } from "@/utils/htmlGenerator";

interface ActionButtonsProps {
  formData: FormData;
  materiais: Material[];
  fotos: Foto[];
  numeroFTC: string;
}

export function ActionButtons({
  formData,
  materiais,
  fotos,
  numeroFTC
}: ActionButtonsProps) {
  const { toast } = useToast();

  // Converter dados para formato FichaSalva
  const createFichaSalva = (): FichaSalva => ({
    id: '',
    numero_ftc: numeroFTC,
    status: 'rascunho',
    cliente: formData.cliente,
    solicitante: formData.solicitante,
    fone_email: formData.fone_email,
    servico: formData.servico,
    nome_peca: formData.nome_peca,
    quantidade: formData.quantidade,
    dimensoes: formData.dimensoes,
    material: formData.material,
    detalhes_servico: formData.detalhes_servico,
    possui_desenho_tecnico: formData.possui_desenho_tecnico,
    necessita_compra_material: formData.necessita_compra_material,
    tem_tratamento_termico: formData.tem_tratamento_termico,
    observacoes_gerais: formData.observacoes_gerais,
    num_orcamento: formData.num_orcamento,
    valor_orcamento: formData.valor_orcamento,
    materiais: materiais,
    fotos: fotos,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const exportToPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Funcionalidade será implementada com o backend.",
    });
  };

  const exportToHTML = () => {
    try {
      const ficha = createFichaSalva();
      downloadHTML(ficha);
      toast({
        title: "HTML Exportado!",
        description: "Arquivo HTML baixado com sucesso.",
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
      const ficha = createFichaSalva();
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

  const sendWhatsApp = () => {
    const message = `Ficha Técnica de Cotação - Cliente: ${formData.cliente} - Serviço: ${formData.servico}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const sendEmail = () => {
    const subject = `Ficha Técnica de Cotação - ${formData.cliente}`;
    const body = `Cliente: ${formData.cliente}\nSolicitante: ${formData.solicitante}\nServiço: ${formData.servico}`;
    
    const mailtoLink = `mailto:${formData.fone_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const consultarFichas = () => {
    toast({
      title: "Consultar Fichas",
      description: "Funcionalidade de consulta será implementada com o backend.",
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button type="button" onClick={viewHTML} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80">
            <FileText className="h-4 w-4" />
            Visualizar HTML
          </Button>

          <Button type="button" onClick={exportToHTML} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Baixar HTML
          </Button>

          <Button type="button" onClick={sendWhatsApp} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
            <MessageCircle className="h-4 w-4" />
            Enviar WhatsApp
          </Button>

          <Button type="button" onClick={sendEmail} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800">
            <Mail className="h-4 w-4" />
            Enviar E-mail
          </Button>

          <Button type="button" onClick={() => window.print()} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>

          <Button type="button" onClick={consultarFichas} variant="secondary" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Consultar Fichas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}