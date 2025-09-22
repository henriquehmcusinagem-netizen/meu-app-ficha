import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Calendar, User, Search, Filter, Eye, Home, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FichaSalva, Foto } from '@/types/ficha-tecnica';
import { formatCurrency } from '@/utils/helpers';
import { ConsultaActionButtons } from '@/components/FichaTecnica/ConsultaActionButtons';
import { useFichasQuery } from '@/hooks/useFichasQuery';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SimplePhotoPreview } from '@/components/SimplePhotoPreview';
import { supabase } from '@/integrations/supabase/client';

export default function ConsultarFichas() {
  const navigate = useNavigate();
  const [filteredFichas, setFilteredFichas] = useState<FichaSalva[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dataUltimaEdicao');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Use React Query for data management
  const { fichas, isLoading, deleteFicha, isDeleting } = useFichasQuery();

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

  const FotosPreview = ({ fotos }: { fotos: Foto[] }) => {
    const [selectedFoto, setSelectedFoto] = useState<number>(0);
    const [isOpen, setIsOpen] = useState(false);
    const [fullSizeUrls, setFullSizeUrls] = useState<Map<number, string>>(new Map());

    const handlePrevious = () => {
      setSelectedFoto((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
    };

    const handleNext = () => {
      setSelectedFoto((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
    };

    const openModal = async (index: number) => {
      setSelectedFoto(index);
      setIsOpen(true);

      // Load full-size image if not already loaded
      const foto = fotos[index];
      if (foto.storagePath && !fullSizeUrls.has(index)) {
        try {
          const { data } = await supabase.storage
            .from('ficha-fotos')
            .createSignedUrl(foto.storagePath, 3600);

          if (data?.signedUrl) {
            setFullSizeUrls(prev => new Map(prev).set(index, data.signedUrl));
          }
        } catch (error) {
          console.error('Erro ao carregar foto em tamanho completo:', error);
        }
      }
    };

    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{fotos.length} fotos</span>
        <div className="flex gap-0.5">
          {fotos.slice(0, 2).map((foto, index) => (
            <Dialog key={index} open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <SimplePhotoPreview
                  storagePath={foto.storagePath}
                  alt={foto.name}
                  className="w-5 h-5 rounded border hover:ring-1 hover:ring-primary/50 transition-all"
                  onClick={() => openModal(index)}
                />
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <div className="relative flex items-center justify-center bg-black">
                  {fullSizeUrls.has(selectedFoto) ? (
                    <img
                      src={fullSizeUrls.get(selectedFoto)}
                      alt={fotos[selectedFoto]?.name}
                      className="max-w-full max-h-[80vh] object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[50vh]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}

                  {fotos.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2"
                        onClick={handlePrevious}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        onClick={handleNext}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm">
                    {selectedFoto + 1} de {fotos.length} - {fotos[selectedFoto]?.name}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}

          {fotos.length > 2 && (
            <div className="w-5 h-5 rounded border bg-muted flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">+{fotos.length - 2}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleDeleteFicha = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('Tem certeza que deseja excluir esta ficha?')) {
      deleteFicha(id);
    }
  };

  const handleLoadFicha = (id: string) => {
    console.log('🔗 ConsultarFichas - Clicou para editar ficha:', id);
    console.log('🔗 Type of ID:', typeof id, 'Value:', id);
    
    if (!id) {
      console.error('❌ ID da ficha é inválido:', id);
      return;
    }
    
    // Store in sessionStorage as backup
    console.log('💾 Antes de salvar no sessionStorage');
    sessionStorage.setItem('loadFichaId', id);
    console.log('💾 Salvou no sessionStorage:', sessionStorage.getItem('loadFichaId'));
    
    // Use URL params as primary method
    console.log('🚀 Antes de navegar - usando URL params');
    navigate(`/nova-ficha?edit=${id}`);
    console.log('🚀 Navegação executada para /nova-ficha?edit=' + id);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header - Compacto */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-3 py-1 text-sm"
            size="sm"
          >
            <Home className="h-3 w-3" />
            Dashboard
          </Button>
          <div className="h-3 w-px bg-border" />
          <h1 className="text-lg font-semibold text-muted-foreground">Consultar Fichas</h1>
        </div>

        {/* Filters and Search - Layout Horizontal Compacto */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Buscar e Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium mb-1 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Cliente, FTC, Serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>

              <div className="min-w-[100px]">
                <label className="text-xs font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px]">
                <label className="text-xs font-medium mb-1 block">Ordenar por</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-sm">
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

              <div className="min-w-[90px]">
                <label className="text-xs font-medium mb-1 block">Ordem</label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger className="h-8 text-sm">
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

        {/* Results - Lista Compacta */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Fichas Encontradas ({filteredFichas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
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
              <div className="space-y-2">
                {filteredFichas.map((ficha) => {
                  console.log('🎯 Renderizando ficha:', { id: ficha.id, numeroFTC: ficha.numeroFTC });
                  return (
                    <Card
                      key={ficha.id}
                      className="cursor-pointer hover:bg-accent/30 transition-all duration-150 hover:shadow-sm border-l-4 border-l-primary/30"
                      onClick={() => {
                        console.log('🖱️ Card clicado! ID:', ficha.id);
                        handleLoadFicha(ficha.id);
                      }}
                    >
                      <CardContent className="p-3">
                        {/* Header Compacto */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary text-sm">FTC {ficha.numeroFTC}</span>
                            <Badge variant={getStatusBadgeVariant(ficha.status)} className="text-xs px-1.5 py-0.5">
                              {getStatusLabel(ficha.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ficha.dataUltimaEdicao)}
                          </div>
                        </div>

                        {/* Info Principal em Grid Compacto */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-2">
                          <div>
                            <span className="text-muted-foreground font-medium">Cliente:</span>
                            <p className="font-medium truncate">{ficha.resumo.cliente}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Serviço:</span>
                            <p className="truncate">{ficha.resumo.servico}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Qtd:</span>
                            <p className="font-medium">{ficha.resumo.quantidade}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Valor:</span>
                            <p className="font-semibold text-primary text-sm">
                              {formatCurrency(ficha.resumo.valorTotal)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{ficha.materiais.length} mat.</span>
                              {ficha.fotos.length > 0 ? (
                                <FotosPreview fotos={ficha.fotos} />
                              ) : (
                                <span>0 fotos</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer Compacto */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <ConsultaActionButtons ficha={ficha} />
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadFicha(ficha.id);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteFicha(ficha.id, e)}
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Del
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}