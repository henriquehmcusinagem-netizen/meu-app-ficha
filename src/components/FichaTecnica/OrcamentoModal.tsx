import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FichaSalva, OrcamentoData } from '@/types/ficha-tecnica';
import { User, Building2, Mail, Phone, Package, Calculator, TrendingUp, Percent, Clock, Calendar, Shield, CreditCard, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnviarOrcamentoModal } from './EnviarOrcamentoModal';
import { formatCurrency } from '@/utils/helpers';

const orcamentoSchema = z.object({
  prazoEntrega: z.number().min(1, 'Prazo deve ser maior que 0'),
  validadeProposta: z.number().min(1, 'Validade deve ser maior que 0'),
  condicoesPagamento: z.string().min(1, 'Condições de pagamento obrigatórias'),
  garantiaDias: z.number().min(0, 'Garantia não pode ser negativa'),
  despesasVariaveis: z.number().min(0, 'Despesas variáveis não podem ser negativas').max(100, 'Máximo 100%'),
  despesasFixas: z.number().min(0, 'Despesas fixas não podem ser negativas').max(100, 'Máximo 100%'),
  margemLucro: z.number().min(0, 'Margem de lucro não pode ser negativa').max(100, 'Máximo 100%'),
  valorHoraMaoObra: z.number().min(0, 'Valor hora não pode ser negativo'),
});

type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

interface OrcamentoModalProps {
  open: boolean;
  onClose: () => void;
  onCreateOrcamento: (data: OrcamentoData) => void;
  fichaTecnica?: FichaSalva;
}

export function OrcamentoModal({ open, onClose, onCreateOrcamento, fichaTecnica }: OrcamentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [enviarModalOpen, setEnviarModalOpen] = useState(false);
  const [orcamentoCriado, setOrcamentoCriado] = useState<OrcamentoData | null>(null);

  const { toast } = useToast();

  const handleCloseEnviarModal = useCallback(() => {
    setEnviarModalOpen(false);
  }, []);

  const form = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      prazoEntrega: 10,
      validadeProposta: 30,
      condicoesPagamento: '28 dias',
      garantiaDias: 90,
      despesasVariaveis: 25,
      despesasFixas: 10,
      margemLucro: 30,
      valorHoraMaoObra: 53.00,
    },
  });

  const watchedValues = form.watch();

  // Calcular custo dos materiais cotados
  const custoMateriais = (() => {
    if (!fichaTecnica?.materiais) return 0;

    return fichaTecnica.materiais.reduce((total, material) => {
      const valorUnitario = parseFloat(material.valor_unitario) || 0;
      const quantidade = parseFloat(material.quantidade) || 0;
      return total + (valorUnitario * quantidade);
    }, 0);
  })();

  // Calcular custo de mão de obra (horas × valor/hora)
  const horasProducao = fichaTecnica?.calculos?.horasTodasPecas || 0;
  const custoMaoObra = horasProducao * watchedValues.valorHoraMaoObra;

  // CUSTO BASE = materiais + mão de obra
  const custoBase = custoMateriais + custoMaoObra;

  // Cálculo de MARKUP
  const percentualOutros = watchedValues.despesasVariaveis + watchedValues.despesasFixas + watchedValues.margemLucro;
  const percentualCustos = 100 - percentualOutros;
  const fatorMarkup = percentualCustos / 100;

  // Preço final
  const precoVenda = fatorMarkup > 0 ? custoBase / fatorMarkup : custoBase;

  // Valores individuais baseados no preço final
  const despesasVariaveisValor = (precoVenda * watchedValues.despesasVariaveis) / 100;
  const despesasFixasValor = (precoVenda * watchedValues.despesasFixas) / 100;
  const margemLucroValor = (precoVenda * watchedValues.margemLucro) / 100;

  const handleSubmit = async (data: OrcamentoFormData) => {
    if (!fichaTecnica) return;

    setLoading(true);
    try {
      const orcamentoData: OrcamentoData = {
        itens: [{
          id: 1,
          item: '1',
          quantidade: parseInt(fichaTecnica.formData.quantidade) || 1,
          descricao: fichaTecnica.formData.nome_peca || 'Peça/Serviço',
          valorUnitario: precoVenda,
          valorTotal: precoVenda
        }],
        custoBase: {
          materiaisCotados: custoMateriais,
          materiasPrimaEstoque: 0,
          servicosTerceiros: 0,
          horasProducao: {
            horas: horasProducao,
            valorHora: data.valorHoraMaoObra,
            total: custoMaoObra
          },
          horasDespesasFixas: {
            horas: 0,
            valorHora: 0,
            total: 0
          },
          totalCustoIndustrial: custoBase
        },
        percentuais: {
          despesasVariaveis: data.despesasVariaveis,
          despesasFixas: data.despesasFixas,
          margemLucro: data.margemLucro
        },
        config: {
          prazoEntrega: data.prazoEntrega,
          validadeProposta: data.validadeProposta,
          prazoPagamento: parseInt(data.condicoesPagamento) || 28,
          condicoesPagamento: data.condicoesPagamento,
          garantia: data.garantiaDias
        },
        precoVendaFinal: precoVenda
      };

      setOrcamentoCriado(orcamentoData);
      setEnviarModalOpen(true);

      toast({
        title: "Orçamento criado com sucesso!",
        description: `Orçamento para FTC ${fichaTecnica.numeroFTC} foi criado. Agora selecione os contatos para envio.`,
      });
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: "Erro ao criar orçamento",
        description: "Tente novamente ou entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!fichaTecnica) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-auto p-0 border-0 shadow-2xl">
        <div className="rounded-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              <div className="p-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              Criar Orçamento - {fichaTecnica.numeroFTC}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Configure os custos, margens e condições comerciais para gerar o orçamento da ficha técnica
            </DialogDescription>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Dados do Cliente - Compacto */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-primary text-base">
                  <User className="h-4 w-4" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium min-w-0">Cliente:</span>
                    <span className="truncate">{fichaTecnica.formData.cliente}</span>
                    <span className="text-muted-foreground">•</span>
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Solicitante:</span>
                    <span className="truncate">{fichaTecnica.formData.solicitante}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span className="truncate">{fichaTecnica.formData.fone_email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens do Orçamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Item do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline" className="mb-2">Item 1</Badge>
                      <h3 className="font-medium">{fichaTecnica.formData.nome_peca || 'Peça/Serviço'}</h3>
                      <p className="text-sm text-muted-foreground">Quantidade: {fichaTecnica.formData.quantidade || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor Unitário</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(precoVenda)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Formação do Preço de Venda */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                    <Calculator className="h-4 w-4" />
                    Formação do Preço de Venda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Detalhamento de Custos */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Breakdown de Custos:
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        Materiais Cotados:
                      </span>
                      <span className="font-medium">{formatCurrency(custoMateriais)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-green-500" />
                        Mão de Obra ({horasProducao}h × R$ {watchedValues.valorHoraMaoObra.toFixed(2)}/h):
                      </span>
                      <span className="font-medium">{formatCurrency(custoMaoObra)}</span>
                    </div>

                    <Separator />
                    <div className="flex justify-between items-center font-medium bg-gradient-to-r from-slate-50/80 to-blue-50/80 border border-slate-200/60 p-2 rounded">
                      <span className="text-xs leading-tight">
                        Soma total dos custos industriais =
                      </span>
                      <span className="text-primary font-bold text-sm">{formatCurrency(custoBase)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="valorHoraMaoObra"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Valor Hora (R$/h)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="despesasVariaveis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Despesas Variáveis (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="despesasFixas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Despesas Fixas (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="margemLucro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margem Lucro (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2 pt-3 border-t">
                       <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded border">
                         <span className="font-medium">Custos Industriais ({percentualCustos.toFixed(1)}%):</span>
                         <span className="font-bold">{formatCurrency(custoBase)}</span>
                       </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Fator MARKUP:</span>
                        <span>{fatorMarkup.toFixed(3)}</span>
                      </div>
                       <div className="flex justify-between items-center text-sm">
                         <span>+ Despesas Variáveis ({watchedValues.despesasVariaveis}%):</span>
                         <span>{formatCurrency(despesasVariaveisValor)}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span>+ Despesas Fixas ({watchedValues.despesasFixas}%):</span>
                         <span>{formatCurrency(despesasFixasValor)}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span>+ Margem de Lucro ({watchedValues.margemLucro}%):</span>
                         <span>{formatCurrency(margemLucroValor)}</span>
                       </div>
                    </div>

                    <Separator />
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200">
                      <span className="font-bold text-green-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        PREÇO DE VENDA FINAL:
                      </span>
                       <span className="text-xl font-bold text-green-600">
                         {formatCurrency(precoVenda)}
                       </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configurações do Orçamento */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Configurações do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="prazoEntrega"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Prazo de Entrega (dias)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validadeProposta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validade da Proposta (dias)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="condicoesPagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Condições de Pagamento
                        </FormLabel>
                        <div className="space-y-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Digite as condições ou selecione abaixo"
                              className="bg-background"
                            />
                          </FormControl>
                          <div className="flex flex-wrap gap-1">
                            {[
                              "50% antecipado + 50% na entrega",
                              "30% antecipado + 70% na entrega",
                              "100% antecipado",
                              "À vista na entrega",
                              "28 dias",
                              "30 dias após entrega"
                            ].map((opcao) => (
                              <button
                                key={opcao}
                                type="button"
                                onClick={() => field.onChange(opcao)}
                                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="garantiaDias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Garantia (dias)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valor Final */}
                  <Separator />
                  <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border">
                    <span className="font-bold text-primary">
                      VALOR FINAL DO ORÇAMENTO:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(precoVenda)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-blue-200/60 bg-white/60 backdrop-blur-sm rounded-lg">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300/50 text-slate-700 hover:from-slate-100 hover:to-slate-200 backdrop-blur-sm"
              >
                Cancelar
              </Button>
              {orcamentoCriado ? (
                <Button
                  type="button"
                  onClick={() => setEnviarModalOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 text-white border-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Orçamento
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 text-white border-0"
                >
                  {loading ? 'Criando...' : 'Criar e Enviar Orçamento'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>

        </div>
      </DialogContent>
    </Dialog>

    {/* Modal de Envio do Orçamento */}
    <EnviarOrcamentoModal
      open={enviarModalOpen && !!orcamentoCriado}
      onClose={handleCloseEnviarModal}
      onEnviar={(dadosEnvio: any) => {
        if (orcamentoCriado) {
          onCreateOrcamento(orcamentoCriado);
        }
        setEnviarModalOpen(false);
        onClose();
      }}
      orcamento={orcamentoCriado}
      fichaTecnica={fichaTecnica}
    />
    </>
  );
}
