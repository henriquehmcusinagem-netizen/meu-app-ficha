import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Calendar, User } from 'lucide-react';
import { FichaSalva, STATUS_CONFIG } from '@/types/ficha-tecnica';
import { carregarFichasSalvas, excluirFicha } from '@/utils/supabaseStorage';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/helpers';

interface FichasListProps {
  onLoadFicha: (id: string) => void;
}

export function FichasList({ onLoadFicha }: FichasListProps) {
  const [fichas, setFichas] = useState<FichaSalva[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const loadFichas = async () => {
    setLoading(true);
    try {
      const fichasSalvas = await carregarFichasSalvas();
      setFichas(fichasSalvas);
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
    if (isOpen) {
      loadFichas();
    }
  }, [isOpen]);

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
    onLoadFicha(id);
    setIsOpen(false);
    toast({
      title: "Sucesso",
      description: "Ficha carregada com sucesso.",
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Consultar Fichas Salvas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fichas Técnicas Salvas</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : fichas.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma ficha salva encontrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fichas.map((ficha) => (
              <Card 
                key={ficha.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleLoadFicha(ficha.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold">
                        FTC {ficha.numeroFTC}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {ficha.resumo.cliente}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ficha.status === 'orcamento_enviado_cliente' ? 'default' : 'secondary'}>
                        {STATUS_CONFIG[ficha.status]?.label || ficha.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteFicha(ficha.id, e)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Serviço</p>
                      <p className="truncate">{ficha.formData?.nome_peca || ficha.resumo.servico}</p>
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
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {ficha.materiais.length} material(is) • {ficha.fotos.length} foto(s)
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}