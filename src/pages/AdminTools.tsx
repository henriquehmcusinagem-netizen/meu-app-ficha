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

  const emergencyDiagnosis = async () => {
    setLoading(true);
    try {
      console.log('🚨 DIAGNÓSTICO DE EMERGÊNCIA');
      
      // Teste 1: Verificar se edge function responde
      toast({
        title: '🔧 Fase 1: Testando Edge Functions',
        description: 'Verificando se admin-auth está funcionando...'
      });
      
      const response = await supabase.functions.invoke('admin-auth', {
        body: { action: 'list-users' }
      });
      
      console.log('📊 Response da edge function:', response);
      
      if (response.error) {
        toast({
          title: '❌ Edge Function com erro',
          description: `Erro: ${response.error.message}`,
          variant: 'destructive'
        });
      } else if (response.data?.users) {
        toast({
          title: '✅ Edge Function funcionando',
          description: `Encontrados ${response.data.users.length} usuários no Auth`,
        });
        
        console.log('👥 Usuários no Supabase Auth:', response.data.users);
        setUsers(response.data.users);
      }
      
      // Teste 2: Verificar usuários autorizados
      const { data: authorized, error: authError } = await supabase
        .from('usuarios_autorizados')
        .select('*')
        .eq('ativo', true);
        
      if (authError) {
        console.error('❌ Erro ao buscar usuários autorizados:', authError);
      } else {
        console.log('📋 Usuários autorizados:', authorized);
        toast({
          title: '📋 Usuários Autorizados',
          description: `Encontrados ${authorized?.length || 0} usuários autorizados`,
        });
      }
      
    } catch (error) {
      console.error('🚨 Erro no diagnóstico:', error);
      toast({
        title: '🚨 Erro no Diagnóstico',
        description: `Erro: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const fixAllCredentialsEmergency = async () => {
    setLoading(true);
    const emails = [
      'contato@hmcusinagem.com.br',
      'compras@hmcusinagem.com.br', 
      'producao@hmcusinagem.com.br'
    ];
    
    try {
      toast({
        title: '🚨 CORREÇÃO DE EMERGÊNCIA',
        description: 'Resetando credenciais para todos os usuários...'
      });

      for (const email of emails) {
        console.log(`🔧 Corrigindo credenciais para: ${email}`);
        
        // Reset password
        const resetResult = await supabase.functions.invoke('admin-auth', {
          body: { 
            action: 'reset-password', 
            email: email, 
            newPassword: '@Hmcusinagem402' 
          }
        });
        
        console.log(`📊 Reset result for ${email}:`, resetResult);
        
        if (resetResult.error) {
          toast({
            title: `❌ Erro ao resetar ${email}`,
            description: resetResult.error.message,
            variant: 'destructive'
          });
          continue;
        }
        
        // Test login immediately
        const testResult = await supabase.functions.invoke('admin-auth', {
          body: { 
            action: 'test-login', 
            email: email, 
            newPassword: '@Hmcusinagem402' 
          }
        });
        
        console.log(`🧪 Test result for ${email}:`, testResult);
        
        if (testResult.data?.success) {
          toast({
            title: `✅ ${email} CORRIGIDO`,
            description: 'Login funcionando perfeitamente!'
          });
        } else {
          toast({
            title: `❌ ${email} ainda com problema`,
            description: testResult.data?.error || 'Login falhou',
            variant: 'destructive'
          });
        }
        
        // Wait 1 second between operations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: '🎉 Correção Finalizada',
        description: 'Verificar resultados acima para cada usuário'
      });
      
    } catch (error) {
      console.error('🚨 Erro na correção de emergência:', error);
      toast({
        title: '🚨 Erro na Correção',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fixAllCredentials = async () => {
    const emails = [
      'contato@hmcusinagem.com.br',
      'compras@hmcusinagem.com.br',
      'producao@hmcusinagem.com.br'
    ];
    
    setLoading(true);
    
    try {
      console.log('🔧 Iniciando correção de credenciais para todos os usuários...');
      
      // Reset password for each email
      for (const targetEmail of emails) {
        console.log(`\n🔑 Corrigindo credenciais para ${targetEmail}...`);
        
        // Reset password
        const resetResult = await callAdminFunction('reset-password', { 
          email: targetEmail, 
          newPassword: '@Hmcusinagem402' 
        });
        
        if (resetResult?.success) {
          console.log(`✅ Senha resetada com sucesso para ${targetEmail}`);
          
          // Test login immediately after reset
          const loginTest = await callAdminFunction('test-login', { 
            email: targetEmail, 
            newPassword: '@Hmcusinagem402' 
          });
          
          if (loginTest?.success) {
            console.log(`✅ Login funcionando para ${targetEmail}`);
            toast({
              title: "Credencial corrigida",
              description: `${targetEmail} agora pode fazer login`,
            });
          } else {
            console.log(`❌ Login ainda falhando para ${targetEmail}:`, loginTest?.error);
            toast({
              title: "Erro no teste",
              description: `Login ainda falha para ${targetEmail}`,
              variant: "destructive",
            });
          }
        } else {
          console.log(`❌ Falha ao resetar senha para ${targetEmail}`);
          toast({
            title: "Erro no reset",
            description: `Não foi possível resetar a senha de ${targetEmail}`,
            variant: "destructive",
          });
        }
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('🎉 Processo de correção finalizado');
      toast({
        title: "Correção concluída",
        description: "Todas as credenciais foram processadas. Verifique os logs para detalhes.",
      });
      
    } catch (error) {
      console.error('❌ Erro durante correção:', error);
      toast({
        title: "Erro crítico",
        description: "Erro inesperado durante a correção das credenciais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              
              <div className="pt-4 border-t space-y-2">
                <Button 
                  onClick={emergencyDiagnosis}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  🚨 DIAGNÓSTICO DE EMERGÊNCIA
                </Button>
                
                <Button 
                  onClick={fixAllCredentialsEmergency}
                  disabled={loading}
                  className="w-full"
                  variant="destructive"
                >
                  🔧 CORREÇÃO DE EMERGÊNCIA
                </Button>
                
                <Button 
                  onClick={fixAllCredentials} 
                  disabled={loading} 
                  variant="secondary"
                  className="w-full"
                >
                  🔧 CORRIGIR CREDENCIAIS (Normal)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Diagnóstico primeiro, depois correção de emergência se necessário
                </p>
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