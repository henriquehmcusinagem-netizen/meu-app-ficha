import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AprovacaoManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ficha: any;
}

export function AprovacaoManualDialog({ open, onOpenChange, ficha }: AprovacaoManualDialogProps) {
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState('');

  // Mutation para aprovar orçamento manualmente
  const aprovarMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('fichas_tecnicas')
        .update({
          aprovado_orcamento_cliente: true,
          data_aprovacao_orcamento_cliente: new Date().toISOString(),
          aprovador_orcamento_id: user.id,
          observacoes_aprovacao_orcamento: observacoes || null,
        })
        .eq('id', ficha?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas-aguardando-orcamento'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-aprovacao-orcamento'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos-enviados'] });
      toast.success('Orçamento aprovado manualmente com sucesso!');
      setObservacoes('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao aprovar orçamento: ${error.message}`);
    },
  });

  const handleConfirm = () => {
    if (!ficha) {
      toast.error('Nenhuma ficha selecionada');
      return;
    }
    aprovarMutation.mutate();
  };

  if (!ficha) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aprovação Manual de Orçamento</DialogTitle>
          <DialogDescription>
            Aprovar manualmente o orçamento da FTC {ficha.numero_ftc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações da Ficha */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">FTC:</span>
              <span className="text-sm font-semibold">{ficha.numero_ftc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Cliente:</span>
              <span className="text-sm">{ficha.cliente}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Peça:</span>
              <span className="text-sm">{ficha.nome_peca}</span>
            </div>
            {ficha.dados_orcamento?.precoVendaFinal && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-medium">Valor:</span>
                <span className="text-sm font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(ficha.dados_orcamento.precoVendaFinal)}
                </span>
              </div>
            )}
          </div>

          {/* Campo de Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">
              Observações (opcional)
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Aprovado via telefone pelo cliente, pedido de compra nº..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Registre aqui o motivo ou contexto da aprovação manual
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={aprovarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={aprovarMutation.isPending}
          >
            {aprovarMutation.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
