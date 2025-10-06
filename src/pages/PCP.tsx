import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, AlertCircle, FileText, Eye, Clock } from "lucide-react";
import { toast } from "sonner";

export default function PCP() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("aguardando");

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
            servico
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar aprovações PCP:', error);
        toast.error('Erro ao carregar aprovações PCP');
        return [];
      }
      return data || [];
    }
  });

  // Filtrar por status
  const aguardando = aprovacoesData?.filter(a => a.status === 'aguardando') || [];
  const aprovados = aprovacoesData?.filter(a => a.status === 'aprovado') || [];
  const rejeitados = aprovacoesData?.filter(a => a.status === 'rejeitado') || [];
  const alteracoes = aprovacoesData?.filter(a => a.status === 'alteracao_necessaria') || [];

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

  // Solicitar alteração
  const handleSolicitarAlteracao = async (id: string, observacoes: string) => {
    const { error } = await supabase
      .from('aprovacoes_pcp')
      .update({
        status: 'alteracao_necessaria',
        observacoes_pcp: observacoes,
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao solicitar alteração:', error);
      toast.error('Erro ao solicitar alteração');
      return;
    }

    toast.success('Alteração solicitada');
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aguardando Validação
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{aguardando.length}</div>
            <p className="text-xs text-muted-foreground mt-1">requisições pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aprovados
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aprovados.length}</div>
            <p className="text-xs text-muted-foreground mt-1">liberados para compra</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejeitados
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejeitados.length}</div>
            <p className="text-xs text-muted-foreground mt-1">não aprovados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alterações Solicitadas
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alteracoes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">requerem ajustes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aguardando">
            ⏳ Ag. Validação ({aguardando.length})
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
                          {/* Checklist de Validação */}
                          <div className="border rounded-lg p-3 bg-muted/30">
                            <p className="text-sm font-medium mb-2">Checklist de Validação:</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                {aprov.medidas_validadas ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span>Medidas validadas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {aprov.desenho_validado ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span>Desenho validado</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {aprov.processos_validados ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span>Processos validados</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {aprov.material_disponivel ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span>Material disponível</span>
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
                          <div className="flex gap-2 mt-4">
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
                              onClick={() => handleAprovar(aprov.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const obs = prompt('Observações para alteração:');
                                if (obs) handleSolicitarAlteracao(aprov.id, obs);
                              }}
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Solicitar Alteração
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
      </Tabs>
    </div>
  );
}
