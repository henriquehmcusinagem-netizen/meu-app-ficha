import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminTools() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('@Hmcusinagem402');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { toast } = useToast();

  const callAdminFunction = async (action: string, additionalData = {}) => {
    setLoading(true);
    try {
      console.log(`🔧 Chamando função admin com ação: ${action}`);
      
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {
          action,
          email,
          newPassword: password,
          ...additionalData
        }
      });

      if (error) {
        console.error('❌ Erro na função admin:', error);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      console.log('✅ Resposta da função admin:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      toast({
        title: "Erro inesperado",
        description: String(err),
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const listUsers = async () => {
    const result = await callAdminFunction('list-users');
    if (result?.users) {
      setUsers(result.users);
      toast({
        title: "Usuários listados",
        description: `Encontrados ${result.users.length} usuários`
      });
    }
  };

  const resetPassword = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite um email",
        variant: "destructive"
      });
      return;
    }

    const result = await callAdminFunction('reset-password');
    if (result?.success) {
      toast({
        title: "Sucesso",
        description: `Senha resetada para ${email}`
      });
    }
  };

  const checkAuthorization = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite um email",
        variant: "destructive"
      });
      return;
    }

    const result = await callAdminFunction('check-authorization');
    if (result) {
      toast({
        title: "Verificação de autorização",
        description: `${email} ${result.authorized ? 'está autorizado' : 'NÃO está autorizado'}`
      });
    }
  };

  const testLogin = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite um email",
        variant: "destructive"
      });
      return;
    }

    const result = await callAdminFunction('test-login');
    if (result) {
      toast({
        title: result.success ? "Login bem-sucedido" : "Falha no login",
        description: result.success ? `Login OK para ${email}` : result.error,
        variant: result.success ? "default" : "destructive"
      });
    }
  };

  const testAllEmails = async () => {
    const emails = [
      'contato@hmcusinagem.com.br',
      'compras@hmcusinagem.com.br',
      'producao@hmcusinagem.com.br'
    ];

    for (const testEmail of emails) {
      console.log(`🧪 Testando email: ${testEmail}`);
      
      // Check authorization
      const authResult = await callAdminFunction('check-authorization', { email: testEmail });
      console.log(`📋 Autorização para ${testEmail}:`, authResult?.authorized);
      
      // Test login
      const loginResult = await callAdminFunction('test-login', { email: testEmail });
      console.log(`🔑 Login para ${testEmail}:`, loginResult?.success);
      
      toast({
        title: `Teste para ${testEmail}`,
        description: `Auth: ${authResult?.authorized ? 'OK' : 'FAIL'} | Login: ${loginResult?.success ? 'OK' : 'FAIL'}`
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Ferramentas Administrativas</h1>
      
      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auth">Autenticação</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Autenticação</CardTitle>
              <CardDescription>
                Ferramentas para testar e resolver problemas de login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email:</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite o email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Senha:</label>
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button onClick={checkAuthorization} disabled={loading}>
                  Verificar Autorização
                </Button>
                <Button onClick={testLogin} disabled={loading}>
                  Testar Login
                </Button>
                <Button onClick={resetPassword} disabled={loading}>
                  Resetar Senha
                </Button>
                <Button onClick={testAllEmails} disabled={loading} variant="outline">
                  Testar Todos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Listar todos os usuários cadastrados no Supabase Auth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={listUsers} disabled={loading} className="mb-4">
                Listar Usuários
              </Button>
              
              {users.length > 0 && (
                <div className="border rounded-lg">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-muted font-medium">
                    <div>Email</div>
                    <div>Criado em</div>
                    <div>Email Confirmado</div>
                    <div>Último Login</div>
                  </div>
                  {users.map((user) => (
                    <div key={user.id} className="grid grid-cols-4 gap-4 p-3 border-t">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        {user.email_confirmed_at ? '✅' : '❌'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Nunca'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}