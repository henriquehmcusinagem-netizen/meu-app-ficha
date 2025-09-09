import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const { user, loading, signInWithPassword, signUpWithPassword } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signInWithPassword(email, password);
    
    if (error) {
      toast({
        title: 'Erro no login',
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos'
          : error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Acesso autorizado!',
        description: 'Bem-vindo ao sistema'
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUpWithPassword(email, password);
    
    if (error) {
      toast({
        title: 'Erro no cadastro',
        description: error.message === 'User already registered'
          ? 'Este email já está cadastrado. Tente fazer login.'
          : error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Cadastro realizado!',
        description: 'Sua conta foi criada com sucesso'
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle>Acesso Corporativo</CardTitle>
          <CardDescription>
            Entre com suas credenciais ou crie uma nova conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button 
                onClick={handleLogin}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button 
                onClick={handleSignUp}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}