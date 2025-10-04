import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Trash2, FileText, Calendar, User, Search, Filter, Eye, Home, Download, Printer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FichaSalva, Foto, STATUS_CONFIG, StatusFicha } from '@/types/ficha-tecnica';
import { formatCurrency } from '@/utils/helpers';
import { UniversalFichaTable } from '@/components/FichaTecnica/UniversalFichaTable';
import { RevertConfirmModal } from '@/components/FichaTecnica/RevertConfirmModal';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-1">
      <div className="w-full">
        {/* Navigation Header - Ultra Compacto */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-sm h-11"
            size="sm"
          >
            <Home className="h-3 w-3" />
            Dashboard
          </Button>
          <div className="h-3 w-px bg-border" />
          <h1 className="text-sm font-semibold text-muted-foreground">Consultar Fichas</h1>
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
            {/* Nova ordem: Rascunho → Ag. Cotação → Ag. Orçamento → Enviadas → TODAS */}
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
            {/* ABA TODAS por último, lado direito */}
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-1 text-xs h-7 ml-auto"
            >
              <span>📋 TODAS ({fichas.length})</span>
            </Button>
          </div>
        </div>

        {/* Results - Lista Ultra Compacta */}
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
                showActions={{ edit: true, delete: true, view: true, clone: true, share: true, revert: true }}
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

    </div>
  );
}