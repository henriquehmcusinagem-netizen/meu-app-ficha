import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentText } = await req.json();

    if (!currentText?.trim()) {
      throw new Error('Texto não pode estar vazio');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key não configurada');
      return new Response(
        JSON.stringify({
          error: 'Chave da API OpenAI não configurada nos secrets do Supabase'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Chamando OpenAI API para melhorar descrição...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um **Agente Técnico Especialista em Relatórios e Escopos da HMC Usinagem**.
Sua função é transformar textos técnicos brutos enviados pelo usuário em **descrições claras, organizadas e profissionais**, sempre no formato **Análise de Peritagem + Escopo Técnico**.

### **Regras de atuação**

1. Sempre mostrar o resultado neste formato:

\`\`\`
Descritivo Técnico Melhorado pela IA
Texto Original:
(texto enviado pelo usuário)

Texto Melhorado pela IA:
## Análise de Peritagem
(descrição técnica resumida dos problemas ou justificativas para intervenção)

## Escopo Técnico
- (listar serviços de forma clara, técnica e profissional)
- (incluir materiais, processos e observações importantes)
\`\`\`

2. O texto melhorado deve ser **mais técnico, convincente e fácil de entender**, destacando:

   * Materiais (aço SAE, ASTM, etc.).
   * Processos (usinagem CNC, plasma, solda, pintura epóxi, testes LP etc.).
   * Folgas, medidas, tolerâncias.
   * Observações (quando não há garantia, quando depende de aprovação etc.).

3. Sempre que o texto enviado for **simples ou bagunçado**, você deve organizar, padronizar e entregar o **escopo técnico finalizado**.

4. Nunca inventar serviços além do informado. Apenas **organizar, corrigir e padronizar**.

Responda APENAS com o texto melhorado no formato estruturado, sem explicações adicionais.`
          },
          {
            role: 'user',
            content: `Melhore este descritivo técnico de serviço industrial:

"${currentText}"`
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API OpenAI:', errorData);

      let errorMessage = 'Erro desconhecido da API OpenAI';

      if (response.status === 401) {
        errorMessage = 'Chave da API OpenAI inválida';
      } else if (response.status === 429) {
        errorMessage = 'Limite de uso da API OpenAI excedido. Tente novamente mais tarde.';
      } else if (errorData.error?.message) {
        errorMessage = `Erro da API OpenAI: ${errorData.error.message}`;
      }

      throw new Error(errorMessage);
    }

    const data: OpenAIResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('Resposta inválida da API OpenAI');
    }

    const improvedText = data.choices[0].message.content.trim();

    if (!improvedText) {
      throw new Error('API OpenAI retornou resposta vazia');
    }

    console.log('Descrição melhorada com sucesso');

    return new Response(
      JSON.stringify({ improvedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na edge function improve-description:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao conectar com o serviço de IA';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
