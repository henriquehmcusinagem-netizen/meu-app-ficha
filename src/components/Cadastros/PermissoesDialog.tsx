import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface PermissoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: any;
}

// Módulos disponíveis no sistema
const MODULOS_SISTEMA = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'fichas', label: 'Fichas Técnicas' },
  { value: 'compras', label: 'Compras' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'pcp', label: 'PCP' },
  { value: 'producao', label: 'Produção' },
  { value: 'cadastros', label: 'Cadastros' },
];

// Permissões especiais
const PERMISSOES_ESPECIAIS = [
  { value: 'aprovar_interno', label: 'Aprovar Internamente' },
  { value: 'deletar', label: 'Deletar Registros' },
  { value: 'ver_custos', label: 'Ver Custos' },
  { value: 'administrador', label: 'Administrador' },
];

export function PermissoesDialog({ open, onOpenChange, usuario }: PermissoesDialogProps) {
  const queryClient = useQueryClient();
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([]);
  const [permissoesEspeciais, setPermissoesEspeciais] = useState<string[]>([]);

  // Query para buscar permissões de módulos do usuário
  const { data: userModulos } = useQuery({
    queryKey: ['user_permissions', usuario?.id],
    queryFn: async () => {
      if (!usuario?.id) return [];

      const { data, error } = await supabase
        .from('user_permissions')
        .select('modulo, can_access')
        .eq('user_id', usuario.id);

      if (error) throw error;
      return data.filter(p => p.can_access).map(p => p.modulo);
    },
    enabled: !!usuario?.id && open,
  });

  // Query para buscar permissões especiais do usuário
  const { data: userEspeciais } = useQuery({
    queryKey: ['user_special_permissions', usuario?.id],
    queryFn: async () => {
      if (!usuario?.id) return [];

      const { data, error } = await supabase
        .from('user_special_permissions')
        .select('permission, granted')
        .eq('user_id', usuario.id);

      if (error) throw error;
      return data.filter(p => p.granted).map(p => p.permission);
    },
    enabled: !!usuario?.id && open,
  });

  // Carregar permissões quando dados chegarem
  useEffect(() => {
    if (userModulos) {
      setModulosSelecionados(userModulos);
    }
  }, [userModulos]);

  useEffect(() => {
    if (userEspeciais) {
      setPermissoesEspeciais(userEspeciais);
    }
  }, [userEspeciais]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Atualizar permissões de módulos
      // Deletar todas as permissões existentes
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', usuario.id);

      // Inserir novas permissões
      if (modulosSelecionados.length > 0) {
        const modulosToInsert = modulosSelecionados.map(modulo => ({
          user_id: usuario.id,
          modulo: modulo,
          can_access: true,
        }));

        const { error: modulosError } = await supabase
          .from('user_permissions')
          .insert(modulosToInsert);

        if (modulosError) throw modulosError;
      }

      // 2. Atualizar permissões especiais
      // Deletar todas as permissões especiais existentes
      await supabase
        .from('user_special_permissions')
        .delete()
        .eq('user_id', usuario.id);

      // Inserir novas permissões especiais
      if (permissoesEspeciais.length > 0) {
        const especiaisToInsert = permissoesEspeciais.map(permission => ({
          user_id: usuario.id,
          permission: permission,
          granted: true,
        }));

        const { error: especialError } = await supabase
          .from('user_special_permissions')
          .insert(especiaisToInsert);

        if (especialError) throw especialError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_permissions'] });
      queryClient.invalidateQueries({ queryKey: ['user_special_permissions'] });
      toast.success('Permissões atualizadas com sucesso!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar permissões: ${error.message}`);
    },
  });

  const toggleModulo = (modulo: string) => {
    setModulosSelecionados(prev =>
      prev.includes(modulo)
        ? prev.filter(m => m !== modulo)
        : [...prev, modulo]
    );
  };

  const togglePermissaoEspecial = (permission: string) => {
    setPermissoesEspeciais(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>
            Configurar permissões de acesso para {usuario?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Permissões de Módulos */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Acesso a Módulos</h3>
            <ScrollArea className="h-[180px] rounded-md border p-4">
              <div className="space-y-3">
                {MODULOS_SISTEMA.map((modulo) => (
                  <div key={modulo.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`modulo-${modulo.value}`}
                      checked={modulosSelecionados.includes(modulo.value)}
                      onCheckedChange={() => toggleModulo(modulo.value)}
                    />
                    <label
                      htmlFor={`modulo-${modulo.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {modulo.label}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Permissões Especiais */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Permissões Especiais</h3>
            <ScrollArea className="h-[140px] rounded-md border p-4">
              <div className="space-y-3">
                {PERMISSOES_ESPECIAIS.map((permissao) => (
                  <div key={permissao.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permissao-${permissao.value}`}
                      checked={permissoesEspeciais.includes(permissao.value)}
                      onCheckedChange={() => togglePermissaoEspecial(permissao.value)}
                    />
                    <label
                      htmlFor={`permissao-${permissao.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permissao.label}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ <strong>Administrador</strong> tem acesso total ao sistema
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
