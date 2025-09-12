import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log("Creating new FTC draft...");

    // Use Supabase function to get next FTC number
    const { data: nextNumber, error: numberError } = await supabase
      .rpc('get_next_ftc_number');

    if (numberError) {
      console.error("Error getting next FTC number:", numberError);
      throw numberError;
    }

    console.log("Generated FTC number:", nextNumber);

    // Create new FTC record
    const { data, error } = await supabase
      .from("fichas_tecnicas")
      .insert([{ 
        numero_ftc: nextNumber, 
        status: "rascunho",
        cliente: "",
        solicitante: "",
        nome_peca: "",
        quantidade: "",
        servico: ""
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating FTC:", error);
      throw error;
    }

    console.log("FTC created successfully:", data);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        ftc_id: data.numero_ftc, 
        id: data.id,
        uuid: data.id
      }),
      { 
        headers: { 
          ...corsHeaders,
          "content-type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error("Error in ftc-rascunho function:", error);
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