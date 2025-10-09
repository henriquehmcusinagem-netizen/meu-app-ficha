import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

const contatoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  celular: z.string().optional(),
  email: z.string().email("Email inválido").or(z.literal('')).optional(),
  principal: z.boolean().default(false),
  observacoes: z.string().optional(),
});

type ContatoFormData = z.infer<typeof contatoSchema>;

interface Contato {
  id: string;
  cliente_id: string;
  nome: string;
  celular: string | null;
  email: string | null;
  principal: boolean;
  observacoes: string | null;
  created_at: string;
}

interface ContatosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: any;
}

export function ContatosDialog({ open, onOpenChange, cliente }: ContatosDialogProps) {
  const queryClient = useQueryClient();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);

  const form = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      nome: "",
      celular: "",
      email: "",
      principal: false,
      observacoes: "",
    },
  });

  // Query para listar contatos
  const { data: contatos, isLoading } = useQuery({
    queryKey: ['contatos', cliente?.id],
    queryFn: async () => {
      if (!cliente?.id) return [];

      const { data, error } = await supabase
        .from('contatos_cliente')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('principal', { ascending: false })
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Contato[];
    },
    enabled: !!cliente?.id && open,
  });

  // Mutation para salvar contato
  const saveMutation = useMutation({
    mutationFn: async (data: ContatoFormData) => {
      if (editingContato) {
        // Atualizar contato existente
        const { error } = await supabase
          .from('contatos_cliente')
          .update({
            nome: data.nome,
            celular: data.celular || null,
            email: data.email || null,
            principal: data.principal,
            observacoes: data.observacoes || null,
          })
          .eq('id', editingContato.id);

        if (error) throw error;
      } else {
        // Criar novo contato
        const { error } = await supabase
          .from('contatos_cliente')
          .insert({
            cliente_id: cliente.id,
            nome: data.nome,
            celular: data.celular || null,
            email: data.email || null,
            principal: data.principal,
            observacoes: data.observacoes || null,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos', cliente.id] });
      toast.success(editingContato ? 'Contato atualizado!' : 'Contato adicionado!');
      setIsFormVisible(false);
      setEditingContato(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar contato: ${error.message}`);
    },
  });

  // Mutation para deletar contato
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contatos_cliente')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos', cliente.id] });
      toast.success('Contato excluído!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir contato: ${error.message}`);
    },
  });

  const handleNovo = () => {
    setEditingContato(null);
    form.reset({
      nome: "",
      celular: "",
      email: "",
      principal: false,
      observacoes: "",
    });
    setIsFormVisible(true);
  };

  const handleEdit = (contato: Contato) => {
    setEditingContato(contato);
    form.reset({
      nome: contato.nome,
      celular: contato.celular || "",
      email: contato.email || "",
      principal: contato.principal,
      observacoes: contato.observacoes || "",
    });
    setIsFormVisible(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ContatoFormData) => {
    saveMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingContato(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Contatos de {cliente?.nome_razao_social}
          </DialogTitle>
          <DialogDescription>
            Gerencie os contatos associados a este cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Formulário de adição/edição */}
          {!isFormVisible ? (
            <Button onClick={handleNovo} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Novo Contato
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingContato ? 'Editar Contato' : 'Novo Contato'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do contato" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="celular"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Celular</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contato@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Anotações sobre este contato" {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="principal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Contato Principal</FormLabel>
                            <FormDescription className="text-xs">
                              Marque como contato padrão para este cliente
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saveMutation.isPending}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                        {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Lista de contatos */}
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : !contatos || contatos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum contato cadastrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[100px]">Principal</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contatos.map((contato) => (
                    <TableRow key={contato.id}>
                      <TableCell className="font-medium">
                        {contato.nome}
                      </TableCell>
                      <TableCell>{contato.celular || '-'}</TableCell>
                      <TableCell>{contato.email || '-'}</TableCell>
                      <TableCell>
                        {contato.principal && (
                          <Badge className="bg-amber-500">
                            <Star className="h-3 w-3" />
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(contato)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(contato.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
