import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AprovarOrcamentoCardProps {
  ficha: any;
}

export function AprovarOrcamentoCard({ ficha }: AprovarOrcamentoCardProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
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
        .eq('id', ficha.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas-aguardando-orcamento'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-aprovacao-orcamento'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos-enviados'] });
      toast.success('Orçamento aprovado com sucesso!');
      setShowDialog(false);
      setObservacoes('');
    },
    onError: (error: any) => {
      toast.error(`Erro ao aprovar orçamento: ${error.message}`);
    },
  });

  const handleAprovar = () => {
    setShowDialog(true);
  };

  const confirmAprovar = () => {
    aprovarMutation.mutate();
  };

  // Verificar status de aprovações
  const aprovadoFtcCliente = ficha.aprovado_ftc_cliente || false;
  const aprovadoOrcamentoCliente = ficha.aprovado_orcamento_cliente || false;

  // Dados do orçamento
  const orcamentoData = ficha.dados_orcamento;
  const valorFinal = orcamentoData?.precoVendaFinal || 0;

  const formatCurrency = (value: any) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  return (
    <>
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                FTC {ficha.numero_ftc}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cliente: <strong>{ficha.cliente}</strong>
              </p>
              <p className="text-sm text-muted-foreground">Peça: {ficha.nome_peca}</p>
            </div>
            <Badge variant="outline" className="bg-orange-50">
              <Clock className="h-3 w-3 mr-1" />
              Aguardando Aprovação
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Valor do Orçamento */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-muted-foreground mb-1">Valor do Orçamento</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(valorFinal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Versão: v{ficha.versao_orcamento_atual || 1}
              </p>
            </div>

            {/* Status de Aprovações */}
            <div className="grid grid-cols-2 gap-3">
              {/* Aprovação FTC Cliente */}
              <div
                className={`p-3 rounded-lg border ${
                  aprovadoFtcCliente
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {aprovadoFtcCliente ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  <p className="text-xs font-semibold">FTC Cliente</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {aprovadoFtcCliente ? '✅ Aprovado' : 'Pendente'}
                </p>
                {ficha.data_aprovacao_ftc_cliente && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ficha.data_aprovacao_ftc_cliente).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Aprovação Orçamento */}
              <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-300">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <p className="text-xs font-semibold">Orçamento</p>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
                  ⏳ Aguardando aprovação
                </p>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📋 Informações
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• <strong>Status:</strong> {ficha.status}</p>
                <p>• <strong>Última edição:</strong> {new Date(ficha.data_ultima_edicao).toLocaleDateString('pt-BR')}</p>
                {ficha.observacoes && (
                  <p>• <strong>Obs:</strong> {ficha.observacoes}</p>
                )}
              </div>
            </div>

            {/* Botão de Aprovação */}
            <div className="pt-2">
              <Button
                size="default"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleAprovar}
                disabled={aprovarMutation.isPending || !aprovadoFtcCliente}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {aprovarMutation.isPending ? 'Aprovando...' : 'Aprovar Orçamento Manualmente'}
              </Button>
              {!aprovadoFtcCliente && (
                <p className="text-xs text-orange-600 dark:text-orange-400 text-center mt-2">
                  ⚠️ Cliente precisa aprovar a FTC primeiro
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Aprovar Orçamento Manualmente
            </DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar manualmente o orçamento da ficha FTC {ficha.numero_ftc}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumo do Orçamento */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-semibold mb-2">Resumo do Orçamento</p>
              <div className="space-y-1 text-sm">
                <p><strong>Cliente:</strong> {ficha.cliente}</p>
                <p><strong>Peça:</strong> {ficha.nome_peca}</p>
                <p><strong>Valor:</strong> <span className="text-green-600 font-bold">{formatCurrency(valorFinal)}</span></p>
              </div>
            </div>

            {/* Campo de Observações */}
            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Ex: PC recebido por email em 07/10/2025, condições de pagamento 30/60 dias..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Dica: Registre informações como recebimento de PC, condições especiais, etc.
              </p>
            </div>

            {/* Aviso */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-muted-foreground">
                <strong>Importante:</strong> Esta ação registrará que o orçamento foi aprovado internamente
                pelo Comercial. Se a ficha estiver totalmente aprovada (FTC + Orçamento), a OS poderá ser
                criada automaticamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={aprovarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAprovar}
              disabled={aprovarMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {aprovarMutation.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
