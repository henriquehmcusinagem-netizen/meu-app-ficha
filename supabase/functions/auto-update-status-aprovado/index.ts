// Edge Function: Auto-update status para fichas aprovadas
// Chamada periodicamente ou após inserção em aprovacoes_ftc_cliente
// Atualiza status de 'orcamento_enviado_cliente' para 'orcamento_aprovado_cliente'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AprovacaoRow {
  id: string
  numero_ftc: string
  tipo: 'aprovar' | 'alterar' | 'rejeitar'
  created_at: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // 1. Buscar todas as aprovações do tipo 'aprovar'
    const { data: aprovacoes, error: aprovError } = await supabaseClient
      .from('aprovacoes_ftc_cliente')
      .select('id, numero_ftc, tipo, created_at')
      .eq('tipo', 'aprovar')
      .order('created_at', { ascending: false })

    if (aprovError) {
      console.error('❌ Erro ao buscar aprovações:', aprovError)
      throw aprovError
    }

    if (!aprovacoes || aprovacoes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma aprovação pendente de processamento',
          updated: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`✅ Encontradas ${aprovacoes.length} aprovações do tipo 'aprovar'`)

    // 2. Para cada aprovação, verificar se a ficha está no status correto e atualizar
    const updates: Array<{numeroFTC: string, success: boolean, message: string}> = []

    for (const aprovacao of aprovacoes) {
      const numeroFTC = aprovacao.numero_ftc

      // Buscar ficha atual
      const { data: ficha, error: fichaError } = await supabaseClient
        .from('fichas_tecnicas')
        .select('id, numero_ftc, status')
        .eq('numero_ftc', numeroFTC)
        .single()

      if (fichaError || !ficha) {
        console.error(`❌ Ficha ${numeroFTC} não encontrada:`, fichaError)
        updates.push({
          numeroFTC,
          success: false,
          message: `Ficha ${numeroFTC} não encontrada no banco`
        })
        continue
      }

      // Verificar se está no status correto para atualizar
      if (ficha.status !== 'orcamento_enviado_cliente') {
        console.log(`⚠️  FTC ${numeroFTC} não está em 'orcamento_enviado_cliente' (atual: ${ficha.status})`)
        updates.push({
          numeroFTC,
          success: false,
          message: `FTC ${numeroFTC} já está em status: ${ficha.status}`
        })
        continue
      }

      // Atualizar para status aprovado
      const { error: updateError } = await supabaseClient
        .from('fichas_tecnicas')
        .update({
          status: 'orcamento_aprovado_cliente',
          data_ultima_edicao: new Date().toISOString()
        })
        .eq('numero_ftc', numeroFTC)

      if (updateError) {
        console.error(`❌ Erro ao atualizar FTC ${numeroFTC}:`, updateError)
        updates.push({
          numeroFTC,
          success: false,
          message: `Erro ao atualizar: ${updateError.message}`
        })
        continue
      }

      console.log(`✅ FTC ${numeroFTC} atualizada para 'orcamento_aprovado_cliente'`)
      updates.push({
        numeroFTC,
        success: true,
        message: `FTC ${numeroFTC} marcada como aprovada com sucesso`
      })
    }

    // 3. Retornar resultado
    const successCount = updates.filter(u => u.success).length
    const failCount = updates.filter(u => !u.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído: ${successCount} aprovadas, ${failCount} não processadas`,
        total: aprovacoes.length,
        updated: successCount,
        failed: failCount,
        details: updates
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erro geral na Edge Function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
