import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Edit, Camera, Copy, RotateCcw, FileText } from 'lucide-react';
import { FichaSalva, STATUS_CONFIG } from '@/types/ficha-tecnica';
import { formatCurrency } from '@/utils/helpers';
import { ShareActions } from './ShareActions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { canRevertStatus } from '@/utils/statusMapping';

interface UniversalFichaTableProps {
  fichas: FichaSalva[];
  isLoading?: boolean;
  onEdit?: (ficha: FichaSalva) => void;
  onDelete?: (id: string) => void;
  onView?: (ficha: FichaSalva) => void;
  onClone?: (ficha: FichaSalva) => void;
  onRevert?: (ficha: FichaSalva) => void;
  onOrcamento?: (ficha: FichaSalva) => void;
  showActions?: {
    edit?: boolean;
    delete?: boolean;
    view?: boolean;
    clone?: boolean;
    share?: boolean;
    revert?: boolean;
    orcamento?: boolean;
  };
  columns?: {
    numeroFTC?: boolean;
    cliente?: boolean;
    servico?: boolean;
    status?: boolean;
    valorTotal?: boolean;
    dataCriacao?: boolean;
    dataEdicao?: boolean;
    horas?: boolean;
    fotos?: boolean;
  };
  variant?: 'full' | 'compact';
}

export function UniversalFichaTable({
  fichas,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onClone,
  onRevert,
  onOrcamento,
  showActions = { edit: true, delete: true, view: true, clone: true, share: true, revert: true, orcamento: true },
  columns = { numeroFTC: true, cliente: true, servico: true, status: true, valorTotal: true, fotos: true, dataCriacao: true },
  variant = 'full'
}: UniversalFichaTableProps) {
  const [fichaToDelete, setFichaToDelete] = useState<FichaSalva | null>(null);
  const [fichaToClone, setFichaToClone] = useState<FichaSalva | null>(null);

  const handleEdit = (ficha: FichaSalva, event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit?.(ficha);
  };

  const handleDelete = (ficha: FichaSalva, event: React.MouseEvent) => {
    event.stopPropagation();
    setFichaToDelete(ficha);
  };

  const confirmDelete = () => {
    if (fichaToDelete) {
      onDelete?.(fichaToDelete.id);
      setFichaToDelete(null);
    }
  };

  const handleView = (ficha: FichaSalva, event: React.MouseEvent) => {
    event.stopPropagation();
    onView?.(ficha);
  };

  const handleClone = (ficha: FichaSalva, event: React.MouseEvent) => {
    event.stopPropagation();
    setFichaToClone(ficha);
  };

  const confirmClone = () => {
    if (fichaToClone) {
      onClone?.(fichaToClone);
      setFichaToClone(null);
    }
  };

  const handleRevert = (ficha: FichaSalva, event: React.MouseEvent) => {
    event.stopPropagation();
    onRevert?.(ficha);
  };

  const handleOrcamento = (ficha: FichaSalva, event: React.MouseEvent) => {
    event.stopPropagation();
    onOrcamento?.(ficha);
  };

  const handleDoubleClick = (ficha: FichaSalva) => {
    onEdit?.(ficha);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (fichas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma ficha encontrada
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {columns.numeroFTC && <TableHead className="min-w-[80px]">FTC</TableHead>}
              {columns.cliente && <TableHead className="min-w-[140px]">Cliente</TableHead>}
              {columns.servico && <TableHead className="min-w-[200px]">Serviço</TableHead>}
              {columns.status && <TableHead className="min-w-[180px]">Status</TableHead>}
              {columns.valorTotal && <TableHead className="text-right min-w-[110px]">Valor</TableHead>}
              {columns.horas && <TableHead className="text-right min-w-[80px]">Horas</TableHead>}
              {columns.fotos && <TableHead className="text-center min-w-[70px]">Fotos</TableHead>}
              {columns.dataCriacao && <TableHead className="min-w-[90px]">Criação</TableHead>}
              {columns.dataEdicao && <TableHead className="min-w-[90px]">Edição</TableHead>}
              {(showActions.edit || showActions.delete || showActions.view || showActions.clone || showActions.share || showActions.orcamento) && (
                <TableHead className="text-right min-w-[180px]">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fichas.map((ficha) => (
              <TableRow
                key={ficha.id}
                className="cursor-pointer hover:bg-muted/50"
                onDoubleClick={() => handleDoubleClick(ficha)}
                title="Duplo clique para editar"
              >
                {columns.numeroFTC && (
                  <TableCell className="font-medium text-primary">
                    {ficha.numeroFTC}
                  </TableCell>
                )}
                {columns.cliente && (
                  <TableCell className="max-w-[140px] truncate">
                    {ficha.resumo?.cliente || ficha.formData?.cliente || '—'}
                  </TableCell>
                )}
                {columns.servico && (
                  <TableCell className="max-w-[200px] truncate">
                    {ficha.formData?.nome_peca || ficha.resumo?.servico || ficha.formData?.servico || '—'}
                  </TableCell>
                )}
                {columns.status && (
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${STATUS_CONFIG[ficha.status]?.color || 'bg-gray-100'} text-xs whitespace-nowrap`}
                    >
                      {STATUS_CONFIG[ficha.status]?.label || ficha.status}
                    </Badge>
                  </TableCell>
                )}
                {columns.valorTotal && (
                  <TableCell className="text-right font-medium">
                    {formatCurrency(ficha.resumo?.valorTotal || ficha.calculos?.materialTodasPecas || 0)}
                  </TableCell>
                )}
                {columns.horas && (
                  <TableCell className="text-right">
                    {ficha.calculos?.horasTodasPecas || '—'}h
                  </TableCell>
                )}
                {columns.fotos && (
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Camera className="h-3 w-3" />
                      <span>{ficha.fotosCount || 0}</span>
                    </div>
                  </TableCell>
                )}
                {columns.dataCriacao && (
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ficha.dataCriacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                )}
                {columns.dataEdicao && (
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ficha.dataUltimaEdicao).toLocaleDateString('pt-BR')}
                  </TableCell>
                )}
                {(showActions.edit || showActions.delete || showActions.view || showActions.clone || showActions.share || showActions.revert || showActions.orcamento) && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {showActions.view && onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleView(ficha, e)}
                          className="h-8 w-8 p-0"
                          title="Visualizar (somente leitura)"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {showActions.orcamento && onOrcamento && ficha.status === 'aguardando_orcamento_comercial' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleOrcamento(ficha, e)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Gerar Orçamento"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {showActions.revert && onRevert && canRevertStatus(ficha.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleRevert(ficha, e)}
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Estornar para etapa anterior"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {showActions.edit && onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEdit(ficha, e)}
                          className="h-8 w-8 p-0"
                          title="Editar (ou duplo clique na linha)"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {showActions.clone && onClone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleClone(ficha, e)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          title="Clonar ficha (cria uma cópia)"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {showActions.delete && onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(ficha, e)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {showActions.share && (
                        <ShareActions ficha={ficha} variant="compact" />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!fichaToDelete} onOpenChange={() => setFichaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ficha <strong>{fichaToDelete?.numeroFTC}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Clone Dialog */}
      <AlertDialog open={!!fichaToClone} onOpenChange={() => setFichaToClone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Clonagem</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja criar uma cópia da ficha <strong>{fichaToClone?.numeroFTC}</strong>?
              <br />
              <br />
              ✅ Todos os dados serão copiados (cliente, materiais, horas, etc.)
              <br />
              ❌ As fotos NÃO serão copiadas (você poderá adicionar novas)
              <br />
              🆔 Um novo número FTC será gerado automaticamente
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClone} className="bg-blue-600 text-white hover:bg-blue-700">
              Clonar Ficha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}