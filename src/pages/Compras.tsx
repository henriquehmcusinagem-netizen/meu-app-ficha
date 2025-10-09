import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, PackageCheck, Truck, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { CotacaoMateriaisModal } from "@/components/Compras/CotacaoMateriaisModal";
import { ModuleFilter, FilterValues } from "@/components/ui/module-filter";
import { useModuleFilter } from "@/hooks/useModuleFilter";
import WorkflowBreadcrumb from "@/components/WorkflowBreadcrumb";

export default function Compras() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cotacao");
  const [fichaParaCotar, setFichaParaCotar] = useState<any>(null);
  const [processando, setProcessando] = useState(false);
  const [filtersCotacao, setFiltersCotacao] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_ultima_edicao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersRequisicoes, setFiltersRequisicoes] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_criacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });

  // Query 1: Fichas aguardando cotação
  const { data: fichasCotacao, isLoading: loadingCotacao, refetch: refetchCotacao } = useQuery({
    queryKey: ['fichas-cotacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select('*, materiais(*)')
        .eq('status', 'aguardando_cotacao_compras')
        .order('data_ultima_edicao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar fichas para cotação:', error);
        toast.error('Erro ao carregar fichas para cotação');
        return [];
      }
      return data || [];
    }
  });

  // Query 2: Requisições de compra (após aprovação de orçamento)
  const { data: requisicoes, isLoading: loadingRequisicoes, refetch: refetchRequisicoes } = useQuery({
    queryKey: ['requisicoes-compra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisicoes_compra')
        .select(`
          *,
          itens_requisicao(*),
          fichas_tecnicas(cliente, nome_peca)
        `)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar requisições:', error);
        return [];
      }
      return data || [];
    }
  });

  // Hooks de filtragem
  const { filterData: filterCotacao } = useModuleFilter({
    data: fichasCotacao || [],
    searchFields: ['numero_ftc', 'cliente', 'nome_peca'],
    dateField: 'data_ultima_edicao'
  });

  const { filterData: filterRequisicoes } = useModuleFilter({
    data: requisicoes || [],
    searchFields: ['numero_ftc', 'fichas_tecnicas.cliente'],
    dateField: 'data_criacao'
  });

  // Aplicar filtros
  const fichasCotacaoFiltradas = filterCotacao(filtersCotacao);
  const requisicoesTodas = filterRequisicoes(filtersRequisicoes);

  // Filtrar requisições por status
  const requisicoesAguardandoPCP = requisicoesTodas.filter(r => r.status === 'aguardando_pcp');
  const requisicoesAprovadas = requisicoesTodas.filter(r => ['aprovada_pcp', 'em_compra'].includes(r.status || ''));
  const requisicoesEmTransito = requisicoesTodas.filter(r => ['pedido_enviado', 'em_transito'].includes(r.status || ''));
  const requisicoesRecebidas = requisicoesTodas.filter(r => r.status === 'recebido');

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'aguardando_pcp': { label: 'Ag. PCP', variant: 'outline' },
      'aprovada_pcp': { label: 'Aprovada PCP', variant: 'default' },
      'em_compra': { label: 'Em Compra', variant: 'secondary' },
      'pedido_enviado': { label: 'Pedido Enviado', variant: 'default' },
      'em_transito': { label: 'Em Trânsito', variant: 'default' },
      'recebido': { label: 'Recebido', variant: 'default' },
      'rejeitada_pcp': { label: 'Rejeitada', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Fazer pedido (atualizar status para pedido_enviado)
  const handleFazerPedido = async (requisicaoId: string) => {
    setProcessando(true);
    try {
      const { error } = await supabase
        .from('requisicoes_compra')
        .update({
          status: 'pedido_enviado',
          data_pedido_enviado: new Date().toISOString(),
        })
        .eq('id', requisicaoId);

      if (error) throw error;

      toast.success('Pedido enviado com sucesso!', {
        description: 'Requisição movida para Em Trânsito',
      });

      refetchRequisicoes();
    } catch (error) {
      console.error('Erro ao fazer pedido:', error);
      toast.error('Erro ao enviar pedido', {
        description: 'Tente novamente ou contate o suporte',
      });
    } finally {
      setProcessando(false);
    }
  };

  // Marcar como recebido
  const handleMarcarRecebido = async (requisicaoId: string) => {
    setProcessando(true);
    try {
      const { error } = await supabase
        .from('requisicoes_compra')
        .update({
          status: 'recebido',
          data_recebimento_completo: new Date().toISOString(),
        })
        .eq('id', requisicaoId);

      if (error) throw error;

      toast.success('Material marcado como recebido!', {
        description: 'Requisição concluída',
      });

      refetchRequisicoes();
    } catch (error) {
      console.error('Erro ao marcar recebido:', error);
      toast.error('Erro ao marcar como recebido', {
        description: 'Tente novamente ou contate o suporte',
      });
    } finally {
      setProcessando(false);
    }
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
            <ShoppingCart className="h-8 w-8 text-orange-600" />
            Módulo de Compras
          </h1>
          <p className="text-muted-foreground">
            Gerencie cotações, requisições e materiais
          </p>
        </div>
      </div>

      {/* Workflow Breadcrumb - Dinâmico baseado na aba ativa */}
      <div className="mb-6">
        <WorkflowBreadcrumb
          currentStage={activeTab === 'cotacao' ? 'aguardando_cotacao_compras' : 'em_compras'}
          variant="compact"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cotacao">
            📊 Ag. Cotação ({fichasCotacao?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requisicoes">
            🛍️ Requisições ({requisicoesAguardandoPCP.length})
          </TabsTrigger>
          <TabsTrigger value="em-compra">
            💰 Em Compra ({requisicoesAprovadas.length})
          </TabsTrigger>
          <TabsTrigger value="transito">
            📦 Em Trânsito ({requisicoesEmTransito.length})
          </TabsTrigger>
          <TabsTrigger value="recebidos">
            ✅ Recebidos ({requisicoesRecebidas.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Aguardando Cotação */}
        <TabsContent value="cotacao" className="space-y-4">
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
            onFilterChange={setFiltersCotacao}
            totalItems={fichasCotacao?.length || 0}
            filteredItems={fichasCotacaoFiltradas.length}
          />

          <Card>
            <CardHeader>
              <CardTitle>Fichas Aguardando Cotação de Materiais</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCotacao ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : fichasCotacaoFiltradas.length > 0 ? (
                <div className="space-y-4">
                  {fichasCotacaoFiltradas.map((ficha: any) => (
                    <Card key={ficha.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-base">FTC {ficha.numero_ftc}</CardTitle>
                            <span className="text-sm text-muted-foreground">
                              {ficha.cliente}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {ficha.materiais?.length || 0} materiais
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setFichaParaCotar(ficha)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Cotar
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : fichasCotacao && fichasCotacao.length > 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ficha encontrada com os filtros aplicados
                </p>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ficha aguardando cotação
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Requisições (Aguardando PCP) */}
        <TabsContent value="requisicoes" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por FTC ou cliente...",
              searchFields: ['numero_ftc', 'fichas_tecnicas.cliente'],
              sortOptions: [
                { value: 'data_criacao', label: 'Data de criação' },
                { value: 'numero_ftc', label: 'Número FTC' }
              ],
              showDateFilter: true,
              dateField: 'data_criacao'
            }}
            onFilterChange={setFiltersRequisicoes}
            totalItems={requisicoes?.length || 0}
            filteredItems={requisicoesTodas.length}
          />

          <Card>
            <CardHeader>
              <CardTitle>Requisições de Compra - Aguardando Validação do PCP</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRequisicoes ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : requisicoesAguardandoPCP.length > 0 ? (
                <div className="space-y-4">
                  {requisicoesAguardandoPCP.map((req: any) => (
                    <Card key={req.id} className="border-l-4 border-l-yellow-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {req.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {req.fichas_tecnicas?.cliente}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Criada em: {new Date(req.data_criacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm">
                            Tipo: <Badge variant="outline">{req.tipo === 'compra' ? 'Materiais' : 'Corte/Fabricação'}</Badge>
                          </p>
                          <p className="text-sm">
                            Itens: {req.itens_requisicao?.length || 0}
                          </p>
                          {req.observacoes && (
                            <p className="text-xs text-muted-foreground">
                              Obs: {req.observacoes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma requisição aguardando validação do PCP
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Em Compra (Aprovadas pelo PCP) */}
        <TabsContent value="em-compra" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Requisições Aprovadas - Em Processo de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              {requisicoesAprovadas.length > 0 ? (
                <div className="space-y-4">
                  {requisicoesAprovadas.map((req: any) => (
                    <Card key={req.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {req.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {req.fichas_tecnicas?.cliente}
                            </p>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm">Itens: {req.itens_requisicao?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">
                            Aprovada em: {req.data_aprovacao_pcp ? new Date(req.data_aprovacao_pcp).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFazerPedido(req.id)}
                            disabled={processando}
                          >
                            <PackageCheck className="h-4 w-4 mr-2" />
                            Fazer Pedido
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma requisição em processo de compra
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Em Trânsito */}
        <TabsContent value="transito" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais em Trânsito</CardTitle>
            </CardHeader>
            <CardContent>
              {requisicoesEmTransito.length > 0 ? (
                <div className="space-y-4">
                  {requisicoesEmTransito.map((req: any) => (
                    <Card key={req.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {req.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {req.fichas_tecnicas?.cliente}
                            </p>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="h-4 w-4" />
                            <span>Materiais a caminho</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcarRecebido(req.id)}
                            disabled={processando}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar como Recebido
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum material em trânsito
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Recebidos */}
        <TabsContent value="recebidos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais Recebidos</CardTitle>
            </CardHeader>
            <CardContent>
              {requisicoesRecebidas.length > 0 ? (
                <div className="space-y-4">
                  {requisicoesRecebidas.map((req: any) => (
                    <Card key={req.id} className="border-l-4 border-l-green-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {req.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {req.fichas_tecnicas?.cliente}
                            </p>
                          </div>
                          <Badge className="bg-green-600">Recebido</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Recebido em: {req.data_recebimento_completo ? new Date(req.data_recebimento_completo).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum material recebido
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Cotação de Materiais */}
      <CotacaoMateriaisModal
        ficha={fichaParaCotar}
        open={!!fichaParaCotar}
        onOpenChange={(open) => !open && setFichaParaCotar(null)}
        onSuccess={refetchCotacao}
      />
    </div>
  );
}
