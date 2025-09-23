import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertCircle, Package, FileText, MessageCircle } from "lucide-react";
import { StatusFicha, STATUS_CONFIG } from "@/types/ficha-tecnica";
import { Material, FormData } from "@/types/ficha-tecnica";

interface SaveConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: StatusFicha) => void;
  currentStatus: StatusFicha;
  materiais: Material[];
  isSaving: boolean;
  formData: FormData;
  numeroFTC: string;
}

export function SaveConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  materiais,
  isSaving,
  formData,
  numeroFTC
}: SaveConfirmModalProps) {
  const [selectedOption, setSelectedOption] = useState<'continue' | 'finished'>('continue');
  const [notifyBuyer, setNotifyBuyer] = useState(false);

  const hasMaterials = materiais.length > 0;
  const hasValidMaterials = materiais.some(m => m.descricao.trim() && m.quantidade.trim());

  const getTargetStatus = (): StatusFicha => {
    // Verificar se já tem número de orçamento preenchido
    const hasOrcamento = formData.num_orcamento && formData.num_orcamento.trim() !== '';

    if (selectedOption === 'finished') {
      // Se já tem orçamento, vai para orçamento gerado
      if (hasOrcamento) {
        return 'orcamento_gerado';
      }
      // Se terminou e tem materiais válidos, vai para aguardando cotação
      if (hasValidMaterials) {
        return 'aguardando_cotacao';
      }
      // Se terminou mas não tem materiais, vai para preenchida
      return 'preenchida';
    }

    // Para rascunhos, verificar se tem orçamento e atualizar automaticamente
    if (hasOrcamento) {
      return 'orcamento_gerado';
    }

    // Se ainda vai revisar, mantém como rascunho
    return 'rascunho';
  };

  const generateWhatsAppMessage = () => {
    const cliente = formData.cliente || 'Cliente não informado';
    const peca = formData.nome_peca || 'Peça não informada';
    const qtd = formData.quantidade || '1';
    const hasOrcamento = formData.num_orcamento && formData.num_orcamento.trim() !== '';

    let statusText = '';
    if (hasOrcamento) {
      statusText = `orçamento gerado nº ${formData.num_orcamento}`;
    } else if (hasValidMaterials) {
      statusText = 'aguardando cotação dos materiais';
    } else {
      statusText = 'preenchida, aguardando cadastro de materiais';
    }

    return `🔧 *FICHA TÉCNICA CONCLUÍDA*

📋 *FTC:* ${numeroFTC}
👤 *Cliente:* ${cliente}
🔩 *Peça:* ${peca}
📦 *Quantidade:* ${qtd}

✅ *Status:* Preenchimento técnico concluído
📊 *Situação:* Ficha ${statusText}

${hasValidMaterials ? '💰 *Próxima etapa:* Cotação de materiais pelo comprador' : '📝 *Próxima etapa:* Cadastro de materiais necessários'}

_Mensagem gerada automaticamente pelo sistema HMC_`;
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleConfirm = () => {
    const targetStatus = getTargetStatus();
    onConfirm(targetStatus);

    // Se o usuário escolheu notificar o comprador, abrir WhatsApp
    if (selectedOption === 'finished' && notifyBuyer) {
      setTimeout(() => {
        openWhatsApp();
      }, 500); // Pequeno delay para garantir que o modal feche primeiro
    }

    onOpenChange(false);
  };

  const targetStatus = getTargetStatus();
  const statusConfig = STATUS_CONFIG[targetStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Salvar Ficha Técnica
          </DialogTitle>
          <DialogDescription>
            Escolha o status da ficha após o salvamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={selectedOption}
            onValueChange={(value: 'continue' | 'finished') => setSelectedOption(value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="continue" id="continue" />
              <Label htmlFor="continue" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✏️</span>
                  <div>
                    <p className="font-medium">Ainda vou revisar</p>
                    <p className="text-xs text-muted-foreground">Continuar como rascunho para edições</p>
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="finished" id="finished" />
              <Label htmlFor="finished" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Terminei o preenchimento</p>
                    <p className="text-xs text-muted-foreground">Marcar como concluído pelo técnico</p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Status que será aplicado */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">Status após salvamento:</p>
            <div className="flex items-center gap-2">
              <span>{statusConfig.icon}</span>
              <span className="font-medium">{statusConfig.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statusConfig.description}
            </p>
          </div>

          {/* Avisos informativos */}
          {selectedOption === 'finished' && (
            <div className="space-y-3">
              {hasValidMaterials ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <Package className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>✅ Materiais detectados!</strong> A ficha será marcada como "Aguardando Cotação"
                    para que o comprador possa orçar os materiais.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>⚠️ Nenhum material cadastrado.</strong> A ficha será marcada como "Preenchida"
                    aguardando cadastro de materiais.
                  </AlertDescription>
                </Alert>
              )}

              {/* Opção de notificar comprador */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg bg-green-50 border-green-200">
                <Checkbox
                  id="notify-buyer"
                  checked={notifyBuyer}
                  onCheckedChange={(checked) => setNotifyBuyer(checked as boolean)}
                />
                <Label htmlFor="notify-buyer" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Avisar comprador via WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        Enviar mensagem automática com detalhes da ficha concluída
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}