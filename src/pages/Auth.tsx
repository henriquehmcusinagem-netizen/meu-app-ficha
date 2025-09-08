import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Mail, Shield } from 'lucide-react';

export default function Auth() {
  const { user, loading, signInWithPhone, signInWithEmail, verifyOtp, verifyEmailOtp } = useAuth();
  const { toast } = useToast();
  
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [verifyMethod, setVerifyMethod] = useState<'phone' | 'email'>('phone');
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

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Aplicar formatação brasileira
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const getPhoneForAuth = (formattedPhone: string) => {
    const digits = formattedPhone.replace(/\D/g, '');
    return `+55${digits}`;
  };

  const handlePhoneLogin = async () => {
    if (!phone) {
      toast({ title: 'Erro', description: 'Digite seu telefone', variant: 'destructive' });
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      toast({ title: 'Erro', description: 'Telefone deve ter 11 dígitos (DDD + número)', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const phoneForAuth = getPhoneForAuth(phone);
    
    const { error } = await signInWithPhone(phoneForAuth);
    
    if (error) {
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setVerifyMethod('phone');
      setStep('verify');
      toast({
        title: 'SMS enviado!',
        description: 'Verifique seu celular e digite o código recebido'
      });
    }
    
    setIsLoading(false);
  };

  const handleEmailLogin = async () => {
    if (!email) {
      toast({ title: 'Erro', description: 'Digite seu email', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signInWithEmail(email);
    
    if (error) {
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setVerifyMethod('email');
      setStep('verify');
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada e digite o código recebido'
      });
    }
    
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: 'Erro', description: 'Digite o código de 6 dígitos', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    let error;
    if (verifyMethod === 'phone') {
      const phoneForAuth = getPhoneForAuth(phone);
      const result = await verifyOtp(phoneForAuth, otp);
      error = result.error;
    } else {
      const result = await verifyEmailOtp(email, otp);
      error = result.error;
    }

    if (error) {
      toast({
        title: 'Código inválido',
        description: 'Verifique o código e tente novamente',
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

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Verificar Código</CardTitle>
            <CardDescription>
              Digite o código de 6 dígitos enviado para seu {verifyMethod === 'phone' ? 'telefone' : 'email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Código de Verificação</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            
            <Button 
              onClick={handleVerifyOtp}
              className="w-full"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? 'Verificando...' : 'Confirmar'}
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => setStep('login')}
              className="w-full"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle>Acesso Corporativo</CardTitle>
          <CardDescription>
            Entre com seu telefone ou email autorizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="phone" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Telefone
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="phone" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
              <Button 
                onClick={handlePhoneLogin}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando SMS...' : 'Enviar Código SMS'}
              </Button>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <Button 
                onClick={handleEmailLogin}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando Email...' : 'Enviar Código por Email'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}