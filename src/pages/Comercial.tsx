import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Send, CheckCircle2, XCircle, Edit, TrendingUp, Eye, Mail, CheckSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { OrcamentoModal } from "@/components/FichaTecnica/OrcamentoModal";
import { EnviarOrcamentoModal } from "@/components/FichaTecnica/EnviarOrcamentoModal";
import { AprovacaoManualDialog } from "@/components/Comercial/AprovacaoManualDialog";
import { ModuleFilter } from "@/components/ui/module-filter";
import { useModuleFilter } from "@/hooks/useModuleFilter";
import WorkflowBreadcrumb from "@/components/WorkflowBreadcrumb";

export default function Comercial() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("aguardando");
  const [fichaParaOrcar, setFichaParaOrcar] = useState<any>(null);
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);

  // States para aba Enviados
  const [fichaParaVisualizar, setFichaParaVisualizar] = useState<any>(null);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [fichaParaReenviar, setFichaParaReenviar] = useState<any>(null);
  const [showReenviarModal, setShowReenviarModal] = useState(false);
  const [fichaParaAprovarManual, setFichaParaAprovarManual] = useState<any>(null);
  const [showAprovacaoManualDialog, setShowAprovacaoManualDialog] = useState(false);

  // States para filtros
  const [filtersAguardando, setFiltersAguardando] = useState({});
  const [filtersEnviados, setFiltersEnviados] = useState({});

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
  const { data: orcamentosEnviados, isLoading: loadingEnviados, refetch: refetchFichasEnviados } = useQuery({
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

  // Função para converter ficha do banco para formato esperado pelo OrcamentoModal
  const converterFichaParaModal = (ficha: any) => {
    if (!ficha) return null;

    // Parse dados_orcamento se for string
    let dadosOrcamento = null;
    if (ficha.dados_orcamento) {
      dadosOrcamento = typeof ficha.dados_orcamento === 'string'
        ? JSON.parse(ficha.dados_orcamento)
        : ficha.dados_orcamento;
    }

    return {
      numeroFTC: ficha.numero_ftc,
      formData: {
        cliente: ficha.cliente,
        cnpj: ficha.cnpj,
        solicitante: ficha.solicitante,
        telefone: ficha.telefone || ficha.contato,
        email: ficha.email,
        fone_email: ficha.contato,  // Compatibilidade
        nome_peca: ficha.nome_peca,
        quantidade: ficha.quantidade,
      },
      materiais: ficha.materiais || [],
      calculos: {
        horasTodasPecas: ficha.total_horas_servico || 0,
      },
      dados_orcamento: dadosOrcamento,
    };
  };

  // Hooks de filtragem
  const { filterData: filterAguardando } = useModuleFilter({
    data: fichasAguardando || [],
    searchFields: ['numero_ftc', 'cliente', 'nome_peca'],
    dateField: 'data_ultima_edicao'
  });

  const { filterData: filterEnviados } = useModuleFilter({
    data: orcamentosEnviados || [],
    searchFields: ['numero_ftc', 'cliente', 'nome_peca'],
    dateField: 'data_ultima_edicao'
  });

  // Aplicar filtros
  const fichasAguardandoFiltradas = filterAguardando(filtersAguardando);
  const orcamentosEnviadosFiltrados = filterEnviados(filtersEnviados);

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

      {/* Workflow Breadcrumb - Dinâmico baseado na aba ativa */}
      <div className="mb-6">
        <WorkflowBreadcrumb
          currentStage={
            activeTab === 'aguardando' ? 'aguardando_orcamento_comercial' :
            activeTab === 'enviados' ? 'orcamento_enviado_cliente' :
            activeTab === 'aprovacoes' ? 'orcamento_aprovado_cliente' :
            'aguardando_orcamento_comercial'
          }
          variant="compact"
        />
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
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por FTC, cliente ou peça...",
              searchFields: ['numero_ftc', 'cliente', 'nome_peca'],
              sortOptions: [
                { value: 'data_ultima_edicao', label: 'Data de edição' },
                { value: 'numero_ftc', label: 'Número FTC' },
                { value: 'cliente', label: 'Cliente' }
              ],
              showDateFilter: true,
              dateField: 'data_ultima_edicao'
            }}
            onFilterChange={setFiltersAguardando}
            totalItems={fichasAguardando?.length || 0}
            filteredItems={fichasAguardandoFiltradas.length}
          />

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
              ) : fichasAguardandoFiltradas.length > 0 ? (
                <div className="space-y-4">
                  {fichasAguardandoFiltradas.map((ficha: any) => (
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
                                numeroFTC: ficha.numero_ftc,
                                formData: {
                                  ...ficha,
                                  cliente: ficha.cliente,
                                  cnpj: ficha.cnpj,
                                  solicitante: ficha.solicitante,
                                  telefone: ficha.telefone || ficha.contato,
                                  email: ficha.email,
                                  fone_email: ficha.contato,  // Compatibilidade
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
              ) : fichasAguardando && fichasAguardando.length > 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ficha encontrada com os filtros aplicados
                </p>
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
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por FTC, cliente ou peça...",
              searchFields: ['numero_ftc', 'cliente', 'nome_peca'],
              sortOptions: [
                { value: 'data_ultima_edicao', label: 'Data de edição' },
                { value: 'numero_ftc', label: 'Número FTC' },
                { value: 'cliente', label: 'Cliente' }
              ],
              showDateFilter: true,
              dateField: 'data_ultima_edicao'
            }}
            onFilterChange={setFiltersEnviados}
            totalItems={orcamentosEnviados?.length || 0}
            filteredItems={orcamentosEnviadosFiltrados.length}
          />

          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Enviados - Aguardando Resposta do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEnviados ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : orcamentosEnviadosFiltrados.length > 0 ? (
                <div className="space-y-4">
                  {orcamentosEnviadosFiltrados.map((ficha: any) => {
                    const orcamentoData = ficha.dados_orcamento;
                    const valorFinal = orcamentoData?.precoVendaFinal || 0;

                    return (
                      <Card key={ficha.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg mb-1">FTC {ficha.numero_ftc}</CardTitle>
                              <p className="text-sm font-medium">{ficha.cliente}</p>
                              <p className="text-sm text-muted-foreground truncate">{ficha.nome_peca}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFichaParaVisualizar(ficha);
                                  setShowVisualizarModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!ficha.dados_orcamento}
                                onClick={() => {
                                  if (!ficha.dados_orcamento) {
                                    toast.error('Esta ficha não possui orçamento para reenviar');
                                    return;
                                  }
                                  setFichaParaReenviar(ficha);
                                  setShowReenviarModal(true);
                                }}
                                title={!ficha.dados_orcamento ? 'Orçamento não disponível' : 'Reenviar orçamento ao cliente'}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Reenviar
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setFichaParaAprovarManual(ficha);
                                  setShowAprovacaoManualDialog(true);
                                }}
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Aprovação Manual
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              ) : orcamentosEnviados && orcamentosEnviados.length > 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum orçamento encontrado com os filtros aplicados
                </p>
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
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1">FTC {aprov.fichas_tecnicas?.numero_ftc || aprov.numero_ftc}</CardTitle>
                            <p className="text-sm font-medium">{aprov.fichas_tecnicas?.cliente}</p>
                            <p className="text-sm text-muted-foreground truncate">{aprov.fichas_tecnicas?.nome_peca}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                🔗 Via Link
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {aprov.responsavel} • {new Date(aprov.criado_em).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
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

      {/* Modal de Orçamento (Criar) */}
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

      {/* Modal de Visualização de Orçamento (Read-Only) */}
      {fichaParaVisualizar && (
        <OrcamentoModal
          open={showVisualizarModal}
          onClose={() => {
            setShowVisualizarModal(false);
            setFichaParaVisualizar(null);
          }}
          fichaTecnica={converterFichaParaModal(fichaParaVisualizar)}
          onCreateOrcamento={() => {
            // Read-only mode - não deve criar/editar
            setShowVisualizarModal(false);
            setFichaParaVisualizar(null);
          }}
          readOnly={true}
        />
      )}

      {/* Modal de Reenviar Orçamento */}
      {fichaParaReenviar && fichaParaReenviar.dados_orcamento && (
        <EnviarOrcamentoModal
          open={showReenviarModal}
          onClose={() => {
            setShowReenviarModal(false);
            setFichaParaReenviar(null);
          }}
          orcamento={typeof fichaParaReenviar.dados_orcamento === 'string'
            ? JSON.parse(fichaParaReenviar.dados_orcamento)
            : fichaParaReenviar.dados_orcamento}
          fichaTecnica={{
            ...fichaParaReenviar,
            numeroFTC: fichaParaReenviar.numero_ftc,
            formData: {
              ...fichaParaReenviar,
              cliente: fichaParaReenviar.cliente,
              cnpj: fichaParaReenviar.cnpj,
              solicitante: fichaParaReenviar.solicitante,
              telefone: fichaParaReenviar.telefone || fichaParaReenviar.contato,
              email: fichaParaReenviar.email,
              fone_email: fichaParaReenviar.contato,  // Compatibilidade
              nome_peca: fichaParaReenviar.nome_peca,
              quantidade: fichaParaReenviar.quantidade
            }
          }}
          onEnviar={() => {
            toast.success('Orçamento reenviado com sucesso!');
            setShowReenviarModal(false);
            setFichaParaReenviar(null);
            refetchFichasEnviados();
          }}
        />
      )}

      {/* Dialog de Aprovação Manual */}
      <AprovacaoManualDialog
        open={showAprovacaoManualDialog}
        onOpenChange={setShowAprovacaoManualDialog}
        ficha={fichaParaAprovarManual}
      />
    </div>
  );
}
