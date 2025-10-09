import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PermissoesDialog } from "./PermissoesDialog";
import { toast } from "sonner";

interface Usuario {
  id: string;
  email: string;
  created_at: string;
}

interface UserPermission {
  id: string;
  user_id: string;
  modulo: string;
  can_access: boolean;
}

interface UserSpecialPermission {
  id: string;
  user_id: string;
  permission: string;
  granted: boolean;
}

export function UsuariosTab() {
  const queryClient = useQueryClient();
  const [isPermissoesOpen, setIsPermissoesOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  // Query para listar usuários do Supabase Auth
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['auth-usuarios'],
    queryFn: async () => {
      // Obter token de autenticação
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      const token = sessionData.session.access_token;

      // Chamar Edge Function list-users
      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error('Erro ao chamar list-users:', error);
        throw new Error(`Erro ao carregar usuários: ${error.message}`);
      }

      if (!data || !data.users) {
        return [];
      }

      // Mapear para interface Usuario
      return data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })) as Usuario[];
    },
  });

  // Query para permissões de módulos
  const { data: userPermissions } = useQuery({
    queryKey: ['user_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*');

      if (error) throw error;
      return data as UserPermission[];
    },
  });

  // Query para permissões especiais
  const { data: specialPermissions } = useQuery({
    queryKey: ['user_special_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_special_permissions')
        .select('*');

      if (error) throw error;
      return data as UserSpecialPermission[];
    },
  });

  const handleGerenciarPermissoes = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsPermissoesOpen(true);
  };

  // Função para pegar módulos com acesso
  const getModulosUsuario = (usuarioId: string): string[] => {
    if (!userPermissions) return [];
    return userPermissions
      .filter(p => p.user_id === usuarioId && p.can_access)
      .map(p => p.modulo);
  };

  // Função para verificar se é admin
  const isAdmin = (usuarioId: string): boolean => {
    if (!specialPermissions) return false;
    return specialPermissions.some(
      sp => sp.user_id === usuarioId && sp.permission === 'administrador' && sp.granted
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando usuários...</p>
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
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Gerenciar permissões de acesso a módulos e funcionalidades
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!usuarios || usuarios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">📭 Nenhum usuário cadastrado</p>
              <p className="text-sm mt-2">
                Usuários são criados através do sistema de autenticação
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Módulos com Acesso</TableHead>
                    <TableHead className="w-[120px]">Admin</TableHead>
                    <TableHead className="w-[150px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => {
                    const modulos = getModulosUsuario(usuario.id);
                    const admin = isAdmin(usuario.id);

                    return (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">
                          {usuario.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {modulos.length === 0 ? (
                              <span className="text-sm text-muted-foreground">
                                Sem permissões
                              </span>
                            ) : (
                              modulos.map((modulo, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {modulo}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {admin && (
                            <Badge className="bg-purple-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGerenciarPermissoes(usuario)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Permissões
                          </Button>
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

      {/* Dialog de permissões */}
      {selectedUsuario && (
        <PermissoesDialog
          open={isPermissoesOpen}
          onOpenChange={setIsPermissoesOpen}
          usuario={selectedUsuario}
        />
      )}
    </div>
  );
}
