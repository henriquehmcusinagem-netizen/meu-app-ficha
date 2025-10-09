import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, AlertCircle, FileText, Eye, Clock, Edit, Info } from "lucide-react";
import { toast } from "sonner";
import { AprovacoesTable } from "@/components/FichaTecnica/AprovacoesTable";
import { ModuleFilter, FilterValues } from "@/components/ui/module-filter";
import { useModuleFilter } from "@/hooks/useModuleFilter";
import { validarProcessos, formatarValidacao } from "@/utils/pcpValidation";
import WorkflowBreadcrumb from "@/components/WorkflowBreadcrumb";

export default function PCP() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("aguardando");

  // Estados de filtro para cada tab
  const [filtersAguardando, setFiltersAguardando] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_criacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersAprovados, setFiltersAprovados] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_validacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersRejeitados, setFiltersRejeitados] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_validacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });
  const [filtersAlteracoes, setFiltersAlteracoes] = useState<FilterValues>({
    searchTerm: "",
    sortBy: "data_criacao",
    sortOrder: "desc",
    dateFrom: undefined,
    dateTo: undefined
  });

  // Query: Aprovações PCP com dados relacionados
  const { data: aprovacoesData, isLoading, refetch } = useQuery({
    queryKey: ['aprovacoes-pcp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aprovacoes_pcp')
        .select(`
          *,
          requisicoes_compra(
            tipo,
            observacoes,
            itens_requisicao(descricao, quantidade, unidade)
          ),
          fichas_tecnicas(
            cliente,
            nome_peca,
            quantidade,
            servico,
            desenho_finalizado,
            torno_grande,
            torno_pequeno,
            cnc_tf,
            fresa_furad,
            plasma_oxicorte,
            dobra,
            calandra,
            macarico_solda,
            des_montg,
            balanceamento,
            mandrilhamento,
            tratamento,
            pintura_horas,
            lavagem_acab,
            programacao_cam,
            eng_tec,
            torno_cnc,
            centro_usinagem,
            fresa,
            furadeira,
            macarico,
            solda,
            serra,
            caldeiraria,
            montagem,
            lavagem,
            acabamento,
            tecnico_horas
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar aprovações PCP:', error);
        toast.error('Erro ao carregar aprovações PCP');
        return [];
      }
      return data || [];
    }
  });

  // Query: Contar aprovações de FTC cliente
  const { data: totalAprovacoesCliente } = useQuery({
    queryKey: ['aprovacoes-ftc-cliente-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('aprovacoes_ftc_cliente')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  // Hooks de filtro
  const { filterData: filterAguardando } = useModuleFilter({
    data: aprovacoesData?.filter(a => a.status === 'aguardando') || [],
    searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_criacao'
  });
  const { filterData: filterAprovados } = useModuleFilter({
    data: aprovacoesData?.filter(a => a.status === 'aprovado') || [],
    searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_validacao'
  });
  const { filterData: filterRejeitados } = useModuleFilter({
    data: aprovacoesData?.filter(a => a.status === 'rejeitado') || [],
    searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_validacao'
  });
  const { filterData: filterAlteracoes } = useModuleFilter({
    data: aprovacoesData?.filter(a => a.status === 'alteracao_necessaria') || [],
    searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
    dateField: 'data_criacao'
  });

  // Filtrar por status e aplicar filtros
  const aguardando = filterAguardando(filtersAguardando);
  const aprovados = filterAprovados(filtersAprovados);
  const rejeitados = filterRejeitados(filtersRejeitados);
  const alteracoes = filterAlteracoes(filtersAlteracoes);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'aguardando': { label: 'Aguardando', variant: 'outline' },
      'aprovado': { label: 'Aprovado', variant: 'default' },
      'rejeitado': { label: 'Rejeitado', variant: 'destructive' },
      'alteracao_necessaria': { label: 'Alteração Necessária', variant: 'secondary' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const tipoMap: Record<string, string> = {
      'compra': 'Materiais',
      'corte': 'Corte/Fabricação',
      'ambos': 'Materiais + Corte',
    };
    return <Badge variant="outline">{tipoMap[tipo] || tipo}</Badge>;
  };

  // Atualizar checkbox individual
  const handleCheckboxChange = async (
    aprovacaoId: string,
    campo: 'medidas_validadas' | 'desenho_validado' | 'processos_validados' | 'material_disponivel',
    valor: boolean
  ) => {
    const { error } = await supabase
      .from('aprovacoes_pcp')
      .update({ [campo]: valor })
      .eq('id', aprovacaoId);

    if (error) {
      console.error('Erro ao atualizar checkbox:', error);
      toast.error('Erro ao atualizar validação');
      return;
    }

    // Aguardar refetch para garantir que UI atualize imediatamente
    await refetch();
  };

  // Aprovar requisição
  const handleAprovar = async (id: string) => {
    const { error } = await supabase
      .from('aprovacoes_pcp')
      .update({
        status: 'aprovado',
        data_validacao: new Date().toISOString(),
        medidas_validadas: true,
        desenho_validado: true,
        processos_validados: true,
        material_disponivel: true,
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar requisição');
      return;
    }

    // Atualizar status na requisição de compra
    const aprovacao = aprovacoesData?.find(a => a.id === id);
    if (aprovacao?.requisicao_id) {
      await supabase
        .from('requisicoes_compra')
        .update({ status: 'aprovada_pcp' })
        .eq('id', aprovacao.requisicao_id);
    }

    toast.success('Requisição aprovada pelo PCP!');
    refetch();
  };

  // Rejeitar requisição
  const handleRejeitar = async (id: string, motivo: string) => {
    const { error } = await supabase
      .from('aprovacoes_pcp')
      .update({
        status: 'rejeitado',
        data_validacao: new Date().toISOString(),
        motivo_rejeicao: motivo,
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar requisição');
      return;
    }

    // Atualizar status na requisição de compra
    const aprovacao = aprovacoesData?.find(a => a.id === id);
    if (aprovacao?.requisicao_id) {
      await supabase
        .from('requisicoes_compra')
        .update({ status: 'rejeitada_pcp' })
        .eq('id', aprovacao.requisicao_id);
    }

    toast.success('Requisição rejeitada');
    refetch();
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
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
            Módulo PCP
          </h1>
          <p className="text-muted-foreground">
            Validação de Requisições - Planejamento e Controle da Produção
          </p>
        </div>
      </div>

      {/* Workflow Breadcrumb */}
      <div className="mb-6">
        <WorkflowBreadcrumb currentStage="em_compras" variant="compact" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="aguardando">
            ⏳ Ag. Validação ({aguardando.length})
          </TabsTrigger>
          <TabsTrigger value="aprovacoes-clientes">
            📋 Aprovações ({totalAprovacoesCliente})
          </TabsTrigger>
          <TabsTrigger value="aprovados">
            ✅ Aprovados ({aprovados.length})
          </TabsTrigger>
          <TabsTrigger value="rejeitados">
            ❌ Rejeitados ({rejeitados.length})
          </TabsTrigger>
          <TabsTrigger value="alteracoes">
            🔄 Alterações ({alteracoes.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Aguardando Validação */}
        <TabsContent value="aguardando" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por FTC, cliente ou peça...",
              searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_criacao', label: 'Data de Criação' },
                { value: 'numero_ftc', label: 'Número FTC' },
                { value: 'fichas_tecnicas.cliente', label: 'Cliente' }
              ],
              showDateFilter: true,
              dateField: 'data_criacao'
            }}
            onFilterChange={setFiltersAguardando}
            totalItems={aprovacoesData?.filter(a => a.status === 'aguardando').length || 0}
            filteredItems={aguardando.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Requisições Aguardando Validação do PCP</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : aguardando.length > 0 ? (
                <div className="space-y-4">
                  {aguardando.map((aprov: any) => (
                    <Card key={aprov.id} className="border-l-4 border-l-yellow-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {aprov.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: <strong>{aprov.fichas_tecnicas?.cliente}</strong>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Peça: {aprov.fichas_tecnicas?.nome_peca}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criada em: {new Date(aprov.data_criacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(aprov.status)}
                            {getTipoBadge(aprov.tipo)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Checklist de Validação - Checkboxes Interativos */}
                          <div className="border rounded-lg p-3 bg-muted/30">
                            <p className="text-sm font-medium mb-2">Checklist de Validação:</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`medidas-${aprov.id}`}
                                  checked={aprov.medidas_validadas}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(aprov.id, 'medidas_validadas', checked as boolean)
                                  }
                                />
                                <label htmlFor={`medidas-${aprov.id}`} className="cursor-pointer">
                                  Medidas validadas
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`desenho-${aprov.id}`}
                                  checked={aprov.desenho_validado}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(aprov.id, 'desenho_validado', checked as boolean)
                                  }
                                />
                                <label htmlFor={`desenho-${aprov.id}`} className="cursor-pointer">
                                  Desenho validado
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`processos-${aprov.id}`}
                                  checked={aprov.processos_validados}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(aprov.id, 'processos_validados', checked as boolean)
                                  }
                                />
                                <label htmlFor={`processos-${aprov.id}`} className="cursor-pointer">
                                  Processos validados
                                </label>
                                {aprov.fichas_tecnicas && (() => {
                                  const validacao = validarProcessos(aprov.fichas_tecnicas);
                                  return validacao.alertas.length > 0 ? (
                                    <Info
                                      className="h-4 w-4 text-yellow-600 cursor-help"
                                      title={formatarValidacao(validacao)}
                                    />
                                  ) : null;
                                })()}
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`material-${aprov.id}`}
                                  checked={aprov.material_disponivel}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(aprov.id, 'material_disponivel', checked as boolean)
                                  }
                                />
                                <label htmlFor={`material-${aprov.id}`} className="cursor-pointer">
                                  Material disponível
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Informações da Requisição */}
                          {aprov.requisicoes_compra && (
                            <div className="space-y-1 text-sm">
                              <p>
                                <strong>Itens da Requisição:</strong>{" "}
                                {aprov.requisicoes_compra.itens_requisicao?.length || 0}
                              </p>
                              {aprov.requisicoes_compra.observacoes && (
                                <p className="text-xs text-muted-foreground">
                                  Obs: {aprov.requisicoes_compra.observacoes}
                                </p>
                              )}
                              {aprov.requisicoes_compra.itens_requisicao &&
                               aprov.requisicoes_compra.itens_requisicao.length > 0 && (
                                <div className="mt-2 p-2 bg-muted/20 rounded text-xs space-y-1">
                                  {aprov.requisicoes_compra.itens_requisicao.slice(0, 3).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{item.descricao}</span>
                                      <span className="text-muted-foreground">
                                        {item.quantidade} {item.unidade}
                                      </span>
                                    </div>
                                  ))}
                                  {aprov.requisicoes_compra.itens_requisicao.length > 3 && (
                                    <p className="text-center">
                                      ... e mais {aprov.requisicoes_compra.itens_requisicao.length - 3}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Ações */}
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/nova-ficha/${aprov.ficha_id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Ficha
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/nova-ficha/${aprov.ficha_id}`, '_blank')}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Ficha
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAprovar(aprov.id)}
                              disabled={
                                !aprov.medidas_validadas ||
                                !aprov.desenho_validado ||
                                !aprov.processos_validados ||
                                !aprov.material_disponivel
                              }
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const motivo = prompt('Motivo da rejeição:');
                                if (motivo) handleRejeitar(aprov.id, motivo);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma requisição aguardando validação
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Aprovados */}
        <TabsContent value="aprovados" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por FTC, cliente ou peça...",
              searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_validacao', label: 'Data de Aprovação' },
                { value: 'numero_ftc', label: 'Número FTC' },
                { value: 'fichas_tecnicas.cliente', label: 'Cliente' }
              ],
              showDateFilter: true,
              dateField: 'data_validacao'
            }}
            onFilterChange={setFiltersAprovados}
            totalItems={aprovacoesData?.filter(a => a.status === 'aprovado').length || 0}
            filteredItems={aprovados.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Requisições Aprovadas pelo PCP</CardTitle>
            </CardHeader>
            <CardContent>
              {aprovados.length > 0 ? (
                <div className="space-y-4">
                  {aprovados.map((aprov: any) => (
                    <Card key={aprov.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {aprov.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {aprov.fichas_tecnicas?.cliente}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Aprovado em: {aprov.data_validacao ? new Date(aprov.data_validacao).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(aprov.status)}
                            {getTipoBadge(aprov.tipo)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Todas as validações OK</span>
                          </div>
                          {aprov.observacoes_pcp && (
                            <p className="text-xs text-muted-foreground">
                              Obs PCP: {aprov.observacoes_pcp}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/nova-ficha/${aprov.ficha_id}`)}
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
                  Nenhuma requisição aprovada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Rejeitados */}
        <TabsContent value="rejeitados" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por FTC, cliente ou peça...",
              searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_validacao', label: 'Data de Rejeição' },
                { value: 'numero_ftc', label: 'Número FTC' },
                { value: 'fichas_tecnicas.cliente', label: 'Cliente' }
              ],
              showDateFilter: true,
              dateField: 'data_validacao'
            }}
            onFilterChange={setFiltersRejeitados}
            totalItems={aprovacoesData?.filter(a => a.status === 'rejeitado').length || 0}
            filteredItems={rejeitados.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Requisições Rejeitadas pelo PCP</CardTitle>
            </CardHeader>
            <CardContent>
              {rejeitados.length > 0 ? (
                <div className="space-y-4">
                  {rejeitados.map((aprov: any) => (
                    <Card key={aprov.id} className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {aprov.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {aprov.fichas_tecnicas?.cliente}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rejeitado em: {aprov.data_validacao ? new Date(aprov.data_validacao).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(aprov.status)}
                            {getTipoBadge(aprov.tipo)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aprov.motivo_rejeicao && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                Motivo da Rejeição:
                              </p>
                              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                                {aprov.motivo_rejeicao}
                              </p>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/nova-ficha/${aprov.ficha_id}`)}
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
                  Nenhuma requisição rejeitada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Alterações Solicitadas */}
        <TabsContent value="alteracoes" className="space-y-4">
          <ModuleFilter
            config={{
              searchPlaceholder: "Buscar por FTC, cliente ou peça...",
              searchFields: ['numero_ftc', 'fichas_tecnicas.cliente', 'fichas_tecnicas.nome_peca'],
              sortOptions: [
                { value: 'data_criacao', label: 'Data de Criação' },
                { value: 'numero_ftc', label: 'Número FTC' },
                { value: 'fichas_tecnicas.cliente', label: 'Cliente' }
              ],
              showDateFilter: true,
              dateField: 'data_criacao'
            }}
            onFilterChange={setFiltersAlteracoes}
            totalItems={aprovacoesData?.filter(a => a.status === 'alteracao_necessaria').length || 0}
            filteredItems={alteracoes.length}
          />
          <Card>
            <CardHeader>
              <CardTitle>Requisições com Alterações Solicitadas</CardTitle>
            </CardHeader>
            <CardContent>
              {alteracoes.length > 0 ? (
                <div className="space-y-4">
                  {alteracoes.map((aprov: any) => (
                    <Card key={aprov.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">FTC {aprov.numero_ftc}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {aprov.fichas_tecnicas?.cliente}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(aprov.status)}
                            {getTipoBadge(aprov.tipo)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aprov.observacoes_pcp && (
                            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                Alterações Solicitadas:
                              </p>
                              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                                {aprov.observacoes_pcp}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/nova-ficha/${aprov.ficha_id}`)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Ficha
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAprovar(aprov.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Aprovar Agora
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma alteração solicitada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Aprovações de Clientes */}
        <TabsContent value="aprovacoes-clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aprovações de Clientes - Fichas Técnicas</CardTitle>
              <CardDescription>
                Feedback dos clientes sobre fichas técnicas enviadas via email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AprovacoesTable tipo="ftc" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
