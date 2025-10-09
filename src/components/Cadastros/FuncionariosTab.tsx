import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FuncionarioFormDialog } from "./FuncionarioFormDialog";
import { toast } from "sonner";

interface Funcionario {
  id: string;
  nome: string;
  email: string | null;
  ativo: boolean;
  capacidade_maxima: string | null;
  created_at: string;
}

interface FuncionarioProcesso {
  id: string;
  funcionario_id: string;
  processo: string;
}

export function FuncionariosTab() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);

  // Query para listar funcionários
  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Funcionario[];
    },
  });

  // Query para listar processos de cada funcionário
  const { data: funcionarioProcessos } = useQuery({
    queryKey: ['funcionario_processos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionario_processos')
        .select('*');

      if (error) throw error;
      return data as FuncionarioProcesso[];
    },
  });

  // Mutation para deletar funcionário
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario_processos'] });
      toast.success('Funcionário excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir funcionário: ${error.message}`);
    },
  });

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleNovo = () => {
    setEditingFuncionario(null);
    setIsFormOpen(true);
  };

  // Função para pegar processos de um funcionário
  const getProcessosFuncionario = (funcionarioId: string): string[] => {
    if (!funcionarioProcessos) return [];
    return funcionarioProcessos
      .filter(fp => fp.funcionario_id === funcionarioId)
      .map(fp => fp.processo);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Funcionários Cadastrados</CardTitle>
              <CardDescription>
                Gerenciar funcionários/operadores e os processos que dominam
              </CardDescription>
            </div>
            <Button onClick={handleNovo}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!funcionarios || funcionarios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">📭 Nenhum funcionário cadastrado</p>
              <p className="text-sm mt-2">
                Clique em "Novo Funcionário" para adicionar o primeiro funcionário
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[100px]">Turno</TableHead>
                    <TableHead>Processos</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((funcionario) => {
                    const processos = getProcessosFuncionario(funcionario.id);
                    return (
                      <TableRow key={funcionario.id}>
                        <TableCell className="font-medium">
                          {funcionario.nome}
                        </TableCell>
                        <TableCell>
                          <Badge variant={funcionario.turno === 'A' ? 'default' : 'secondary'}>
                            Turno {funcionario.turno || 'A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {processos.length === 0 ? (
                              <span className="text-sm text-muted-foreground">
                                Nenhum processo
                              </span>
                            ) : (
                              processos.map((processo, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Wrench className="h-3 w-3 mr-1" />
                                  {processo.replace(/_/g, ' ')}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {funcionario.ativo ? (
                            <Badge className="bg-green-600">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(funcionario)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(funcionario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de formulário de funcionário */}
      <FuncionarioFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        funcionario={editingFuncionario}
      />
    </div>
  );
}
