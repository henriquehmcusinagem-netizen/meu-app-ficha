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

/**
 * Gera análise de perícia técnica profissional para FTC Cliente
 * USANDO DADOS REAIS DA FICHA
 */
export async function gerarAnalisePericia(
  ficha: any, // FichaSalva completa
  materiais: any[] // Lista de materiais
): Promise<string> {
  if (!ficha?.formData?.nome_peca || !ficha?.formData?.servico) {
    throw new Error('Nome da peça e serviço são obrigatórios');
  }

  try {
    // Extrair dados REAIS da ficha
    const { formData } = ficha;

    // Processos de fabricação REAIS (horas > 0)
    const processos: string[] = [];
    if (parseFloat(formData.torno_cnc || 0) > 0) processos.push(`Torno CNC (${formData.torno_cnc}h)`);
    if (parseFloat(formData.torno_grande || 0) > 0) processos.push(`Torno Grande (${formData.torno_grande}h)`);
    if (parseFloat(formData.centro_usinagem || 0) > 0) processos.push(`Centro de Usinagem (${formData.centro_usinagem}h)`);
    if (parseFloat(formData.fresa || 0) > 0) processos.push(`Fresa (${formData.fresa}h)`);
    if (parseFloat(formData.furadeira || 0) > 0) processos.push(`Furadeira (${formData.furadeira}h)`);
    if (parseFloat(formData.plasma_oxicorte || 0) > 0) processos.push(`Plasma/Oxicorte (${formData.plasma_oxicorte}h)`);
    if (parseFloat(formData.solda || 0) > 0) processos.push(`Solda (${formData.solda}h)`);
    if (parseFloat(formData.dobra || 0) > 0) processos.push(`Dobra (${formData.dobra}h)`);
    if (parseFloat(formData.calandra || 0) > 0) processos.push(`Calandra (${formData.calandra}h)`);
    if (parseFloat(formData.caldeiraria || 0) > 0) processos.push(`Caldeiraria (${formData.caldeiraria}h)`);
    if (parseFloat(formData.mandrilhamento || 0) > 0) processos.push(`Mandrilhamento (${formData.mandrilhamento}h)`);
    if (parseFloat(formData.balanceamento || 0) > 0) processos.push(`Balanceamento (${formData.balanceamento}h)`);

    // Tratamentos e acabamentos REAIS
    const tratamentos: string[] = [];
    if (formData.pintura === 'SIM') tratamentos.push(`Pintura ${formData.cor_pintura || 'especificada'}`);
    if (formData.galvanizacao === 'SIM') tratamentos.push(`Galvanização (${formData.peso_peca_galv || '?'}kg)`);
    if (formData.tratamento_termico === 'SIM') {
      if (formData.tempera_reven) tratamentos.push(`Têmpera/Revenimento`);
      if (formData.cementacao) tratamentos.push(`Cementação`);
      if (formData.dureza) tratamentos.push(`Dureza ${formData.dureza}`);
    }
    if (formData.teste_lp === 'SIM') tratamentos.push('Teste de Líquido Penetrante');
    if (formData.balanceamento_campo === 'SIM') tratamentos.push(`Balanceamento em campo (${formData.rotacao || '?'} RPM)`);

    // Materiais REAIS da cotação
    const materiaisTexto = materiais.length > 0
      ? materiais.map(m => `${m.descricao} (${m.quantidade} ${m.unidade})`).join(', ')
      : 'Materiais conforme especificação técnica';

    // Serviços terceirizados REAIS
    const terceirizados = formData.servicos_terceirizados?.trim() || '';

    // 📸 Buscar fotos da ficha para análise visual
    const fotoUrls: string[] = [];
    if (ficha.fotos && ficha.fotos.length > 0) {
      // Pegar até 4 fotos (limite para não estourar tokens)
      const fotosParaAnalise = ficha.fotos.slice(0, 4);

      for (const foto of fotosParaAnalise) {
        if (foto.storagePath) {
          try {
            // Gerar signed URL para a foto
            const { data: urlData } = await supabase.storage
              .from('ficha-fotos')
              .createSignedUrl(foto.storagePath, 3600); // 1 hora

            if (urlData?.signedUrl) {
              fotoUrls.push(urlData.signedUrl);
            }
          } catch (error) {
            console.error('Erro ao gerar URL da foto:', error);
          }
        } else if (foto.preview) {
          // Foto local ainda não salva
          fotoUrls.push(foto.preview);
        }
      }
    }

    console.log(`📸 Análise de perícia com ${fotoUrls.length} foto(s)`);

    const prompt = `Você é um engenheiro mecânico especializado da HMC Usinagem.

Analise os DADOS REAIS desta ficha técnica e gere uma análise profissional:

**DADOS DA PEÇA:**
- Nome: ${formData.nome_peca}
- Quantidade: ${formData.quantidade}
- Serviço: ${formData.servico}
- Cliente: ${formData.cliente || 'Não especificado'}

**PROCESSOS DE FABRICAÇÃO CONFIRMADOS:**
${processos.length > 0 ? processos.join(', ') : 'Conforme especificação técnica'}

**MATERIAIS COTADOS:**
${materiaisTexto}

**TRATAMENTOS E ACABAMENTOS:**
${tratamentos.length > 0 ? tratamentos.join(', ') : 'Conforme especificação'}

**SERVIÇOS TERCEIRIZADOS:**
${terceirizados || 'Não há serviços terceirizados'}

**OBSERVAÇÕES ADICIONAIS:**
${formData.observacoes_adicionais?.trim() || 'Nenhuma observação adicional'}

**INSTRUÇÕES:**
Gere uma análise técnica profissional usando APENAS os dados acima. NÃO INVENTE informações que não estão documentadas.

Formato:
## Análise de Peritagem
(1-2 parágrafos descrevendo a peça e sua aplicação)

## Escopo Técnico
- **Processos de Fabricação**: (Liste APENAS os processos confirmados acima)
- **Materiais**: (Liste APENAS os materiais cotados acima)
- **Tratamentos e Acabamentos**: (Liste APENAS os tratamentos confirmados acima)
- **Considerações Técnicas**: (Observações importantes baseadas nos dados reais)

Seja técnico, objetivo e mencione APENAS o que está documentado.

${fotoUrls.length > 0 ? `\n**ATENÇÃO**: Há ${fotoUrls.length} foto(s) anexada(s). Analise as imagens para identificar características visuais da peça e incorpore essas informações na análise.` : ''}`;

    const { data, error } = await supabase.functions.invoke('improve-description', {
      body: {
        currentText: prompt,
        imageUrls: fotoUrls.length > 0 ? fotoUrls : undefined
      }
    });

    if (error) {
      console.error('Erro ao gerar análise de perícia:', error);
      throw new Error(`Erro do serviço de IA: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    if (!data?.improvedText) {
      throw new Error('Resposta inválida do serviço de IA para análise de perícia');
    }

    return data.improvedText;

  } catch (error) {
    console.error('Erro ao gerar análise de perícia:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro inesperado ao gerar análise de perícia');
    }
  }
}