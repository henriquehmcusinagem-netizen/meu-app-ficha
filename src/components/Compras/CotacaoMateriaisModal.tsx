import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Material {
  id: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  fornecedor: string;
  valor_total: number;
}

interface CotacaoMateriaisModalProps {
  ficha: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CotacaoMateriaisModal({
  ficha,
  open,
  onOpenChange,
  onSuccess,
}: CotacaoMateriaisModalProps) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Resetar estado quando a modal abre/fecha
  useEffect(() => {
    if (open && ficha?.materiais) {
      const materiaisIniciais = ficha.materiais.map((mat: any) => ({
        ...mat,
        valor_unitario: mat.valor_unitario || 0,
        fornecedor: mat.fornecedor || '',
        valor_total: (mat.valor_unitario || 0) * (mat.quantidade || 0),
      }));
      setMateriais(materiaisIniciais);
      setErrors({});
    }
  }, [open, ficha]);

  // Atualizar valor unitário de um material
  const handleValorUnitarioChange = (id: number, valor: string) => {
    const valorNumerico = parseFloat(valor) || 0;
    setMateriais(prev =>
      prev.map(mat =>
        mat.id === id
          ? {
              ...mat,
              valor_unitario: valorNumerico,
              valor_total: valorNumerico * mat.quantidade,
            }
          : mat
      )
    );
    // Limpar erro se houver
    if (valorNumerico > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Atualizar fornecedor de um material
  const handleFornecedorChange = (id: number, fornecedor: string) => {
    setMateriais(prev =>
      prev.map(mat => (mat.id === id ? { ...mat, fornecedor } : mat))
    );
    // Limpar erro se houver
    if (fornecedor.trim().length >= 2) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Calcular subtotal
  const subtotal = materiais.reduce((acc, mat) => acc + mat.valor_total, 0);

  // Validar antes de salvar
  const validar = (): boolean => {
    const novosErros: Record<number, string> = {};
    let temErro = false;

    materiais.forEach(mat => {
      if (!mat.valor_unitario || mat.valor_unitario <= 0) {
        novosErros[mat.id] = 'Valor unitário obrigatório';
        temErro = true;
      }
      if (!mat.fornecedor || mat.fornecedor.trim().length < 2) {
        novosErros[mat.id] = novosErros[mat.id]
          ? `${novosErros[mat.id]} e Fornecedor obrigatório`
          : 'Fornecedor obrigatório';
        temErro = true;
      }
    });

    setErrors(novosErros);

    if (temErro) {
      toast.error('Preencha todos os campos obrigatórios', {
        description: 'Valor unitário e fornecedor são obrigatórios para todos os materiais',
      });
    }

    return !temErro;
  };

  // Abrir modal de confirmação
  const handleSalvarClick = () => {
    if (validar()) {
      setShowConfirm(true);
    }
  };

  // Salvar cotação
  const handleConfirmarSalvamento = async () => {
    setIsSaving(true);
    setShowConfirm(false);

    try {
      // 1. Atualizar todos os materiais
      const { error: materiaisError } = await supabase
        .from('materiais')
        .upsert(
          materiais.map(mat => ({
            id: mat.id,
            ficha_id: ficha.id,
            descricao: mat.descricao,
            quantidade: mat.quantidade,
            unidade: mat.unidade,
            valor_unitario: mat.valor_unitario,
            fornecedor: mat.fornecedor,
            valor_total: mat.valor_total,
          }))
        );

      if (materiaisError) throw materiaisError;

      // 2. Atualizar status da ficha
      const { error: fichaError } = await supabase
        .from('fichas_tecnicas')
        .update({
          status: 'aguardando_orcamento_comercial',
          data_ultima_edicao: new Date().toISOString(),
        })
        .eq('id', ficha.id);

      if (fichaError) throw fichaError;

      // 3. Sucesso!
      toast.success('Cotação salva com sucesso!', {
        description: 'Ficha enviada para Comercial aguardar orçamento',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
      toast.error('Erro ao salvar cotação', {
        description: 'Tente novamente ou contate o suporte',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!ficha) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              Cotação de Materiais - FTC {ficha.numero_ftc}
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{ficha.cliente}</span> •{' '}
              {ficha.nome_peca}
            </DialogDescription>
          </DialogHeader>

          {/* Tabela de Materiais com Scroll */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Descrição</th>
                  <th className="text-center p-3 text-sm font-medium w-20">Qtd</th>
                  <th className="text-center p-3 text-sm font-medium w-16">Un</th>
                  <th className="text-right p-3 text-sm font-medium w-32">
                    Valor Unit. <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left p-3 text-sm font-medium w-48">
                    Fornecedor <span className="text-red-500">*</span>
                  </th>
                  <th className="text-right p-3 text-sm font-medium w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map((mat, idx) => (
                  <tr
                    key={mat.id}
                    className={`border-b ${
                      errors[mat.id] ? 'bg-red-50 dark:bg-red-950/20' : ''
                    }`}
                  >
                    <td className="p-3 text-sm">{mat.descricao}</td>
                    <td className="p-3 text-sm text-center">{mat.quantidade}</td>
                    <td className="p-3 text-sm text-center">
                      <Badge variant="outline" className="text-xs">
                        {mat.unidade}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={mat.valor_unitario || ''}
                        onChange={e => handleValorUnitarioChange(mat.id, e.target.value)}
                        className={`text-right ${
                          errors[mat.id] ? 'border-red-500' : ''
                        }`}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="text"
                        placeholder="Nome do fornecedor"
                        value={mat.fornecedor || ''}
                        onChange={e => handleFornecedorChange(mat.id, e.target.value)}
                        className={errors[mat.id] ? 'border-red-500' : ''}
                      />
                    </td>
                    <td className="p-3 text-sm text-right font-medium">
                      R$ {mat.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 sticky bottom-0">
                <tr>
                  <td colSpan={5} className="p-3 text-right font-bold">
                    Subtotal:
                  </td>
                  <td className="p-3 text-right font-bold text-orange-600">
                    R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mensagem de erro se houver */}
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>
                Preencha todos os campos obrigatórios antes de salvar
              </span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarClick} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Salvar Cotação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cotação</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Deseja confirmar a cotação de:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>{materiais.length}</strong> materiais
                </li>
                <li>
                  Valor total:{' '}
                  <strong className="text-orange-600">
                    R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </li>
              </ul>
              <p className="text-muted-foreground text-sm">
                A ficha será enviada para aguardar orçamento comercial.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarSalvamento} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
