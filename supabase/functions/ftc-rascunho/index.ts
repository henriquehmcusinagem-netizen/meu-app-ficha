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

    // Try up to 3 times to create a unique FTC number
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // Use Supabase function to get next FTC number
        const { data: nextNumber, error: numberError } = await supabase
          .rpc('get_next_ftc_number');

        if (numberError) {
          console.error("Error getting next FTC number:", numberError);
          throw numberError;
        }

        console.log(`Generated FTC number (attempt ${attempts + 1}):`, nextNumber);

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
          // If it's a duplicate key error, try again with a new number
          if (error.code === '23505' && error.message.includes('numero_ftc')) {
            console.log(`Duplicate FTC number ${nextNumber}, retrying...`);
            attempts++;
            continue;
          }
          
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

      } catch (innerError) {
        if (innerError.code === '23505' && attempts < maxAttempts - 1) {
          attempts++;
          continue;
        }
        throw innerError;
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Failed to create unique FTC number after ${maxAttempts} attempts`)

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