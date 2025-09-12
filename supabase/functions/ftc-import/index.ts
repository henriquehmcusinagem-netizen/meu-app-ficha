import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para extrair dados da transcrição
function parseTranscricao(transcricao: string) {
  const text = transcricao.toLowerCase();
  const dados: any = {};

  // Cliente
  const clienteMatch = text.match(/cliente:?\s*([^.;]+)/);
  if (clienteMatch) dados.cliente = clienteMatch[1].trim();

  // Peça
  const pecaMatch = text.match(/pe[cç]a:?\s*([^.;]+)/);
  if (pecaMatch) dados.nome_peca = pecaMatch[1].trim();

  // Quantidade
  const qtdMatch = text.match(/quantidade:?\s*(\d+)/);
  if (qtdMatch) dados.quantidade = qtdMatch[1];

  // Serviço
  const servicoMatch = text.match(/servi[cç]o:?\s*([^.;]+)/);
  if (servicoMatch) dados.servico = servicoMatch[1].trim();

  // Processos (mapear horas)
  const processosMap: any = {};
  
  // Torno grande
  const tornoGrandeMatch = text.match(/torno\s+grande:?\s*(\d+(?:\.\d+)?)\s*horas?/);
  if (tornoGrandeMatch) processosMap.torno_grande = parseFloat(tornoGrandeMatch[1]);

  // Torno pequeno
  const tornoPequenoMatch = text.match(/torno\s+pequeno:?\s*(\d+(?:\.\d+)?)\s*horas?/);
  if (tornoPequenoMatch) processosMap.torno_pequeno = parseFloat(tornoPequenoMatch[1]);

  // CNC
  const cncMatch = text.match(/cnc:?\s*(\d+(?:\.\d+)?)\s*horas?/);
  if (cncMatch) processosMap.cnc_tf = parseFloat(cncMatch[1]);

  // Fresa
  const fresaMatch = text.match(/fresa:?\s*(\d+(?:\.\d+)?)\s*horas?/);
  if (fresaMatch) processosMap.fresa_furad = parseFloat(fresaMatch[1]);

  // Solda
  const soldaMatch = text.match(/(?:solda|macarico):?\s*(\d+(?:\.\d+)?)\s*horas?/);
  if (soldaMatch) processosMap.macarico_solda = parseFloat(soldaMatch[1]);

  // Pintura
  if (text.includes('pintura sim') || text.includes('pintura: sim')) {
    dados.pintura = 'SIM';
  } else if (text.includes('pintura nao') || text.includes('pintura não') || text.includes('pintura: nao')) {
    dados.pintura = 'NAO';
  }

  // Galvanização
  if (text.includes('galvaniza') && (text.includes(' sim') || text.includes(': sim'))) {
    dados.galvanizacao = 'SIM';
  } else if (text.includes('galvaniza') && (text.includes(' nao') || text.includes(' não') || text.includes(': nao'))) {
    dados.galvanizacao = 'NAO';
  }

  // Tratamento térmico
  if (text.includes('tratamento') && text.includes('termico') && (text.includes(' sim') || text.includes(': sim'))) {
    dados.tratamento_termico = 'SIM';
  } else if (text.includes('tratamento') && text.includes('termico') && (text.includes(' nao') || text.includes(' não') || text.includes(': nao'))) {
    dados.tratamento_termico = 'NAO';
  }

  // Observações
  const obsMatch = text.match(/observa[cç][oõ]es?:?\s*([^.;]+)/);
  if (obsMatch) dados.observacoes = obsMatch[1].trim();

  // Aplicar processos encontrados
  Object.assign(dados, processosMap);

  return dados;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Received ftc-import payload:", body);

    const { ftc_id, transcricao, materiais, processos, ...campos } = body;

    if (!ftc_id) {
      console.error("FTC_ID is required");
      return new Response(
        JSON.stringify({ ok: false, error: "FTC_ID_REQUIRED" }), 
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            "content-type": "application/json" 
          } 
        }
      );
    }

    // Parse transcription if provided
    let dadosExtraidos = {};
    if (transcricao) {
      dadosExtraidos = parseTranscricao(transcricao);
      console.log('Extracted data from transcription:', dadosExtraidos);
    }

    // Prepare the update data - merge extracted + direct data
    const updateData = { ...dadosExtraidos, ...campos };
    
    // Map processos to individual columns
    if (processos) {
      Object.keys(processos).forEach(key => {
        updateData[key] = processos[key];
      });
    }

    console.log("Updating FTC with data:", updateData);

    // Update FTC record
    const { error: updateError } = await supabase
      .from("fichas_tecnicas")
      .update(updateData)
      .eq("numero_ftc", ftc_id);

    if (updateError) {
      console.error("Error updating FTC:", updateError);
      throw updateError;
    }

    // Handle materials if provided
    if (materiais && Array.isArray(materiais) && materiais.length > 0) {
      console.log("Processing materials:", materiais);

      // Get the FTC UUID for materials
      const { data: fichaData, error: fichaError } = await supabase
        .from("fichas_tecnicas")
        .select("id")
        .eq("numero_ftc", ftc_id)
        .single();

      if (fichaError) {
        console.error("Error getting FTC ID:", fichaError);
        throw fichaError;
      }

      // Delete existing materials
      const { error: deleteError } = await supabase
        .from("materiais")
        .delete()
        .eq("ficha_id", fichaData.id);

      if (deleteError) {
        console.error("Error deleting existing materials:", deleteError);
        // Don't throw here, just log
      }

      // Insert new materials
      const materiaisWithFichaId = materiais.map((material, index) => ({
        ...material,
        ficha_id: fichaData.id,
        ordem: index + 1
      }));

      const { error: materialsError } = await supabase
        .from("materiais")
        .insert(materiaisWithFichaId);

      if (materialsError) {
        console.error("Error inserting materials:", materialsError);
        throw materialsError;
      }

      console.log("Materials inserted successfully");
    }

    console.log("FTC import completed successfully");

    return new Response(
      JSON.stringify({ ok: true }),
      {
        headers: { 
          ...corsHeaders,
          "content-type": "application/json" 
        }
      }
    );

  } catch (error) {
    console.error("Error in ftc-import function:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error.message || "Internal server error" 
      }), 
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "content-type": "application/json" 
        } 
      }
    );
  }
});