import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function AdminPasswordReset() {
  const [loading, setLoading] = useState(false);

  const resetPasswords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-passwords');
      
      if (error) {
        console.error('Error:', error);
        toast.error('Erro ao resetar senhas: ' + error.message);
        return;
      }

      console.log('Password reset results:', data);
      toast.success('Senhas resetadas com sucesso! Nova senha: @hmc402');
      
    } catch (error) {
      console.error('Error calling function:', error);
      toast.error('Erro ao executar função');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">Reset de Senhas (Admin)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Definir senha "@hmc402" para todos os usuários (contato@, compras@, producao@hmcusinagem.com.br)
      </p>
      <Button 
        onClick={resetPasswords} 
        disabled={loading}
        variant="destructive"
      >
        {loading ? 'Resetando...' : 'Resetar Senhas'}
      </Button>
    </div>
  );
}