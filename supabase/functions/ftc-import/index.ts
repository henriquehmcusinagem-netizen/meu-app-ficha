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

    const body = await req.json();
    console.log("Received ftc-import payload:", body);

    const { ftc_id, materiais, processos, ...campos } = body;

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

    // Prepare the update data - map processo fields
    const updateData = { ...campos };
    
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