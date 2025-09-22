import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Calendar, User, Search, Filter, Eye, Home, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FichaSalva, Foto, STATUS_CONFIG, StatusFicha } from '@/types/ficha-tecnica';
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

  const getStatusBadgeVariant = (status: StatusFicha) => {
    switch (status) {
      case 'finalizada':
        return 'default';
      case 'preenchida':
        return 'default';
      case 'aguardando_cotacao':
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
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header - Ultra Compacto */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-2 py-1 text-xs h-6"
            size="sm"
          >
            <Home className="h-3 w-3" />
            Dashboard
          </Button>
          <div className="h-3 w-px bg-border" />
          <h1 className="text-sm font-semibold text-muted-foreground">Consultar Fichas</h1>
        </div>

        {/* Filters and Search - Layout Horizontal Ultra Compacto */}
        <Card className="mb-2">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1 text-sm">
              <Search className="h-3 w-3" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[10px] font-medium mb-0.5 block text-muted-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Cliente, FTC, Serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 h-7 text-xs"
                  />
                </div>
              </div>

              <div className="min-w-[80px]">
                <label className="text-[10px] font-medium mb-0.5 block text-muted-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{config.icon}</span>
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <label className="text-[10px] font-medium mb-0.5 block text-muted-foreground">Ordenar</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-7 text-xs">
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
                <label className="text-[10px] font-medium mb-0.5 block text-muted-foreground">Ordem</label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger className="h-7 text-xs">
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

        {/* Results - Lista Ultra Compacta */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">
              Fichas Encontradas ({filteredFichas.length})
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
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  {/* Header da Tabela */}
                  <thead className="border-b border-border/30">
                    <tr className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      <th className="text-left pb-1 w-[110px]">FTC</th>
                      <th className="text-left pb-1 w-[100px]">CLIENTE</th>
                      <th className="text-left pb-1 w-[160px] hidden sm:table-cell">PEÇA/EQUIP.</th>
                      <th className="text-center pb-1 w-[50px] hidden md:table-cell">QTD</th>
                      <th className="text-right pb-1 w-[80px]">VALOR</th>
                      <th className="text-center pb-1 w-[60px]">FOTOS</th>
                      <th className="text-center pb-1 w-[50px] hidden lg:table-cell">DATA</th>
                      <th className="text-right pb-1 w-[130px]">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {filteredFichas.map((ficha) => {
                      console.log('🎯 Renderizando ficha:', { id: ficha.id, numeroFTC: ficha.numeroFTC });
                      return (
                        <tr key={ficha.id} className="group">
                          <td colSpan={8} className="p-0">
                            <div
                              className="cursor-pointer hover:bg-accent/40 transition-all duration-150 border rounded-md border-border/30 hover:border-primary/30 bg-card/50 m-1"
                              onClick={() => {
                                console.log('🖱️ Card clicado! ID:', ficha.id);
                                handleLoadFicha(ficha.id);
                              }}
                            >
                              <table className="w-full table-fixed">
                                <tbody>
                                  <tr className="text-xs">
                                    {/* FTC + Status */}
                                    <td className="p-2 w-[110px]">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-primary text-xs">FTC {ficha.numeroFTC}</span>
                                        <Badge variant={getStatusBadgeVariant(ficha.status)} className="text-[8px] px-1 py-0 leading-3">
                                          <span className="mr-1">{getStatusIcon(ficha.status)}</span>
                                          {getStatusLabel(ficha.status)}
                                        </Badge>
                                      </div>
                                    </td>

                                    {/* Cliente */}
                                    <td className="p-2 w-[100px]">
                                      <span className="font-medium truncate block" title={ficha.resumo.cliente}>
                                        {ficha.resumo.cliente.length > 12 ? `${ficha.resumo.cliente.substring(0, 12)}...` : ficha.resumo.cliente}
                                      </span>
                                    </td>

                                    {/* Nome da Peça/Equipamento */}
                                    <td className="p-2 w-[160px] hidden sm:table-cell">
                                      <span className="truncate block text-muted-foreground" title={ficha.formData?.nome_peca || ficha.resumo.servico}>
                                        {(ficha.formData?.nome_peca || ficha.resumo.servico).length > 35 ? `${(ficha.formData?.nome_peca || ficha.resumo.servico).substring(0, 35)}...` : (ficha.formData?.nome_peca || ficha.resumo.servico)}
                                      </span>
                                    </td>

                                    {/* Qtd + Materiais */}
                                    <td className="p-2 w-[50px] text-center hidden md:table-cell">
                                      <span className="font-medium block">{ficha.resumo.quantidade}</span>
                                      <span className="text-[8px] text-muted-foreground">{ficha.materiais.length}m</span>
                                    </td>

                                    {/* Valor */}
                                    <td className="p-2 w-[80px] text-right">
                                      <span className="font-semibold text-primary text-xs">
                                        {formatCurrency(ficha.resumo.valorTotal)}
                                      </span>
                                    </td>

                                    {/* Fotos */}
                                    <td className="p-2 w-[60px] text-center">
                                      {ficha.fotos.length > 0 ? (
                                        <FotosPreview fotos={ficha.fotos} />
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground">0 fotos</span>
                                      )}
                                    </td>

                                    {/* Data */}
                                    <td className="p-2 w-[50px] text-center hidden lg:table-cell">
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(ficha.dataUltimaEdicao).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit'
                                        })}
                                      </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-2 w-[130px]">
                                      <div className="flex gap-0.5 justify-end">
                                        <ConsultaActionButtons ficha={ficha} />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleLoadFicha(ficha.id);
                                          }}
                                          className="h-6 w-6 p-0"
                                          title="Visualizar/Editar"
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => handleDeleteFicha(ficha.id, e)}
                                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                          disabled={isDeleting}
                                          title="Excluir ficha"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}