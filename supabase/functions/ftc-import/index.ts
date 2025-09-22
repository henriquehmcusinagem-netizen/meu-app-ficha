import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function deDupeWords(s: string) {
  return s.replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
}

function norm(t: string) {
  return deDupeWords(
    t
      .toLowerCase()
      .replace(/ftc início/gi, "")
      .replace(/ftc fim/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

// mapeamento básico de processos (adicione outros conforme suas colunas)
const PROC_REGEX: Record<string, RegExp> = {
  torno_grande: /torno grande\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  torno_pequeno: /torno pequeno\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  cnc_tf: /\bcnc(?:\s*tf)?\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  fresa_furad: /(fresa(?:mento)?|fura(?:d|ção)?)\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  plasma_oxicorte: /(plasma|oxicorte|corte plasma)\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  dobra: /dobra(?:mento)?\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  calandra: /calandra(?:gem)?\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  macarico_solda: /(solda(?:gem)?|maçarico)\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  des_montg: /(desmontagem|montagem)\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  balanceamento: /balanceamento\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  mandrilhamento: /mandril(?:hamento)?\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  tratamento: /tratamento\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  pintura_horas: /pintura\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  lavagem_acab: /(lavagem|acabamento|limpeza)\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  programacao_cam: /(programa(?:ção)?\s*cam|cam)\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
  eng_tec: /(engenharia|técnico|projeto)\s+(\d+(?:[.,]\d+)?)\s*h|hora[s]?/i,
};

function parseNumber(v?: string) {
  if (!v) return undefined;
  return Number(v.replace(",", "."));
}

function parseTranscricao(raw: string) {
  const txt = norm(raw);
  const out: any = { observacoes: txt };

  // chave:valor simples com parada em palavras-chave
  const kv = (key: string, re: RegExp) => {
    const m = txt.match(re);
    if (m) out[key] = m[1].trim();
  };

  // Regex melhorados para parar em palavras-chave subsequentes
  kv("cliente", /cliente[: ]+([^:]+?)(?:\s+(?:solicitante|peça|peca|servi[cç]o|data|nome|ftc\s+fim)|$)/i);
  kv("solicitante", /solicitante[: ]+([^:]+?)(?:\s+(?:cliente|peça|peca|servi[cç]o|data|nome|ftc\s+fim)|$)/i);
  kv("nome_peca", /(peça|peca)[: ]+([^:]+?)(?:\s+(?:cliente|solicitante|servi[cç]o|data|nome|ftc\s+fim)|$)/i);
  kv("servico", /servi[cç]o[: ]+([^:]+?)(?:\s+(?:cliente|solicitante|peça|peca|data|nome|ftc\s+fim)|$)/i);

  // dimensões em texto livre (opcional)
  const dim = txt.match(/(dimens(ões|oes)|medidas?)[: ]+([a-z0-9\s\-_.ºøØxmm,]+)/i);
  if (dim) out["dimensoes"] = dim[3].trim();

  // booleanos SIM/NAO
  if (/pintura[: ]+(sim|não|nao)/i.test(txt))
    out.pintura = /sim/i.test(txt.match(/pintura[: ]+(sim|não|nao)/i)![1]) ? "SIM" : "NAO";
  if (/galvaniza[cç][aã]o[: ]+(sim|não|nao)/i.test(txt))
    out.galvanizacao = /sim/i.test(txt.match(/galvaniza[cç][aã]o[: ]+(sim|não|nao)/i)![1]) ? "SIM" : "NAO";
  if (/tratamento t[ée]rmico[: ]+(sim|não|nao)/i.test(txt))
    out.tratamento_termico = /sim/i.test(txt.match(/tratamento t[ée]rmico[: ]+(sim|não|nao)/i)![1]) ? "SIM" : "NAO";

  // processos com horas
  for (const [campo, re] of Object.entries(PROC_REGEX)) {
    const m = txt.match(re);
    if (m) {
      const val = parseNumber(m[1] || m[2]);
      if (typeof val === "number" && !Number.isNaN(val)) out[campo] = val;
    }
  }

  return out;
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
    console.log("Received request body:", JSON.stringify(body));
    
    const { ftc_id, transcricao, ...direct } = body || {};
    
    console.log("Extracted ftc_id:", ftc_id);
    console.log("Extracted transcricao:", transcricao?.substring(0, 100) + "...");
    console.log("Direct fields:", Object.keys(direct));
    
    if (!ftc_id || ftc_id.trim() === "") {
      console.log("FTC_ID missing or empty");
      return new Response(JSON.stringify({ ok: false, error: "FTC_ID_REQUIRED" }), { 
        status: 400,
        headers: { 
          ...corsHeaders,
          "content-type": "application/json" 
        }
      });
    }

    // se vier transcrição, extrai; se vier campos diretos, respeita
    const parsed = transcricao ? parseTranscricao(String(transcricao)) : {};
    const updatePayload = { ...parsed, ...direct };
    
    console.log("Update payload:", JSON.stringify(updatePayload));

    const { error } = await supabase
      .from("fichas_tecnicas")
      .update(updatePayload)
      .eq("numero_ftc", ftc_id);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 
        ...corsHeaders,
        "content-type": "application/json" 
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 400,
      headers: { 
        ...corsHeaders,
        "content-type": "application/json" 
      },
    });
  }
});