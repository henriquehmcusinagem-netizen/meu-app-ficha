import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertCircle, Package, FileText, MessageCircle, Mail } from "lucide-react";
import { StatusFicha, STATUS_CONFIG, FichaSalva } from "@/types/ficha-tecnica";
import { Material, FormData } from "@/types/ficha-tecnica";
import { sendFichaViaOutlook, canSendToComercial } from "@/utils/outlookIntegration";
import { logger } from "@/utils/logger";

interface SaveConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: StatusFicha, sendWhatsApp?: boolean) => Promise<{ success: boolean; numeroFTC?: string }>;
  currentStatus: StatusFicha;
  materiais: Material[];
  isSaving: boolean;
  formData: FormData;
  numeroFTC: string;
  ficha?: FichaSalva; // Para envio via Outlook
}

export function SaveConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  materiais,
  isSaving,
  formData,
  numeroFTC,
  ficha
}: SaveConfirmModalProps) {
  const [selectedOption, setSelectedOption] = useState<'continue' | 'finished'>('continue');
  const [notifyBuyer, setNotifyBuyer] = useState(false);
  const [sendViaOutlook, setSendViaOutlook] = useState(false);

  // Debug: Log do status atual

  // Fallback inteligente: se o status parece errado, tentar detectar pelo contexto
  let statusFinal = currentStatus;

  // Se está mostrando cotação mas deveria ser orçamento
  if (currentStatus === 'aguardando_cotacao_compras' && ficha?.status === 'aguardando_orcamento_comercial') {
    statusFinal = 'aguardando_orcamento_comercial';
  }


  // Verificação de segurança para materiais
  const materiaisSeguros = materiais || [];
  const hasMaterials = materiaisSeguros.length > 0;
  const hasValidMaterials = materiaisSeguros.some(m => m.descricao.trim() && m.quantidade.trim());

  // Verifica se todos os materiais ATUAIS têm preços (não da ficha salva)
  const hasAllPricesInCurrentMaterials = () => {
    const materiaisValidos = materiaisSeguros.filter(m =>
      m.descricao.trim() && parseFloat(m.quantidade) > 0
    );

    if (materiaisValidos.length === 0) {
      return false;
    }

    // Verifica se todos os materiais válidos têm preços
    return materiaisValidos.every(m =>
      parseFloat(m.valor_unitario) > 0 && parseFloat(m.valor_total) > 0
    );
  };

  const hasAllPrices = hasAllPricesInCurrentMaterials();
  const canSendToCommercial = selectedOption === 'finished' && hasValidMaterials && hasAllPrices;

  const getTargetStatus = (): StatusFicha => {
    // Verificação de segurança para formData
    const formDataSeguro = formData || {};

    // Verificar se já tem número de orçamento preenchido (comercial finalizou)
    const hasOrcamento = (formDataSeguro as any).num_orcamento && (formDataSeguro as any).num_orcamento.trim() !== '';

    if (selectedOption === 'finished') {
      // LÓGICA BASEADA NO STATUS ATUAL - SEM PULAR ETAPAS
      switch (statusFinal) {
        case 'rascunho':
          // Técnico termina → sempre vai para compras
          return 'aguardando_cotacao_compras';

        case 'aguardando_cotacao_compras':
          // Compras só pode avançar SE tiver preços
          if (hasAllPrices) {
            return 'aguardando_orcamento_comercial';
          } else {
            // SEM preços, mantém em cotação
            logger.warn('Tentando avançar sem preços - mantendo em cotação');
            return 'aguardando_cotacao_compras';
          }

        case 'aguardando_orcamento_comercial':
          // Comercial só avança se tiver número de orçamento
          if (hasOrcamento) {
            return 'orcamento_enviado_cliente';
          } else {
            logger.warn('Tentando finalizar sem número de orçamento - mantendo em aguardando orçamento');
            return 'aguardando_orcamento_comercial';
          }

        case 'orcamento_enviado_cliente':
          // Já está finalizado
          return 'orcamento_enviado_cliente';

        default:
          logger.warn('Status desconhecido - mantendo status atual', { statusFinal });
          return statusFinal || 'rascunho';
      }
    }

    // Se não finaliza, mantém o status atual
    return currentStatus || 'rascunho';
  };



  const handleConfirm = async () => {
    const targetStatus = getTargetStatus();
    const shouldSendWhatsApp = selectedOption === 'finished' && notifyBuyer;

    console.log('📋 SaveConfirmModal - handleConfirm chamado', {
      selectedOption,
      sendViaOutlook,
      hasAllPrices,
      canSendToCommercial,
      fichaExists: !!ficha,
      fichaId: ficha?.id,
      fichaStatus: ficha?.status,
      targetStatus
    });

    // Primeiro salvar para obter o número real
    const result = await onConfirm(targetStatus);

    // Depois enviar WhatsApp com número correto
    if (shouldSendWhatsApp && result && result.numeroFTC) {
      const message = generateWhatsAppMessageWithRealNumber(result.numeroFTC);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }

    // Se o usuário escolheu enviar via Outlook e tem ficha completa
    if (selectedOption === 'finished' && sendViaOutlook && ficha && canSendToCommercial) {
      console.log('✅ Condições atendidas para enviar via Outlook', {
        ficha: ficha,
        materiais: ficha.materiais,
        canSendToCommercial
      });

      setTimeout(async () => {
        try {
          console.log('📧 Chamando sendFichaViaOutlook com ficha:', ficha.numeroFTC);
          await sendFichaViaOutlook(ficha);
        } catch (error) {
          console.error('❌ Erro ao chamar sendFichaViaOutlook:', error);
          logger.error('Erro ao enviar ficha via Outlook', error);
        }
      }, 1000); // Delay maior para garantir que o salvamento termine
    } else {
      console.log('⚠️ Condições NÃO atendidas para enviar via Outlook', {
        selectedOption,
        sendViaOutlook,
        fichaExists: !!ficha,
        canSendToCommercial
      });
    }

    onOpenChange(false);
  };

  const generateWhatsAppMessageWithRealNumber = (numeroFTCReal: string) => {
    const cliente = formData.cliente?.trim() || 'Cliente não informado';
    const peca = formData.nome_peca?.trim() || 'Peça não informada';
    const qtd = formData.quantidade?.trim() || '1';

    const materiaisPreenchidos = materiais?.some(m =>
      m.descricao?.trim() && m.quantidade?.trim()
    ) || false;

    const statusText = materiaisPreenchidos
      ? 'aguardando cotação dos materiais pelo compras'
      : 'preenchida, aguardando cadastro de materiais';

    return `*FICHA TÉCNICA CONCLUÍDA*

*FTC:* ${numeroFTCReal}
*Cliente:* ${cliente}
*Peça:* ${peca}
*Quantidade:* ${qtd}

*Status:* Preenchimento técnico concluído
*Situação:* Ficha ${statusText}

${materiaisPreenchidos ? '*Próxima etapa:* Cotação de materiais pelo comprador' : '*Próxima etapa:* Cadastro de materiais necessários'}

_Mensagem gerada automaticamente pelo sistema HMC_`;
  };

  const targetStatus = getTargetStatus();
  const statusConfig = STATUS_CONFIG[targetStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
            {/* Opção "Continuar" - contextual baseada no status */}
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="continue" id="continue" />
              <Label htmlFor="continue" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {statusFinal === 'rascunho' ? '✏️' :
                     statusFinal === 'aguardando_cotacao_compras' ? '💰' :
                     statusFinal === 'aguardando_orcamento_comercial' ? '📊' :
                     statusFinal === 'orcamento_enviado_cliente' ? '📤' :
                     '❓'}
                  </span>
                  <div>
                    <p className="font-medium">
                      {statusFinal === 'rascunho' ? 'Ainda vou revisar' :
                       statusFinal === 'aguardando_cotacao_compras' ? 'Ainda cotando materiais' :
                       statusFinal === 'aguardando_orcamento_comercial' ? 'Ainda preparando orçamento' :
                       statusFinal === 'orcamento_enviado_cliente' ? 'Orçamento já enviado' :
                       'Status desconhecido'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {statusFinal === 'rascunho' ? 'Continuar como rascunho para edições' :
                       statusFinal === 'aguardando_cotacao_compras' ? 'Continuar cotando materiais' :
                       statusFinal === 'aguardando_orcamento_comercial' ? 'Continuar preparando orçamento' :
                       statusFinal === 'orcamento_enviado_cliente' ? 'Orçamento finalizado' :
                       'Status desconhecido'}
                    </p>
                  </div>
                </div>
              </Label>
            </div>

            {/* Opção "Finalizar" - contextual baseada no status */}
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="finished" id="finished" />
              <Label htmlFor="finished" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">
                      {statusFinal === 'rascunho' ? 'Terminei o preenchimento' :
                       statusFinal === 'aguardando_cotacao_compras' ? 'Cotação finalizada' :
                       statusFinal === 'aguardando_orcamento_comercial' ? 'Orçamento pronto para envio' :
                       statusFinal === 'orcamento_enviado_cliente' ? 'Processo finalizado' :
                       'Finalizar processo'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {statusFinal === 'rascunho' ? 'Enviar para Compras cotar materiais' :
                       statusFinal === 'aguardando_cotacao_compras' ? 'Enviar para Comercial gerar orçamento' :
                       statusFinal === 'aguardando_orcamento_comercial' ? 'Finalizar e enviar orçamento ao cliente' :
                       statusFinal === 'orcamento_enviado_cliente' ? 'Processo já concluído' :
                       'Avançar no processo'}
                    </p>
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
              {/* Alertas específicos por status */}
              {statusFinal === 'aguardando_cotacao_compras' && hasAllPrices ? (
                <Alert className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>✅ Materiais com preços!</strong> A ficha será enviada para "Aguardando Orçamento (Comercial)"
                    para geração do orçamento final.
                  </AlertDescription>
                </Alert>
              ) : statusFinal === 'aguardando_orcamento_comercial' && (formData as any)?.num_orcamento && (formData as any).num_orcamento.trim() !== '' ? (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>🎉 Orçamento pronto!</strong> A ficha será finalizada e enviada para a aba "Orçamentos Enviados"
                    com status "Enviado ao Cliente".
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                  <Package className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {statusFinal === 'rascunho' ? (
                      <>
                        <strong>🔄 Técnico finalizou!</strong> A ficha será enviada para "Aguardando Cotação (Compras)"
                        para que o comprador {hasValidMaterials ? 'orce os materiais' : 'cadastre e orce os materiais necessários'}.
                      </>
                    ) : statusFinal === 'aguardando_cotacao_compras' ? (
                      <>
                        <strong>💰 Adicione preços aos materiais!</strong> Para enviar ao Comercial,
                        todos os materiais precisam ter valores cotados.
                      </>
                    ) : statusFinal === 'aguardando_orcamento_comercial' ? (
                      <>
                        <strong>📊 Adicione número do orçamento!</strong> Para finalizar e enviar ao cliente,
                        é necessário preencher o número do orçamento.
                      </>
                    ) : (
                      <>
                        <strong>📤 Continue o processo!</strong> Complete as informações necessárias
                        para avançar no fluxo.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Opção de notificar comprador - APENAS para técnicos */}
              {statusFinal === 'rascunho' && selectedOption === 'finished' && (
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
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
              )}

              {/* Opção de enviar para Comercial via Outlook - APENAS quando está em cotação COM preços */}
              {statusFinal === 'aguardando_cotacao_compras' && canSendToCommercial && (
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <Checkbox
                    id="send-outlook"
                    checked={sendViaOutlook}
                    onCheckedChange={(checked) => setSendViaOutlook(checked as boolean)}
                  />
                  <Label htmlFor="send-outlook" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">📧 Enviar para Comercial via Outlook</p>
                        <p className="text-xs text-muted-foreground">
                          Baixa HTML da ficha e abre Outlook com email pré-configurado para contato@hmcusinagem.com.br
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
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