import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Send, CheckCircle2, XCircle, Edit, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { OrcamentoModal } from "@/components/FichaTecnica/OrcamentoModal";

export default function Comercial() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("aguardando");
  const [fichaParaOrcar, setFichaParaOrcar] = useState<any>(null);
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);

  // Query 1: Fichas aguardando orçamento
  const { data: fichasAguardando, isLoading: loadingAguardando, refetch: refetchFichasAguardando } = useQuery({
    queryKey: ['fichas-aguardando-orcamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select(`
          *,
          materiais (*)
        `)
        .eq('status', 'aguardando_orcamento_comercial')
        .order('data_ultima_edicao', { ascending: false});

      if (error) {
        console.error('Erro ao buscar fichas aguardando orçamento:', error);
        toast.error('Erro ao carregar fichas');
        return [];
      }
      return data || [];
    }
  });

  // Query 2: Orçamentos enviados
  const { data: orcamentosEnviados, isLoading: loadingEnviados } = useQuery({
    queryKey: ['orcamentos-enviados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select('*')
        .eq('status', 'orcamento_enviado_cliente')
        .order('data_ultima_edicao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar orçamentos enviados:', error);
        return [];
      }
      return data || [];
    }
  });

  // Query 3: Aprovações recebidas
  const { data: aprovacoesRecebidas, isLoading: loadingAprovacoes } = useQuery({
    queryKey: ['aprovacoes-orcamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aprovacoes_orcamento_cliente')
        .select('*, fichas_tecnicas(cliente, nome_peca, numero_ftc)')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar aprovações:', error);
        return [];
      }
      return data || [];
    }
  });

  // Separar aprovações por tipo
  const aprovadas = aprovacoesRecebidas?.filter(a => a.tipo === 'aprovar') || [];
  const rejeitadas = aprovacoesRecebidas?.filter(a => a.tipo === 'rejeitar') || [];
  const alteracoes = aprovacoesRecebidas?.filter(a => a.tipo === 'alterar') || [];

  // Estatísticas
  const totalAprovacoes = aprovacoesRecebidas?.length || 0;
  const taxaAprovacao = totalAprovacoes > 0
    ? ((aprovadas.length / totalAprovacoes) * 100).toFixed(1)
    : '0';

  const getAprovacaoBadge = (tipo: string) => {
    const tipoMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
      'aprovar': { label: '✅ Aprovado', variant: 'default' },
      'rejeitar': { label: '❌ Rejeitado', variant: 'destructive' },
      'alterar': { label: '🔄 Solicita Alteração', variant: 'secondary' },
    };
    const config = tipoMap[tipo] || { label: tipo, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: any) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Módulo Comercial
          </h1>
          <p className="text-muted-foreground">
            Gerencie orçamentos e aprovações de clientes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aguardando">
            📊 Ag. Orçamento ({fichasAguardando?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="enviados">
            📤 Enviados ({orcamentosEnviados?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="aprovacoes">
            ✅ Aprovações ({aprovadas.length})
          </TabsTrigger>
          <TabsTrigger value="rejeicoes">
            ❌ Rejeitadas/Alterações ({rejeitadas.length + alteracoes.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Aguardando Orçamento */}
        <TabsContent value="aguardando" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fichas Aguardando Criação de Orçamento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Materiais já foram cotados. Pronto para gerar orçamento comercial.
              </p>
            </CardHeader>
            <CardContent>
              {loadingAguardando ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : fichasAguardando && fichasAguardando.length > 0 ? (
                <div className="space-y-4">
                  {fichasAguardando.map((ficha: any) => (
                    <Card key={ficha.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-base">FTC {ficha.numero_ftc}</CardTitle>
                            <span className="text-sm text-muted-foreground">
                              {ficha.cliente}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {ficha.nome_peca}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Transformar dados do Supabase para estrutura FichaSalva
                              const fichaTransformada = {
                                ...ficha,
                                formData: {
                                  ...ficha,
                                  cliente: ficha.cliente,
                                  solicitante: ficha.solicitante,
                                  fone_email: ficha.contato,
                                  total_horas_servico: ficha.total_horas_servico
                                },
                                calculos: {
                                  horasTodasPecas: parseFloat(ficha.total_horas_servico || '0')
                                }
                              };
                              setFichaParaOrcar(fichaTransformada);
                              setShowOrcamentoModal(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Gerar Orçamento
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ficha aguardando orçamento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Orçamentos Enviados */}
        <TabsContent value="enviados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Enviados - Aguardando Resposta do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEnviados ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : orcamentosEnviados && orcamentosEnviados.length > 0 ? (
                <div className="space-y-4">
                  {orcamentosEnviados.map((ficha: any) => {
                    const orcamentoData = ficha.dados_orcamento;
                    const valorFinal = orcamentoData?.precoVendaFinal || 0;

                    return (
                      <Card key={ficha.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">FTC {ficha.numero_ftc}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Cliente: <strong>{ficha.cliente}</strong>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Peça: {ficha.nome_peca}
                              </p>
                            </div>
                            <Badge variant="outline">
                              <Send className="h-3 w-3 mr-1" />
                              Enviado
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Valor do Orçamento</p>
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(valorFinal)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Versão</p>
                                <p className="text-lg font-medium">
                                  v{ficha.versao_orcamento_atual || 0}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Última atualização: {new Date(ficha.data_ultima_edicao).toLocaleDateString('pt-BR')}
                            </p>
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" variant="outline">
                                Reenviar Orçamento
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/nova-ficha/${ficha.id}`)}
                              >
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum orçamento enviado aguardando resposta
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Aprovações */}
        <TabsContent value="aprovacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Orçamentos Aprovados pelos Clientes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Estes orçamentos foram aprovados. Próximo passo: criar requisição de compra e abrir OS.
              </p>
            </CardHeader>
            <CardContent>
              {loadingAprovacoes ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : aprovadas.length > 0 ? (
                <div className="space-y-4">
                  {aprovadas.map((aprov: any) => (
                    <Card key={aprov.id} className="border-l-4 border-l-green-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              FTC {aprov.fichas_tecnicas?.numero_ftc || aprov.numero_ftc}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: <strong>{aprov.fichas_tecnicas?.cliente}</strong>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Peça: {aprov.fichas_tecnicas?.nome_peca}
                            </p>
                          </div>
                          {getAprovacaoBadge(aprov.tipo)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <p className="text-sm font-medium">Responsável pela Aprovação:</p>
                            <p className="text-sm">{aprov.responsavel}</p>
                            <p className="text-xs text-muted-foreground">{aprov.email}</p>
                            {aprov.telefone && (
                              <p className="text-xs text-muted-foreground">{aprov.telefone}</p>
                            )}
                          </div>
                          {aprov.observacoes && (
                            <div className="text-sm">
                              <p className="font-medium">Observações:</p>
                              <p className="text-muted-foreground">{aprov.observacoes}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Aprovado em: {new Date(aprov.criado_em).toLocaleString('pt-BR')}
                          </p>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="default">
                              Criar Requisição de Compra
                            </Button>
                            <Button size="sm" variant="outline">
                              Abrir OS de Produção
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum orçamento aprovado pendente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Rejeitadas/Alterações */}
        <TabsContent value="rejeicoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-orange-600" />
                Orçamentos Rejeitados ou Com Solicitação de Alteração
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAprovacoes ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : (rejeitadas.length + alteracoes.length) > 0 ? (
                <div className="space-y-4">
                  {[...rejeitadas, ...alteracoes].map((aprov: any) => (
                    <Card key={aprov.id} className={`border-l-4 ${aprov.tipo === 'rejeitar' ? 'border-l-red-500' : 'border-l-orange-500'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              FTC {aprov.fichas_tecnicas?.numero_ftc || aprov.numero_ftc}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: <strong>{aprov.fichas_tecnicas?.cliente}</strong>
                            </p>
                          </div>
                          {getAprovacaoBadge(aprov.tipo)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                            <p className="text-sm font-medium">Responsável pela Resposta:</p>
                            <p className="text-sm">{aprov.responsavel}</p>
                            <p className="text-xs text-muted-foreground">{aprov.email}</p>
                          </div>
                          {aprov.observacoes && (
                            <div className="text-sm">
                              <p className="font-medium">Motivo/Observações:</p>
                              <p className="text-muted-foreground italic">"{aprov.observacoes}"</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Data: {new Date(aprov.criado_em).toLocaleString('pt-BR')}
                          </p>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/nova-ficha/${aprov.ficha_id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Revisar Orçamento
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma rejeição ou solicitação de alteração
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Orçamento */}
      <OrcamentoModal
        open={showOrcamentoModal}
        onClose={() => {
          setShowOrcamentoModal(false);
          setFichaParaOrcar(null);
        }}
        fichaTecnica={fichaParaOrcar || undefined}
        onCreateOrcamento={() => {
          refetchFichasAguardando();
          setShowOrcamentoModal(false);
          setFichaParaOrcar(null);
        }}
      />
    </div>
  );
}
