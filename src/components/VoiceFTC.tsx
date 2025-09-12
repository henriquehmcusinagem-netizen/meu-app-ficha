import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  /** se não vier, criamos um rascunho antes de gravar */
  ftcId?: string;
  /** URL base das edge functions (sem a função no final) */
  supabaseFnBase?: string;
  /** URL base do app p/ abrir a ficha depois */
  appBaseUrl?: string;
};

export default function VoiceFTC({
  ftcId,
  supabaseFnBase = "https://gobuakgvzqauzenaswow.supabase.co/functions/v1",
  appBaseUrl = window.location.origin,
}: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const recogRef = useRef<any>(null);
  const [currentFtc, setCurrentFtc] = useState<string | undefined>(ftcId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Detecta suporte
  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const r = new SR();
      r.lang = "pt-BR";
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (ev: any) => {
        let t = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          t += ev.results[i][0].transcript;
        }
        setText((prev) => (prev ? prev + " " : "") + t.trim());
      };
      r.onend = () => setListening(false);
      r.onerror = (error: any) => {
        console.error('Speech recognition error:', error);
        setListening(false);
        toast({
          title: "Erro no reconhecimento",
          description: "Erro na captura de voz. Tente novamente.",
          variant: "destructive",
        });
      };
      recogRef.current = r;
    } else {
      setSupported(false);
    }
  }, [toast]);

  async function ensureDraft(): Promise<string> {
    if (currentFtc) return currentFtc;
    const res = await fetch(`${supabaseFnBase}/ftc-rascunho`, { method: "POST" });
    const data = await res.json();
    if (!data?.ftc_id) throw new Error("Não consegui criar rascunho");
    setCurrentFtc(data.ftc_id);
    return data.ftc_id;
  }

  async function start() {
    try {
      setText("");
      const id = await ensureDraft();
      recogRef.current?.start();
      setListening(true);
      toast({
        title: "Gravando...",
        description: 'Diga: "ftc início ... ftc fim"',
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e.message || String(e),
        variant: "destructive",
      });
    }
  }

  function stop() {
    recogRef.current?.stop();
    setListening(false);
  }

  async function enviar() {
    if (!currentFtc) {
      toast({
        title: "Erro",
        description: "Crie o rascunho primeiro.",
        variant: "destructive",
      });
      return;
    }
    if (!text.trim()) {
      toast({
        title: "Erro",
        description: "Sem texto capturado.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ftc_id: currentFtc,
        transcricao: text,
        device_time: new Date().toISOString(),
      };
      const r = await fetch(`${supabaseFnBase}/ftc-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "Falha no import");

      toast({
        title: "Sucesso!",
        description: "FTC preenchida com os dados da voz.",
      });

      // Abre a ficha preenchida
      window.location.href = `${appBaseUrl}/nova-ficha/${currentFtc}`;
    } catch (e: any) {
      toast({
        title: "Erro ao enviar",
        description: e.message || String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      {!supported && (
        <div className="text-sm text-destructive">
          Seu navegador não suporta captura por voz. Abra no Safari do iPhone.
        </div>
      )}

      <div className="flex gap-4 items-center flex-wrap">
        <button
          onClick={listening ? stop : start}
          className={`px-5 py-3 rounded-lg text-white font-semibold transition-colors ${
            listening ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          }`}
          disabled={!supported || loading}
        >
          {listening ? "■ Parar" : "🎙️ Falar FTC"}
        </button>

        <button
          onClick={enviar}
          className="px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 transition-colors"
          disabled={!text.trim() || loading}
          title="Envia a transcrição para preencher a FTC"
        >
          {loading ? "Enviando..." : "✅ Enviar para a Ficha"}
        </button>
      </div>

      <textarea
        className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder='Diga: "ftc início … cliente: … peça: … processo: torno grande 3 horas … ftc fim"'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {currentFtc && (
        <div className="text-xs text-muted-foreground">FTC rascunho: {currentFtc}</div>
      )}
    </div>
  );
}