import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Factory, Play, Pause, CheckCircle2, XCircle, Clock, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { ModuleFilter, FilterValues } from "@/components/ui/module-filter";
import { useModuleFilter } from "@/hooks/useModuleFilter";
import WorkflowBreadcrumb from "@/components/WorkflowBreadcrumb";

export default function Producao() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("aguardando");

  // Estados de filtro para cada tab
  const [filtersAguardandoMat, setFiltersAguardandoMat] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_criacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersAguardandoInicio, setFiltersAguardandoInicio] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_criacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersEmProducao, setFiltersEmProducao] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_inicio",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersPausadas, setFiltersPausadas] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_criacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersConcluidas, setFiltersConcluidas] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_conclusao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });

  // Query: Ordens de Serviço com dados relacionados
  const { data: ordensData, isLoading, refetch } = useQuery({
    queryKey: ['ordens-servico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          fichas_tecnicas(
            cliente,
            nome_peca,
            quantidade,
            servico
          ),
          processos_os(
            processo,
            horas_previstas,
            horas_realizadas,
            status,
            responsavel
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar ordens de serviço:', error);
        toast.error('Erro ao carregar ordens de serviço');
        return [];
      }
      return data || [];
    }
  });

  // Hooks de filtro
  const { filterData: filterAguardandoMat } = useModuleFilter({
    data: ordensData?.filter(os => os.status === 'aguardando_materiais') || [],
    searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_criacao'
  });
  const { filterData: filterAguardandoInicio } = useModuleFilter({
    data: ordensData?.filter(os => os.status === 'aguardando_inicio') || [],
    searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_criacao'
  });
  const { filterData: filterEmProducao } = useModuleFilter({
    data: ordensData?.filter(os => os.status === 'em_producao') || [],
    searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_inicio'
  });
  const { filterData: filterPausadas } = useModuleFilter({
    data: ordensData?.filter(os => os.status === 'pausada') || [],
    searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_criacao'
  });
  const { filterData: filterConcluidas } = useModuleFilter({
    data: ordensData?.filter(os => os.status === 'concluida') || [],
    searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_conclusao'
  });

  // Filtrar por status e aplicar filtros
  const aguardandoMateriais = filterAguardandoMat(filtersAguardandoMat);
  const aguardandoInicio = filterAguardandoInicio(filtersAguardandoInicio);
  const emProducao = filterEmProducao(filtersEmProducao);
  const pausadas = filterPausadas(filtersPausadas);
  const concluidas = filterConcluidas(filtersConcluidas);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: any }> = {
      'aguardando_materiais': { label: 'Ag. Materiais', variant: 'outline', icon: Clock },
      'aguardando_inicio': { label: 'Ag. Início', variant: 'secondary', icon: Clock },
      'em_producao': { label: 'Em Produção', variant: 'default', icon: Play },
      'pausada': { label: 'Pausada', variant: 'destructive', icon: Pause },
      'concluida': { label: 'Concluída', variant: 'default', icon: CheckCircle2 },
      'cancelada': { label: 'Cancelada', variant: 'destructive', icon: XCircle },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const getProcessoStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pendente': { label: 'Pendente', variant: 'outline' },
      'em_execucao': { label: 'Em Execução', variant: 'default' },
      'concluido': { label: 'Concluído', variant: 'secondary' },
      'pausado': { label: 'Pausado', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  // Iniciar produção
  const handleIniciarProducao = async (id: string) => {
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'em_producao',
        data_inicio: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao iniciar produção:', error);
      toast.error('Erro ao iniciar produção');
      return;
    }

    toast.success('Produção iniciada!');
    refetch();
  };

  // Pausar produção
  const handlePausarProducao = async (id: string, motivo: string) => {
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'pausada',
        observacoes: motivo,
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao pausar produção:', error);
      toast.error('Erro ao pausar produção');
      return;
    }

    toast.success('Produção pausada');
    refetch();
  };

  // Retomar produção
  const handleRetomarProducao = async (id: string) => {
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'em_producao',
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao retomar produção:', error);
      toast.error('Erro ao retomar produção');
      return;
    }

    toast.success('Produção retomada!');
    refetch();
  };

  // Concluir produção
  const handleConcluirProducao = async (id: string) => {
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'concluida',
        data_conclusao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao concluir produção:', error);
      toast.error('Erro ao concluir produção');
      return;
    }

    toast.success('Produção concluída!');
    refetch();
  };

  // Calcular progresso de processos
  const calcularProgresso = (processos: any[]) => {
    if (!processos || processos.length === 0) return 0;
    const concluidos = processos.filter(p => p.status === 'concluido').length;
    return Math.round((concluidos / processos.length) * 100);
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
            <Factory className="h-8 w-8 text-purple-600" />
            Módulo de Produção
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de Ordens de Serviço (OS)
          </p>
        </div>
      </div>

      {/* Workflow Breadcrumb */}
      <div className="mb-6">
        <WorkflowBreadcrumb currentStage="em_producao" variant="compact" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="aguardando">
            📦 Ag. Materiais ({aguardandoMateriais.length})
          </TabsTrigger>
          <TabsTrigger value="inicio">
            🚀 Ag. Início ({aguardandoInicio.length})
          </TabsTrigger>
          <TabsTrigger value="producao">
            🏭 Em Produção ({emProducao.length})
          </TabsTrigger>
          <TabsTrigger value="pausadas">
            ⏸️ Pausadas ({pausadas.length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            ✅ Concluídas ({concluidas.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Aguardando Materiais */}
        <TabsContent value="aguardando" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por OS, FTC, cliente ou peça...",
              searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_criacao', label: 'Data de Criação' },
                { value: 'numero_os', label: 'Número OS' },
                { value: 'numero_ftc', label: 'Número FTC' }
              ],
              showDateFilter: true,
              dateField: 'data_criacao'
            }}
            onFilterChange={setFiltersAguardandoMat}
            totalItems={ordensData?.filter(os => os.status === 'aguardando_materiais').length || 0}
            filteredItems={aguardandoMateriais.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Ordens Aguardando Recebimento de Materiais</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : aguardandoMateriais.length > 0 ? (
                <div className="space-y-4">
                  {aguardandoMateriais.map((os: any) => (
                    <Card key={os.id} className="border-l-4 border-l-yellow-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">OS {os.numero_os}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              FTC {os.numero_ftc} - {os.fichas_tecnicas?.cliente}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Peça: {os.fichas_tecnicas?.nome_peca}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criada em: {new Date(os.data_criacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {getStatusBadge(os.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span>Aguardando recebimento de materiais</span>
                          </div>
                          {os.observacoes && (
                            <p className="text-xs text-muted-foreground">
                              Obs: {os.observacoes}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/nova-ficha/${os.ficha_id}`)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Ficha
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleIniciarProducao(os.id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Materiais Recebidos - Iniciar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ordem aguardando materiais
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Aguardando Início */}
        <TabsContent value="inicio" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por OS, FTC, cliente ou peça...",
              searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_criacao', label: 'Data de Criação' },
                { value: 'numero_os', label: 'Número OS' },
                { value: 'numero_ftc', label: 'Número FTC' }
              ],
              showDateFilter: true,
              dateField: 'data_criacao'
            }}
            onFilterChange={setFiltersAguardandoInicio}
            totalItems={ordensData?.filter(os => os.status === 'aguardando_inicio').length || 0}
            filteredItems={aguardandoInicio.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Ordens Prontas para Iniciar Produção</CardTitle>
            </CardHeader>
            <CardContent>
              {aguardandoInicio.length > 0 ? (
                <div className="space-y-4">
                  {aguardandoInicio.map((os: any) => (
                    <Card key={os.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">OS {os.numero_os}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              FTC {os.numero_ftc} - {os.fichas_tecnicas?.cliente}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Peça: {os.fichas_tecnicas?.nome_peca}
                            </p>
                          </div>
                          {getStatusBadge(os.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>Processos:</strong> {os.processos_os?.length || 0}
                          </p>
                          {os.prazo_entrega && (
                            <p className="text-sm">
                              <strong>Prazo:</strong> {new Date(os.prazo_entrega).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/nova-ficha/${os.ficha_id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Ficha
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleIniciarProducao(os.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Produção
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ordem aguardando início
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Em Produção */}
        <TabsContent value="producao" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por OS, FTC, cliente ou peça...",
              searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_inicio', label: 'Data de Início' },
                { value: 'numero_os', label: 'Número OS' },
                { value: 'numero_ftc', label: 'Número FTC' }
              ],
              showDateFilter: true,
              dateField: 'data_inicio'
            }}
            onFilterChange={setFiltersEmProducao}
            totalItems={ordensData?.filter(os => os.status === 'em_producao').length || 0}
            filteredItems={emProducao.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Ordens em Produção</CardTitle>
            </CardHeader>
            <CardContent>
              {emProducao.length > 0 ? (
                <div className="space-y-4">
                  {emProducao.map((os: any) => {
                    const progresso = calcularProgresso(os.processos_os);
                    return (
                      <Card key={os.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">OS {os.numero_os}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                FTC {os.numero_ftc} - {os.fichas_tecnicas?.cliente}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Peça: {os.fichas_tecnicas?.nome_peca}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Iniciado em: {os.data_inicio ? new Date(os.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}
                              </p>
                            </div>
                            {getStatusBadge(os.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Barra de progresso */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progresso dos processos</span>
                                <span className="font-medium">{progresso}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${progresso}%` }}
                                />
                              </div>
                            </div>

                            {/* Lista de processos */}
                            {os.processos_os && os.processos_os.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Processos:</p>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {os.processos_os.map((proc: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{proc.processo}</span>
                                          {getProcessoStatusBadge(proc.status)}
                                        </div>
                                        {proc.responsavel && (
                                          <span className="text-muted-foreground">
                                            Resp.: {proc.responsavel}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {proc.horas_realizadas || 0}h / {proc.horas_previstas || 0}h
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Ações */}
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/nova-ficha/${os.ficha_id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Ficha
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const motivo = prompt('Motivo da pausa:');
                                  if (motivo) handlePausarProducao(os.id, motivo);
                                }}
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (confirm('Confirmar conclusão da produção?')) {
                                    handleConcluirProducao(os.id);
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Concluir
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
                  Nenhuma ordem em produção
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Pausadas */}
        <TabsContent value="pausadas" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por OS, FTC, cliente ou peça...",
              searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_criacao', label: 'Data de Criação' },
                { value: 'numero_os', label: 'Número OS' },
                { value: 'numero_ftc', label: 'Número FTC' }
              ],
              showDateFilter: true,
              dateField: 'data_criacao'
            }}
            onFilterChange={setFiltersPausadas}
            totalItems={ordensData?.filter(os => os.status === 'pausada').length || 0}
            filteredItems={pausadas.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Produção Pausadas</CardTitle>
            </CardHeader>
            <CardContent>
              {pausadas.length > 0 ? (
                <div className="space-y-4">
                  {pausadas.map((os: any) => (
                    <Card key={os.id} className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">OS {os.numero_os}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              FTC {os.numero_ftc} - {os.fichas_tecnicas?.cliente}
                            </p>
                          </div>
                          {getStatusBadge(os.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {os.observacoes && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                Motivo da Pausa:
                              </p>
                              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                                {os.observacoes}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/nova-ficha/${os.ficha_id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Ficha
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRetomarProducao(os.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Retomar Produção
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ordem pausada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Concluídas */}
        <TabsContent value="concluidas" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por OS, FTC, cliente ou peça...",
              searchFields: ['numero_os', 'numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_conclusao', label: 'Data de Conclusão' },
                { value: 'numero_os', label: 'Número OS' },
                { value: 'numero_ftc', label: 'Número FTC' }
              ],
              showDateFilter: true,
              dateField: 'data_conclusao'
            }}
            onFilterChange={setFiltersConcluidas}
            totalItems={ordensData?.filter(os => os.status === 'concluida').length || 0}
            filteredItems={concluidas.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Produção Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              {concluidas.length > 0 ? (
                <div className="space-y-4">
                  {concluidas.map((os: any) => (
                    <Card key={os.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">OS {os.numero_os}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              FTC {os.numero_ftc} - {os.fichas_tecnicas?.cliente}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Concluída em: {os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>
                          {getStatusBadge(os.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Produção finalizada</span>
                          </div>
                          {os.processos_os && os.processos_os.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {os.processos_os.length} processos concluídos
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/nova-ficha/${os.ficha_id}`)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Ficha
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ordem concluída
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
