import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ShoppingCart, DollarSign, ClipboardCheck, Factory, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const navigate = useNavigate();

  // Query: Total de fichas em cada estágio do workflow
  const { data: countRascunho } = useQuery({
    queryKey: ['dashboard-count-rascunho'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fichas_tecnicas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rascunho');
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countAguardandoCotacao } = useQuery({
    queryKey: ['dashboard-count-ag-cotacao'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fichas_tecnicas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_cotacao_compras');
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countAguardandoOrcamento } = useQuery({
    queryKey: ['dashboard-count-ag-orcamento'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fichas_tecnicas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_orcamento_comercial');
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countEnviadas } = useQuery({
    queryKey: ['dashboard-count-enviadas'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fichas_tecnicas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'orcamento_enviado_cliente');
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countAprovadas } = useQuery({
    queryKey: ['dashboard-count-aprovadas'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fichas_tecnicas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'orcamento_aprovado_cliente');
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countAguardandoPCP } = useQuery({
    queryKey: ['dashboard-count-aguardando-pcp'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('requisicoes_compra')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_pcp');
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countEmCompras } = useQuery({
    queryKey: ['dashboard-count-em-compras'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('requisicoes_compra')
        .select('*', { count: 'exact', head: true })
        .in('status', ['aguardando_pcp', 'aprovada_pcp', 'em_compra', 'pedido_enviado', 'em_transito', 'recebido']);
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countEmProducao } = useQuery({
    queryKey: ['dashboard-count-em-producao'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true })
        .in('status', ['aguardando_materiais', 'aguardando_inicio', 'em_producao', 'pausada']);
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: countFinalizadas } = useQuery({
    queryKey: ['dashboard-count-finalizadas'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluida');
      if (error) throw error;
      return count || 0;
    }
  });

  // Total geral de fichas
  const totalFichas = (countRascunho || 0) + (countAguardandoCotacao || 0) + (countAguardandoOrcamento || 0) +
                      (countEnviadas || 0) + (countAprovadas || 0) + (countEmCompras || 0) +
                      (countEmProducao || 0) + (countFinalizadas || 0);
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Main Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nova Ficha Técnica Module */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/30" onClick={() => navigate('/nova-ficha')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-primary to-primary/80 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-primary">Nova Ficha Técnica</CardTitle>
              <p className="text-muted-foreground">
                Criar uma nova ficha técnica de cotação
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Preencha dados do cliente, materiais e serviços
              </div>
            </CardContent>
          </Card>

          {/* Consultar Fichas Module */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-secondary/30" onClick={() => navigate('/consultar-fichas')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-secondary to-secondary/80 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-secondary flex items-center justify-center gap-2">
                Consultar Fichas
                {totalFichas > 0 && (
                  <Badge variant="secondary" className="text-sm px-2 py-0.5">
                    {totalFichas}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground">
                Visualizar, editar e gerenciar fichas existentes
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Busque, filtre e gerencie suas fichas salvas
              </div>
            </CardContent>
          </Card>

          {/* NOVOS MÓDULOS DEPARTAMENTAIS */}

          {/* Módulo Compras */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-orange-500/30" onClick={() => navigate('/compras')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-orange-600 flex items-center justify-center gap-2">
                🛒 Compras
                {((countAguardandoCotacao || 0) + (countEmCompras || 0)) > 0 && (
                  <Badge className="text-sm px-2 py-0.5 bg-orange-500 text-white hover:bg-orange-600">
                    {(countAguardandoCotacao || 0) + (countEmCompras || 0)}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground">
                Cotações e requisições de compra
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Gerencie cotações, requisições e materiais
              </div>
            </CardContent>
          </Card>

          {/* Módulo Comercial */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-500/30" onClick={() => navigate('/comercial')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-green-600 flex items-center justify-center gap-2">
                💰 Comercial
                {((countAguardandoOrcamento || 0) + (countEnviadas || 0) + (countAprovadas || 0)) > 0 && (
                  <Badge className="text-sm px-2 py-0.5 bg-green-500 text-white hover:bg-green-600">
                    {(countAguardandoOrcamento || 0) + (countEnviadas || 0) + (countAprovadas || 0)}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground">
                Orçamentos e aprovações
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Gerencie orçamentos e respostas de clientes
              </div>
            </CardContent>
          </Card>

          {/* Módulo PCP */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500/30" onClick={() => navigate('/pcp')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardCheck className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-blue-600 flex items-center justify-center gap-2">
                🏭 PCP
                {(countAguardandoPCP || 0) > 0 && (
                  <Badge className="text-sm px-2 py-0.5 bg-blue-500 text-white hover:bg-blue-600">
                    {countAguardandoPCP}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground">
                Validação de requisições
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Valide medidas, desenhos e processos
              </div>
            </CardContent>
          </Card>

          {/* Módulo Produção */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-500/30" onClick={() => navigate('/producao')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Factory className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-purple-600 flex items-center justify-center gap-2">
                ⚙️ Produção
                {(countEmProducao || 0) > 0 && (
                  <Badge className="text-sm px-2 py-0.5 bg-purple-500 text-white hover:bg-purple-600">
                    {countEmProducao}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground">
                Ordens de Serviço (OS)
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Gerencie OS e processos de produção
              </div>
            </CardContent>
          </Card>

          {/* Módulo Controle de Produção */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-cyan-500/30" onClick={() => navigate('/controle-producao')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-cyan-600">👷 Controle de Produção</CardTitle>
              <p className="text-muted-foreground">
                Alocação de Processos
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Alocar funcionários aos processos das OSs
              </div>
            </CardContent>
          </Card>

          {/* Módulo Cadastros */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-amber-500/30" onClick={() => navigate('/cadastros')}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl text-amber-600">📋 Cadastros</CardTitle>
              <p className="text-muted-foreground">
                Clientes, Funcionários e Usuários
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Gerencie cadastros e permissões
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}