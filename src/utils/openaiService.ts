import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImproveDescriptionResponse {
  improvedText?: string;
  error?: string;
}

/**
 * Melhora o descritivo técnico usando Edge Function do Supabase
 */
export async function improveServiceDescription(currentText: string): Promise<string> {
  if (!currentText.trim()) {
    throw new Error('Texto não pode estar vazio');
  }

  try {
    const { data, error } = await supabase.functions.invoke('improve-description', {
      body: { currentText }
    });

    if (error) {
      console.error('Erro ao chamar edge function:', error);
      throw new Error(`Erro do serviço: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    if (!data?.improvedText) {
      throw new Error('Resposta inválida do serviço de IA');
    }
    return data.improvedText;

  } catch (error) {
    console.error('Erro ao conectar com o serviço de IA:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro inesperado ao conectar com o serviço de IA');
    }
  }
}

/**
 * Hook para usar o serviço de melhoria de descritivo com toast
 */
export function useServiceDescriptionImprovement() {
  const improveWithToast = async (currentText: string): Promise<string> => {
    try {
      toast({
        title: "🤖 Processando com IA...",
        description: "Analisando e melhorando o descritivo técnico.",
      });

      const improvedText = await improveServiceDescription(currentText);

      toast({
        title: "✅ Descritivo melhorado!",
        description: "O texto foi aprimorado com terminologia técnica mais precisa.",
      });

      return improvedText;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      toast({
        title: "❌ Erro ao melhorar descritivo",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  return { improveWithToast };
}