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
    const { currentText, imageUrls } = await req.json();

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
    if (imageUrls?.length > 0) {
      console.log(`📸 Analisando ${imageUrls.length} foto(s) da peça`);
    }

    // Construir mensagem do usuário com texto e imagens (se houver)
    const userMessageContent: any[] = [
      {
        type: 'text',
        text: `Melhore este descritivo técnico de serviço industrial:\n\n"${currentText}"`
      }
    ];

    // Adicionar imagens se fornecidas (máximo 4 para não estourar o token limit)
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      const maxImages = Math.min(imageUrls.length, 4);
      for (let i = 0; i < maxImages; i++) {
        userMessageContent.push({
          type: 'image_url',
          image_url: {
            url: imageUrls[i],
            detail: 'low' // Usa menos tokens
          }
        });
      }
    }

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
            content: `Você é um **Engenheiro Mecânico Especialista em Relatórios Técnicos da HMC Usinagem**.

Sua função é transformar textos técnicos brutos em **análises profissionais e claras**, seguindo este formato:

## Análise de Peritagem
(Primeiro parágrafo: descrição técnica resumida da peça, função e aplicação industrial)

## Escopo Técnico

- **Processos de Fabricação**: (Listar processos técnicos necessários - usinagem CNC, soldagem AWS, plasma, tratamentos superficiais, etc.)

- **Requisitos de Qualidade**: (Normas técnicas aplicáveis como ASTM, ISO, tolerâncias dimensionais, acabamento superficial)

- **Considerações Técnicas**: (Material recomendado como aço SAE, aspectos críticos do projeto, observações importantes sobre aprovações e garantias)

**REGRAS IMPORTANTES**:
1. Retorne APENAS o conteúdo formatado acima, sem títulos extras como "Descritivo Técnico Melhorado" ou "Texto Original"
2. Seja técnico, objetivo e profissional usando terminologia da engenharia mecânica
3. Não invente serviços além do informado - apenas organize e padronize
4. Use materiais específicos (SAE 1045, ASTM A36, etc.) quando aplicável
5. Inclua tolerâncias típicas (±0,05 mm) e acabamento (Ra 1,6 µm) quando relevante

Responda DIRETAMENTE com o conteúdo formatado, sem preamble ou texto adicional.

**ATENÇÃO**: Se houver fotos fornecidas, analise-as para identificar características visíveis da peça (forma, estado, material aparente, dimensões estimadas, desgaste, etc.) e incorpore essas informações na análise.`
          },
          {
            role: 'user',
            content: userMessageContent
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

    let improvedText = data.choices[0].message.content.trim();

    if (!improvedText) {
      throw new Error('API OpenAI retornou resposta vazia');
    }

    // 🧹 Remover headers extras que o GPT possa ter incluído
    // Remove "Descritivo Técnico Melhorado pela IA" e variações
    improvedText = improvedText.replace(/^.*?Descritivo Técnico.*?\n*/gmi, '');
    improvedText = improvedText.replace(/^.*?Texto Original:.*?\n*/gmi, '');
    improvedText = improvedText.replace(/^.*?Texto Melhorado.*?\n*/gmi, '');

    // Remove blocos de código markdown se houver
    improvedText = improvedText.replace(/^```[\s\S]*?```$/gm, '');

    // Remove linhas vazias no início
    improvedText = improvedText.replace(/^\s*\n+/, '');

    // Garante que começa com "## Análise" ou o primeiro parágrafo
    if (!improvedText.startsWith('## Análise') && !improvedText.match(/^[A-Z]/)) {
      // Se ainda tiver lixo no início, procura onde começa o conteúdo real
      const match = improvedText.match(/(## Análise|[A-Z][a-z]+.*)/);
      if (match) {
        improvedText = improvedText.substring(match.index || 0);
      }
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
