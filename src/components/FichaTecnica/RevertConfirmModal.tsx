import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { FichaSalva, STATUS_CONFIG, StatusFicha } from "@/types/ficha-tecnica";
import { getPreviousStatus } from "@/utils/statusMapping";

interface RevertConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => Promise<void>;
  ficha: FichaSalva | null;
  isReverting: boolean;
}

export function RevertConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  ficha,
  isReverting
}: RevertConfirmModalProps) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  if (!ficha) return null;

  const previousStatus = getPreviousStatus(ficha.status);

  if (!previousStatus) {
    return null;
  }

  const currentStatusConfig = STATUS_CONFIG[ficha.status];
  const previousStatusConfig = STATUS_CONFIG[previousStatus];

  const handleConfirm = async () => {
    // Validação
    if (!motivo.trim()) {
      setError('O motivo é obrigatório');
      return;
    }

    if (motivo.trim().length < 10) {
      setError('O motivo deve ter no mínimo 10 caracteres');
      return;
    }

    setError('');
    await onConfirm(motivo);
    setMotivo(''); // Limpar após confirmar
  };

  const handleCancel = () => {
    setMotivo('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-full sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <RotateCcw className="h-5 w-5" />
            Estornar Ficha para Etapa Anterior
          </DialogTitle>
          <DialogDescription>
            Esta ação reverterá a ficha <strong>FTC {ficha.numeroFTC}</strong> para a etapa anterior do fluxo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Ficha */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{ficha.resumo.cliente}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Serviço</p>
              <p className="font-medium">{ficha.formData?.nome_peca || ficha.resumo.servico}</p>
            </div>
          </div>

          {/* Mudança de Status */}
          <div className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Status Atual</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentStatusConfig.icon}</span>
                  <span className="font-semibold">{currentStatusConfig.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{currentStatusConfig.description}</p>
              </div>
              <RotateCcw className="h-6 w-6 text-orange-600 mx-4" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Novo Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{previousStatusConfig.icon}</span>
                  <span className="font-semibold">{previousStatusConfig.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{previousStatusConfig.description}</p>
              </div>
            </div>
          </div>

          {/* Alerta de Impacto */}
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>⚠️ Atenção:</strong> {getImpactMessage(ficha.status, previousStatus)}
            </AlertDescription>
          </Alert>

          {/* Campo de Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium">
              Motivo do Estorno <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo do estorno (mínimo 10 caracteres)..."
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError('');
              }}
              className="min-h-[100px]"
              disabled={isReverting}
            />
            <p className="text-xs text-muted-foreground">
              {motivo.length}/10 caracteres mínimos
            </p>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isReverting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isReverting || !motivo.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isReverting ? "Estornando..." : "Confirmar Estorno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get impact message based on status change
function getImpactMessage(currentStatus: StatusFicha, previousStatus: StatusFicha): string {
  switch (currentStatus) {
    case 'aguardando_cotacao_compras':
      return 'A ficha será devolvida para o Técnico revisar. O departamento de Compras será notificado.';
    case 'aguardando_orcamento_comercial':
      return 'A ficha será devolvida para o Compras recotar materiais. O departamento Comercial será notificado.';
    case 'orcamento_enviado_cliente':
      return 'O orçamento será reaberto para edição pelo Comercial. O cliente NÃO será notificado automaticamente.';
    default:
      return 'A ficha será revertida para a etapa anterior do fluxo.';
  }
}
