import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Trash2, FileText, Calendar, User, Search, Filter, Eye, Home, Download, Printer, ArrowLeft, ShoppingCart, Factory, CheckCircle2, Clock, Play, Pause } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FichaSalva, Foto, STATUS_CONFIG, StatusFicha } from '@/types/ficha-tecnica';
import { formatCurrency } from '@/utils/helpers';
import { UniversalFichaTable } from '@/components/FichaTecnica/UniversalFichaTable';
import { RevertConfirmModal } from '@/components/FichaTecnica/RevertConfirmModal';
import { OrcamentoModal } from '@/components/FichaTecnica/OrcamentoModal';
import { generateHTMLContent } from '@/utils/htmlGenerator';
import { useFichasQuery } from '@/hooks/useFichasQuery';
import { estornarFicha } from '@/utils/supabaseStorage';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ConsultarFichas() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [filteredFichas, setFilteredFichas] = useState<FichaSalva[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dataUltimaEdicao');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [fichaToEdit, setFichaToEdit] = useState<FichaSalva | null>(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [fichaToRevert, setFichaToRevert] = useState<FichaSalva | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);
  const [fichaParaOrcamento, setFichaParaOrcamento] = useState<FichaSalva | null>(null);

  // Configuração da paginação - 8 fichas para melhor visualização
  const ITEMS_PER_PAGE = 8;
  const pagination = usePagination({
    totalItems: filteredFichas.length,
    itemsPerPage: ITEMS_PER_PAGE
  });

  // Use React Query for data management
  const { fichas: rawFichas, isLoading, deleteFicha, isDeleting } = useFichasQuery();

  // Fichas já vêm com status mapeado do supabaseStorage.ts
  const fichas = rawFichas;

  // Query 1: Fichas em Compras (requisições de compra)
  const { data: fichasEmCompras, isLoading: loadingCompras } = useQuery({
    queryKey: ['fichas-em-compras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisicoes_compra')
        .select(`
          *,
          fichas_tecnicas(
            id,
            numero_ftc,
            cliente,
            nome_peca,
            quantidade,
            data_criacao,
            data_ultima_edicao
          ),
          itens_requisicao(count)
        `)
        .in('status', ['aguardando_pcp', 'aprovada_pcp', 'em_compra', 'pedido_enviado', 'em_transito', 'recebido'])
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar fichas em compras:', error);
        return [];
      }
      return data || [];
    }
  });

  // Query 2: Fichas em Produção (ordens de serviço em andamento)
  const { data: fichasEmProducao, isLoading: loadingProducao } = useQuery({
    queryKey: ['fichas-em-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          fichas_tecnicas(
            id,
            numero_ftc,
            cliente,
            nome_peca,
            quantidade,
            data_criacao,
            data_ultima_edicao
          ),
          processos_os(count)
        `)
        .in('status', ['aguardando_materiais', 'aguardando_inicio', 'em_producao', 'pausada'])
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar fichas em produção:', error);
        return [];
      }
      return data || [];
    }
  });

  // Query 3: Fichas Finalizadas (ordens de serviço concluídas)
  const { data: fichasFinalizadas, isLoading: loadingFinalizadas } = useQuery({
    queryKey: ['fichas-finalizadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          fichas_tecnicas(
            id,
            numero_ftc,
            cliente,
            nome_peca,
            quantidade,
            data_criacao,
            data_ultima_edicao
          ),
          processos_os(count)
        `)
        .eq('status', 'concluida')
        .order('data_conclusao', { ascending: false })
        .limit(100); // Limitar para performance

      if (error) {
        console.error('Erro ao buscar fichas finalizadas:', error);
        return [];
      }
      return data || [];
    }
  });

  useEffect(() => {
    let filtered = fichas.filter(ficha => {
      const matchesSearch =
        ficha.numeroFTC.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ficha.resumo.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ficha.resumo.servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ficha.formData?.nome_peca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ficha.formData?.num_orcamento || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ficha.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'numeroFTC':
          aValue = a.numeroFTC;
          bValue = b.numeroFTC;
          break;
        case 'cliente':
          aValue = a.resumo.cliente;
          bValue = b.resumo.cliente;
          break;
        case 'valorTotal':
          aValue = a.resumo.valorTotal;
          bValue = b.resumo.valorTotal;
          break;
        case 'dataCriacao':
          aValue = new Date(a.dataCriacao).getTime();
          bValue = new Date(b.dataCriacao).getTime();
          break;
        default: // dataUltimaEdicao
          aValue = new Date(a.dataUltimaEdicao).getTime();
          bValue = new Date(b.dataUltimaEdicao).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredFichas(filtered);

    // Reset pagination when filters change
    pagination.reset();
  }, [fichas, searchTerm, statusFilter, sortBy, sortOrder, pagination.reset]);

  // Get current page items
  const currentPageFichas = filteredFichas.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  // Auto-selecionar aba baseado no state da navegação
  useEffect(() => {
    const state = location.state as { autoSelectStatus?: StatusFicha; fromSave?: boolean } | null;
    if (state?.autoSelectStatus && state?.fromSave) {
      setStatusFilter(state.autoSelectStatus);

      // Limpar o state para evitar reaplicar em próximas visitas
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location.state, location.pathname]);

  // Contar fichas por status para exibir nas abas
  const countByStatus = fichas.reduce((acc: Record<string, number>, ficha) => {
    acc[ficha.status] = (acc[ficha.status] || 0) + 1;
    return acc;
  }, {});


  const handleDeleteFicha = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (confirm('Tem certeza que deseja excluir esta ficha?')) {
      deleteFicha(id);
    }
  };

  const handleLoadFicha = (id: string) => {

    if (!id) {
      console.error('❌ ID da ficha é inválido:', id);
      return;
    }

    // Find the ficha to edit
    const ficha = fichas.find(f => f.id === id);
    if (!ficha) {
      console.error('❌ Ficha não encontrada para ID:', id);
      return;
    }

    // Set ficha for confirmation dialog
    setFichaToEdit(ficha);
    setShowConfirmEdit(true);
  };

  const handleViewFicha = async (id: string) => {

    if (!id) {
      console.error('❌ ID da ficha é inválido:', id);
      return;
    }

    // Find the ficha to view
    const ficha = fichas.find(f => f.id === id);
    if (!ficha) {
      console.error('❌ Ficha não encontrada para ID:', id);
      return;
    }

    // Generate HTML and open in new window
    try {
      const htmlContent = await generateHTMLContent(ficha);
      const newWindow = window.open('', '_blank');

      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('❌ Erro ao abrir visualização:', error);
    }
  };

  const confirmEditFicha = () => {
    if (!fichaToEdit) return;

    const id = fichaToEdit.id;

    // Store in sessionStorage as backup
    sessionStorage.setItem('loadFichaId', id);

    // Use URL params as primary method
    navigate(`/nova-ficha?edit=${id}`);

    // Reset state
    setShowConfirmEdit(false);
    setFichaToEdit(null);
  };

  const handleCloneFicha = (id: string) => {
    navigate(`/nova-ficha?clone=${id}`);
  };

  const handleRevertFicha = (ficha: FichaSalva) => {
    setFichaToRevert(ficha);
    setShowRevertModal(true);
  };

  const handleGerarOrcamento = (ficha: FichaSalva) => {
    setFichaParaOrcamento(ficha);
    setShowOrcamentoModal(true);
  };

  const handleOrcamentoCriado = (orcamentoData: any) => {
    toast({
      title: "Orçamento criado e enviado!",
      description: `Orçamento para FTC ${fichaParaOrcamento?.numeroFTC} foi criado e enviado com sucesso.`
    });
    setShowOrcamentoModal(false);
    setFichaParaOrcamento(null);
  };

  const confirmRevertFicha = async (motivo: string) => {
    if (!fichaToRevert) return;

    setIsReverting(true);

    try {
      const result = await estornarFicha(fichaToRevert.id, motivo);

      if (result.success) {
        toast({
          title: "Ficha Estornada com Sucesso",
          description: `FTC ${fichaToRevert.numeroFTC} foi revertida para "${result.previousStatus}".`,
          variant: "default",
        });

        // Fechar modal
        setShowRevertModal(false);
        setFichaToRevert(null);

        // Recarregar fichas (o useFichasQuery vai invalidar automaticamente)
        // Força recarregar após 500ms para dar tempo do backend processar
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Erro ao Estornar Ficha",
          description: result.error || "Erro desconhecido ao estornar ficha.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao Estornar Ficha",
        description: error instanceof Error ? error.message : "Erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setIsReverting(false);
    }
  };

  const cancelEditFicha = () => {
    setShowConfirmEdit(false);
    setFichaToEdit(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: StatusFicha) => {
    switch (status) {
      case 'orcamento_enviado_cliente':
        return 'default';
      case 'aguardando_orcamento_comercial':
        return 'default';
      case 'aguardando_cotacao_compras':
        return 'secondary';
      case 'rascunho':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: StatusFicha) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  const getStatusIcon = (status: StatusFicha) => {
    return STATUS_CONFIG[status]?.icon || '';
  };

  // Badge para status de requisições de compra
  const getRequisicaoStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color?: string }> = {
      'aguardando_pcp': { label: 'Ag. PCP', variant: 'outline', color: 'text-yellow-600' },
      'aprovada_pcp': { label: 'Aprovada', variant: 'default', color: 'text-green-600' },
      'em_compra': { label: 'Em Compra', variant: 'secondary', color: 'text-orange-600' },
      'pedido_enviado': { label: 'Enviado', variant: 'default', color: 'text-blue-600' },
      'em_transito': { label: 'Em Trânsito', variant: 'default', color: 'text-purple-600' },
      'recebido': { label: 'Recebido', variant: 'default', color: 'text-green-700' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  // Badge para status de ordens de serviço
  const getOrdemServicoStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      'aguardando_materiais': { label: 'Ag. Materiais', variant: 'outline', icon: Clock },
      'aguardando_inicio': { label: 'Ag. Início', variant: 'secondary', icon: Clock },
      'em_producao': { label: 'Em Produção', variant: 'default', icon: Play },
      'pausada': { label: 'Pausada', variant: 'destructive', icon: Pause },
      'concluida': { label: 'Concluída', variant: 'default', icon: CheckCircle2 },
    };
    const config = statusMap[status] || { label: status, variant: 'outline', icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-1">
      <div className="w-full">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Search className="h-8 w-8 text-secondary" />
              Consultar Fichas
            </h1>
            <p className="text-muted-foreground">
              Visualizar, editar e gerenciar fichas existentes
            </p>
          </div>
        </div>

        {/* Filtros Compactos */}
        <Card className="mb-4">
          <CardContent className="pt-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Cliente, FTC, Serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-11 text-sm"
                  />
                </div>
              </div>

              <div className="min-w-[120px]">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Ordenar</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dataUltimaEdicao">Última Edição</SelectItem>
                    <SelectItem value="dataCriacao">Data de Criação</SelectItem>
                    <SelectItem value="numeroFTC">Número FTC</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="valorTotal">Valor Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[70px]">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Ordem</label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger className="h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">⬇ Desc</SelectItem>
                    <SelectItem value="asc">⬆ Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Abas por Status - ABAIXO do menu de busca */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 mb-4 p-1 bg-muted/30 rounded-lg">
            {/* Nova ordem: Rascunho → Ag. Cotação → Ag. Orçamento → Enviadas → Aprovadas → TODAS */}
            <Button
              variant={statusFilter === 'rascunho' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('rascunho')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>✏️ RASCUNHO ({countByStatus.rascunho || 0})</span>
            </Button>
            <Button
              variant={statusFilter === 'aguardando_cotacao_compras' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('aguardando_cotacao_compras')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>💰 AG. COTAÇÃO ({countByStatus.aguardando_cotacao_compras || 0})</span>
            </Button>
            <Button
              variant={statusFilter === 'aguardando_orcamento_comercial' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('aguardando_orcamento_comercial')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>📊 AG. ORÇAMENTO ({countByStatus.aguardando_orcamento_comercial || 0})</span>
            </Button>
            <Button
              variant={statusFilter === 'orcamento_enviado_cliente' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('orcamento_enviado_cliente')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>📤 ENVIADAS ({countByStatus.orcamento_enviado_cliente || 0})</span>
            </Button>
            <Button
              variant={statusFilter === 'orcamento_aprovado_cliente' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('orcamento_aprovado_cliente')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>✅ APROVADAS ({countByStatus.orcamento_aprovado_cliente || 0})</span>
            </Button>

            {/* NOVAS ABAS - CICLO COMPLETO */}
            <Button
              variant={statusFilter === 'em_compras' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('em_compras')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>🛒 EM COMPRAS ({fichasEmCompras?.length || 0})</span>
            </Button>
            <Button
              variant={statusFilter === 'em_producao' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('em_producao')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>🏭 EM PRODUÇÃO ({fichasEmProducao?.length || 0})</span>
            </Button>
            <Button
              variant={statusFilter === 'finalizadas' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('finalizadas')}
              className="flex items-center gap-2 text-sm h-11 px-4"
            >
              <span>✅ FINALIZADAS ({fichasFinalizadas?.length || 0})</span>
            </Button>

            {/* ABA TODAS por último, lado direito */}
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-1 text-xs h-7 ml-auto"
            >
              <span>📋 TODAS ({fichas.length + (fichasEmCompras?.length || 0) + (fichasEmProducao?.length || 0) + (fichasFinalizadas?.length || 0)})</span>
            </Button>
          </div>
        </div>

        {/* Results - Condicional baseado na aba selecionada */}
        {statusFilter === 'em_compras' ? (
          /* TAB: EM COMPRAS */
          <Card>
            <CardHeader>
              <CardTitle>Fichas em Processo de Compras</CardTitle>
              <p className="text-sm text-muted-foreground">
                Requisições de materiais sendo processadas pelo setor de compras
              </p>
            </CardHeader>
            <CardContent>
              {loadingCompras ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : fichasEmCompras && fichasEmCompras.length > 0 ? (
                <div className="space-y-4">
                  {fichasEmCompras.map((req: any) => (
                    <Card key={req.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              FTC {req.fichas_tecnicas?.numero_ftc || 'N/A'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {req.fichas_tecnicas?.cliente || 'Cliente não disponível'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Peça: {req.fichas_tecnicas?.nome_peca || 'N/A'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {getRequisicaoStatusBadge(req.status)}
                            <span className="text-xs text-muted-foreground">
                              {req.itens_requisicao?.[0]?.count || 0} itens
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => req.fichas_tecnicas?.id && handleViewFicha(req.fichas_tecnicas.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Ficha
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/compras')}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Ir para Compras
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ficha em processo de compras
                </p>
              )}
            </CardContent>
          </Card>
        ) : statusFilter === 'em_producao' ? (
          /* TAB: EM PRODUÇÃO */
          <Card>
            <CardHeader>
              <CardTitle>Fichas em Produção</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ordens de serviço em execução no setor de produção
              </p>
            </CardHeader>
            <CardContent>
              {loadingProducao ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : fichasEmProducao && fichasEmProducao.length > 0 ? (
                <div className="space-y-4">
                  {fichasEmProducao.map((os: any) => (
                    <Card key={os.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              FTC {os.fichas_tecnicas?.numero_ftc || 'N/A'} • OS {os.numero_os || 'N/A'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {os.fichas_tecnicas?.cliente || 'Cliente não disponível'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Peça: {os.fichas_tecnicas?.nome_peca || 'N/A'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {getOrdemServicoStatusBadge(os.status)}
                            <span className="text-xs text-muted-foreground">
                              {os.processos_os?.[0]?.count || 0} processos
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => os.fichas_tecnicas?.id && handleViewFicha(os.fichas_tecnicas.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Ficha
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/producao')}
                          >
                            <Factory className="h-4 w-4 mr-2" />
                            Ir para Produção
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ficha em produção
                </p>
              )}
            </CardContent>
          </Card>
        ) : statusFilter === 'finalizadas' ? (
          /* TAB: FINALIZADAS */
          <Card>
            <CardHeader>
              <CardTitle>Fichas Finalizadas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ordens de serviço concluídas (últimas 100)
              </p>
            </CardHeader>
            <CardContent>
              {loadingFinalizadas ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : fichasFinalizadas && fichasFinalizadas.length > 0 ? (
                <div className="space-y-4">
                  {fichasFinalizadas.map((os: any) => (
                    <Card key={os.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              FTC {os.fichas_tecnicas?.numero_ftc || 'N/A'} • OS {os.numero_os || 'N/A'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {os.fichas_tecnicas?.cliente || 'Cliente não disponível'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Concluída em: {os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {getOrdemServicoStatusBadge(os.status)}
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Finalizada
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => os.fichas_tecnicas?.id && handleViewFicha(os.fichas_tecnicas.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Ficha
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ficha finalizada
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          /* TABS ORIGINAIS (Rascunho, Ag. Cotação, etc.) */
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">
                Fichas Encontradas ({filteredFichas.length})
                {filteredFichas.length > ITEMS_PER_PAGE && (
                  <span className="text-xs text-muted-foreground ml-2">
                    | Página {pagination.currentPage} de {pagination.totalPages}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredFichas.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {fichas.length === 0
                      ? "Nenhuma ficha salva encontrada."
                      : "Nenhuma ficha corresponde aos filtros aplicados."
                    }
                  </p>
                </div>
              ) : (
                <UniversalFichaTable
                  fichas={currentPageFichas}
                  isLoading={isLoading}
                  onEdit={(ficha) => handleLoadFicha(ficha.id)}
                  onDelete={deleteFicha}
                  onView={(ficha) => handleViewFicha(ficha.id)}
                  onClone={(ficha) => handleCloneFicha(ficha.id)}
                  onRevert={handleRevertFicha}
                  onOrcamento={handleGerarOrcamento}
                  showActions={{ edit: true, delete: true, view: true, clone: true, share: true, revert: true, orcamento: true }}
                  columns={{
                    numeroFTC: true,
                    cliente: true,
                    servico: true,
                    status: true,
                    valorTotal: true,
                    dataCriacao: true,
                    dataEdicao: false
                  }}
                  variant="full"
                />
              )}

              {/* Paginação */}
              {filteredFichas.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Mostrando {pagination.startIndex + 1} a {Math.min(pagination.endIndex, filteredFichas.length)} de {filteredFichas.length} fichas
                  </div>
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.goToPage}
                    className="justify-center"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog for Edit */}
      <AlertDialog open={showConfirmEdit} onOpenChange={setShowConfirmEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Confirmar Edição
            </AlertDialogTitle>
            <AlertDialogDescription>
              {fichaToEdit && (
                <div className="space-y-2">
                  <p>
                    Deseja editar a ficha <strong>FTC {fichaToEdit.numeroFTC}</strong>?
                  </p>
                  <div className="text-sm bg-muted/50 p-3 rounded-lg">
                    <p><strong>Cliente:</strong> {fichaToEdit.resumo.cliente}</p>
                    <p><strong>Serviço:</strong> {fichaToEdit.formData?.nome_peca || fichaToEdit.resumo.servico}</p>
                    <p><strong>Status:</strong> {getStatusLabel(fichaToEdit.status)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você será redirecionado para a página de edição da ficha técnica.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelEditFicha}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmEditFicha}>
              Editar Ficha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Confirmation Modal */}
      <RevertConfirmModal
        open={showRevertModal}
        onOpenChange={setShowRevertModal}
        onConfirm={confirmRevertFicha}
        ficha={fichaToRevert}
        isReverting={isReverting}
      />

      {/* Orçamento Modal */}
      <OrcamentoModal
        open={showOrcamentoModal}
        onClose={() => {
          setShowOrcamentoModal(false);
          setFichaParaOrcamento(null);
        }}
        onCreateOrcamento={handleOrcamentoCriado}
        fichaTecnica={fichaParaOrcamento || undefined}
      />

    </div>
  );
}