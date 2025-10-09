import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const funcionarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  turno: z.enum(['A', 'B']).default('A'),
  ativo: z.boolean().default(true),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface FuncionarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: any | null;
}

// Lista de processos disponíveis (24 processos - MESMOS da FTC)
const PROCESSOS_DISPONIVEIS = [
  // 🔧 Grupo 1: Tornos e Usinagem (6 processos)
  { value: 'torno_grande', label: 'Torno 1200mm' },
  { value: 'torno_pequeno', label: 'Torno 650mm' },
  { value: 'torno_cnc', label: 'Torno CNC' },
  { value: 'centro_usinagem', label: 'Centro Usinagem' },
  { value: 'fresa', label: 'Fresa' },
  { value: 'furadeira', label: 'Furadeira' },

  // ⚙️ Grupo 2: Corte e Conformação (7 processos)
  { value: 'plasma_oxicorte', label: 'Plasma/Oxicorte' },
  { value: 'macarico', label: 'Maçarico' },
  { value: 'solda', label: 'Solda' },
  { value: 'serra', label: 'Serra' },
  { value: 'dobra', label: 'Dobra' },
  { value: 'calandra', label: 'Calandra' },
  { value: 'caldeiraria', label: 'Caldeiraria' },

  // 🔩 Grupo 3: Montagem e Especiais (5 processos)
  { value: 'des_montg', label: 'Desmontagem' },
  { value: 'montagem', label: 'Montagem' },
  { value: 'balanceamento', label: 'Balanceamento' },
  { value: 'mandrilhamento', label: 'Mandrilhamento' },
  { value: 'tratamento', label: 'Tratamento' },

  // ✨ Grupo 4: Acabamento e Engenharia (6 processos)
  { value: 'lavagem', label: 'Lavagem' },
  { value: 'acabamento', label: 'Acabamento' },
  { value: 'pintura_horas', label: 'Pintura' },
  { value: 'programacao_cam', label: 'Programação CAM' },
  { value: 'eng_tec', label: 'Eng/Técnico' },
  { value: 'tecnico_horas', label: 'Técnico Horas' },
];

export function FuncionarioFormDialog({ open, onOpenChange, funcionario }: FuncionarioFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!funcionario;
  const [selectedProcessos, setSelectedProcessos] = useState<string[]>([]);

  const form = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: "",
      turno: "A",
      ativo: true,
    },
  });

  // Query para buscar processos do funcionário (se editando)
  const { data: processosFuncionario } = useQuery({
    queryKey: ['funcionario_processos', funcionario?.id],
    queryFn: async () => {
      if (!funcionario?.id) return [];

      const { data, error } = await supabase
        .from('funcionario_processos')
        .select('processo')
        .eq('funcionario_id', funcionario.id);

      if (error) throw error;
      return data.map(p => p.processo);
    },
    enabled: !!funcionario?.id && open,
  });

  // Resetar formulário quando abrir/fechar ou trocar funcionário
  useEffect(() => {
    if (open && funcionario) {
      form.reset({
        nome: funcionario.nome || "",
        turno: funcionario.turno || "A",
        ativo: funcionario.ativo ?? true,
      });
    } else if (open && !funcionario) {
      form.reset({
        nome: "",
        turno: "A",
        ativo: true,
      });
      setSelectedProcessos([]);
    }
  }, [open, funcionario, form]);

  // Carregar processos selecionados quando dados chegarem
  useEffect(() => {
    if (processosFuncionario) {
      setSelectedProcessos(processosFuncionario);
    }
  }, [processosFuncionario]);

  const saveMutation = useMutation({
    mutationFn: async (data: FuncionarioFormData) => {
      let funcionarioId = funcionario?.id;

      if (isEditing) {
        // Atualizar funcionário existente
        const { error } = await supabase
          .from('funcionarios')
          .update({
            nome: data.nome,
            turno: data.turno,
            ativo: data.ativo,
          })
          .eq('id', funcionario.id);

        if (error) throw error;
      } else {
        // Criar novo funcionário
        const { data: newFunc, error } = await supabase
          .from('funcionarios')
          .insert({
            nome: data.nome,
            turno: data.turno,
            ativo: data.ativo,
          })
          .select()
          .single();

        if (error) throw error;
        funcionarioId = newFunc.id;
      }

      // Atualizar processos do funcionário
      // 1. Deletar todos os processos existentes
      await supabase
        .from('funcionario_processos')
        .delete()
        .eq('funcionario_id', funcionarioId);

      // 2. Inserir novos processos selecionados
      if (selectedProcessos.length > 0) {
        const processosToInsert = selectedProcessos.map(processo => ({
          funcionario_id: funcionarioId,
          processo: processo,
        }));

        const { error: processosError } = await supabase
          .from('funcionario_processos')
          .insert(processosToInsert);

        if (processosError) throw processosError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario_processos'] });
      toast.success(isEditing ? 'Funcionário atualizado!' : 'Funcionário criado!');
      onOpenChange(false);
      form.reset();
      setSelectedProcessos([]);
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar funcionário: ${error.message}`);
    },
  });

  const onSubmit = (data: FuncionarioFormData) => {
    saveMutation.mutate(data);
  };

  const toggleProcesso = (processo: string) => {
    setSelectedProcessos(prev =>
      prev.includes(processo)
        ? prev.filter(p => p !== processo)
        : [...prev, processo]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados do funcionário abaixo.'
              : 'Preencha os dados do novo funcionário.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do funcionário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="turno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">
                        <div className="flex flex-col">
                          <span className="font-semibold">Turno A</span>
                          <span className="text-xs text-muted-foreground">
                            Alterna: 08-17h + Sáb 08-12h | 08-17:48h sem Sáb (179h/mês)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="B">
                        <div className="flex flex-col">
                          <span className="font-semibold">Turno B</span>
                          <span className="text-xs text-muted-foreground">
                            Alterna: 08-17:48h sem Sáb | 08-17h + Sáb 08-12h (179h/mês)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Turnos alternam semanalmente. Ambos trabalham 179h/mês.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Processos que Domina</FormLabel>
              <FormDescription className="text-xs mb-2">
                Selecione os processos que este funcionário está apto a executar
              </FormDescription>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="grid grid-cols-2 gap-3">
                  {PROCESSOS_DISPONIVEIS.map((processo) => (
                    <div key={processo.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`processo-${processo.value}`}
                        checked={selectedProcessos.includes(processo.value)}
                        onCheckedChange={() => toggleProcesso(processo.value)}
                      />
                      <label
                        htmlFor={`processo-${processo.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {processo.label}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </FormItem>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Funcionário Ativo</FormLabel>
                    <FormDescription className="text-xs">
                      Desative se o funcionário não estiver mais trabalhando
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
