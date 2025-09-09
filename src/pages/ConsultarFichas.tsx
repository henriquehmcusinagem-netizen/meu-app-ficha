import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Calendar, User, Search, Filter, Eye, Home, Download, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { carregarFichasSalvas, excluirFicha, FichaSalva } from '@/utils/supabaseStorage';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/helpers';
import { ConsultaActionButtons } from '@/components/FichaTecnica/ConsultaActionButtons';

export default function ConsultarFichas() {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<FichaSalva[]>([]);
  const [filteredFichas, setFilteredFichas] = useState<FichaSalva[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dataUltimaEdicao');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  const loadFichas = async () => {
    setLoading(true);
    try {
      const fichasSalvas = await carregarFichasSalvas();
      setFichas(fichasSalvas);
      setFilteredFichas(fichasSalvas);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fichas salvas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFichas();
  }, []);

  useEffect(() => {
    let filtered = fichas.filter(ficha => {
      const matchesSearch = 
        ficha.numeroFTC.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ficha.resumo.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ficha.resumo.servico.toLowerCase().includes(searchTerm.toLowerCase());
      
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
  }, [fichas, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleDeleteFicha = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('Tem certeza que deseja excluir esta ficha?')) {
      const success = await excluirFicha(id);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Ficha excluída com sucesso.",
        });
        loadFichas();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir ficha.",
          variant: "destructive",
        });
      }
    }
  };

  const handleLoadFicha = (id: string) => {
    navigate('/nova-ficha', { state: { loadFichaId: id } });
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'finalizada':
        return 'default';
      case 'rascunho':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'finalizada':
        return 'Finalizada';
      case 'rascunho':
        return 'Rascunho';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-xl font-semibold text-muted-foreground">Consultar Fichas</h1>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar e Filtrar Fichas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cliente, FTC, Serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ordenar por</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Ordem</label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Decrescente</SelectItem>
                    <SelectItem value="asc">Crescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Fichas Encontradas ({filteredFichas.length})
              </CardTitle>
              <Button
                onClick={() => navigate('/nova-ficha')}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <FileText className="h-4 w-4 mr-2" />
                Nova Ficha
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredFichas.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {fichas.length === 0 
                    ? "Nenhuma ficha salva encontrada." 
                    : "Nenhuma ficha corresponde aos filtros aplicados."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFichas.map((ficha) => (
                  <Card 
                    key={ficha.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                    onClick={() => handleLoadFicha(ficha.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg font-semibold text-primary">
                              FTC {ficha.numeroFTC}
                            </CardTitle>
                            <Badge variant={getStatusBadgeVariant(ficha.status)}>
                              {getStatusLabel(ficha.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {ficha.resumo.cliente}
                          </div>
                        </div>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          FTC {ficha.numeroFTC}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="font-medium text-muted-foreground">Serviço</p>
                          <p className="truncate">{ficha.resumo.servico}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Quantidade</p>
                          <p>{ficha.resumo.quantidade}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Valor Total</p>
                          <p className="font-semibold text-primary">
                            {formatCurrency(ficha.resumo.valorTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Última Edição</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <p className="text-xs">{formatDate(ficha.dataUltimaEdicao)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {ficha.materiais.length} material(is) • {ficha.fotos.length} foto(s)
                          </p>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Criada: {formatDate(ficha.dataCriacao)}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <ConsultaActionButtons ficha={ficha} />
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadFicha(ficha.id);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Visualizar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteFicha(ficha.id, e)}
                              className="text-destructive hover:text-destructive flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}