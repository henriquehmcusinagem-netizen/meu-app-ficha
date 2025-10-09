import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

const clienteSchema = z.object({
  nome_razao_social: z.string().min(1, "Nome/Razão Social é obrigatório"),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: any | null;
}

export function ClienteFormDialog({ open, onOpenChange, cliente }: ClienteFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!cliente;

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome_razao_social: "",
      cnpj: "",
      endereco: "",
      observacoes: "",
      ativo: true,
    },
  });

  // Resetar formulário quando abrir/fechar ou trocar cliente
  useEffect(() => {
    if (open && cliente) {
      form.reset({
        nome_razao_social: cliente.nome_razao_social || "",
        cnpj: cliente.cnpj || "",
        endereco: cliente.endereco || "",
        observacoes: cliente.observacoes || "",
        ativo: cliente.ativo ?? true,
      });
    } else if (open && !cliente) {
      form.reset({
        nome_razao_social: "",
        cnpj: "",
        endereco: "",
        observacoes: "",
        ativo: true,
      });
    }
  }, [open, cliente, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      if (isEditing) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update({
            nome_razao_social: data.nome_razao_social,
            cnpj: data.cnpj || null,
            endereco: data.endereco || null,
            observacoes: data.observacoes || null,
            ativo: data.ativo,
          })
          .eq('id', cliente.id);

        if (error) throw error;
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('clientes')
          .insert({
            nome_razao_social: data.nome_razao_social,
            cnpj: data.cnpj || null,
            endereco: data.endereco || null,
            observacoes: data.observacoes || null,
            ativo: data.ativo,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar cliente: ${error.message}`);
    },
  });

  const onSubmit = (data: ClienteFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados do cliente abaixo.'
              : 'Preencha os dados do novo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_razao_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome / Razão Social *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome fantasia ou razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormDescription>
                    CNPJ da empresa (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Rua, número, bairro, cidade, estado"
                      {...field}
                      rows={3}
                    />
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
                    <Textarea
                      placeholder="Anotações internas sobre o cliente"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cliente Ativo</FormLabel>
                    <FormDescription>
                      Desative se o cliente não estiver mais em operação
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
