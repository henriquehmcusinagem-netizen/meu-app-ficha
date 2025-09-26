import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });

  // Verificar se o usuário tem permissão (simplificado - apenas verifica se está logado)
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Carregar lista de usuários
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      // Como não podemos acessar auth.users diretamente, vamos usar uma abordagem alternativa
      // Por enquanto, mostraremos apenas informações básicas
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setError('Erro ao carregar usuários');
        return;
      }

      // Por limitação do Supabase, não podemos listar todos os usuários diretamente
      // Em um ambiente real, você criaria uma edge function para isso
      setUsers([]);
      setError('Funcionalidade de listagem de usuários requer configuração adicional');
    } catch (err) {
      setError('Erro inesperado ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreateUserForm) => {
    setIsCreating(true);
    setError(null);

    try {
      // Criar usuário usando a função signUp
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        if (error.message === 'User already registered') {
          setError('Este email já está cadastrado');
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: 'Usuário criado com sucesso!',
          description: 'O usuário receberá um email de confirmação.',
        });
        form.reset();
        setIsDialogOpen(false);
        loadUsers();
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Gestão de Usuários
              </h1>
              <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    {...form.register('email')}
                    disabled={isCreating}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      {...form.register('password')}
                      disabled={isCreating}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme a senha"
                    {...form.register('confirmPassword')}
                    disabled={isCreating}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Usuário
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando usuários...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum usuário encontrado.</p>
                <p className="text-sm mt-2">
                  Para listar usuários existentes, é necessário configurar uma Edge Function administrativa.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.email_confirmed_at
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300'
                        }`}>
                          {user.email_confirmed_at ? 'Ativo' : 'Pendente'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}