import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
type Props = {
  /** se já existir um rascunho na tela, pode passar; senão, criaremos */
  ftcId?: string;
  /** base das Edge Functions do Supabase */
  supabaseFnBase?: string; // ex: "https://gobuakgvzqauzenaswow.supabase.co/functions/v1"
  /** base do app para abrir a ficha */
  appBaseUrl?: string; // ex: "https://ftcweb.hmcusinagem.online"
};
export default function VoiceFTC({
  ftcId,
  supabaseFnBase = "https://gobuakgvzqauzenaswow.supabase.co/functions/v1",
  appBaseUrl = window.location.origin
}: Props) {
  const {
    toast
  } = useToast();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [currentFtc, setCurrentFtc] = useState<string | undefined>(ftcId);
  const [loading, setLoading] = useState(false);
  const recogRef = useRef<any>(null);

  /** util p/ tirar repetições imediatas ("nome nome" -> "nome") */
  function deDupeWords(s: string) {
    return s.replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
  }
  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      console.log("Speech recognition not supported");
      return;
    }
    const r = new SR();
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = true; // mostramos parcial em tempo real, sem duplicar

    let finalTranscript = "";
    let lastFinalChunk = "";
    r.onresult = (e: any) => {
      console.log("Speech recognition result:", e);
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          const clean = deDupeWords(chunk.trim());
          if (clean && clean !== lastFinalChunk) {
            finalTranscript += (finalTranscript ? " " : "") + clean;
            lastFinalChunk = clean;
          }
        } else {
          interim += chunk;
        }
      }

      // Recalcula a cada evento (NÃO concatenar com prev!)
      const display = (finalTranscript + " " + deDupeWords(interim)).trim();
      setText(display);
    };
    r.onstart = () => {
      console.log("Speech recognition started");
    };
    r.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      toast({
        title: "Erro no reconhecimento de voz",
        description: `Erro: ${e.error}. Verifique as permissões do microfone.`,
        variant: "destructive"
      });
      setListening(false);
    };
    r.onend = () => {
      console.log("Speech recognition ended");
      setListening(false);
    };
    recogRef.current = r;
    setSupported(true);
  }, [toast]);
  async function ensureDraft(): Promise<string> {
    if (currentFtc) return currentFtc;
    console.log("Creating FTC draft...");
    toast({
      title: "Criando rascunho...",
      description: "Preparando nova ficha técnica"
    });
    try {
      const res = await fetch(`${supabaseFnBase}/ftc-rascunho`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("FTC draft response status:", res.status);
      const data = await res.json();
      console.log("FTC draft response data:", data);
      if (!res.ok || !data?.ftc_id) {
        throw new Error(data?.error || "Não consegui criar rascunho");
      }
      setCurrentFtc(data.ftc_id);
      toast({
        title: "Rascunho criado",
        description: `FTC ${data.ftc_id} criada com sucesso`
      });
      return data.ftc_id;
    } catch (error) {
      console.error("Error creating draft:", error);
      throw error;
    }
  }
  async function start() {
    try {
      // Check microphone permission first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          console.log("Microphone permission granted");
        } catch (permError) {
          console.error("Microphone permission denied:", permError);
          toast({
            title: "Permissão necessária",
            description: "Por favor, permita o acesso ao microfone para usar o reconhecimento de voz",
            variant: "destructive"
          });
          return;
        }
      }
      const id = await ensureDraft();
      setText("");
      console.log("Starting speech recognition...");
      recogRef.current?.start();
      setListening(true);
      toast({
        title: "Gravando...",
        description: 'Diga: "ftc início ... cliente: ... peça: ... ftc fim"'
      });
    } catch (e: any) {
      console.error("Error starting voice capture:", e);
      toast({
        title: "Erro ao iniciar gravação",
        description: e.message || String(e),
        variant: "destructive"
      });
    }
  }
  function stop() {
    console.log("Stopping speech recognition...");
    recogRef.current?.stop();
    setListening(false);
    toast({
      title: "Gravação finalizada",
      description: "Você pode editar o texto ou enviar para a ficha"
    });
  }
  async function enviar() {
    if (!currentFtc) {
      toast({
        title: "Erro",
        description: "Crie o rascunho primeiro.",
        variant: "destructive"
      });
      return;
    }
    if (!text.trim()) {
      toast({
        title: "Erro",
        description: "Sem texto capturado.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      console.log("Sending transcription to import...", {
        ftc_id: currentFtc,
        text: text.slice(0, 100) + "..."
      });
      const payload = {
        ftc_id: currentFtc,
        transcricao: text
      };
      const r = await fetch(`${supabaseFnBase}/ftc-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("Import response status:", r.status);
      const j = await r.json();
      console.log("Import response data:", j);
      if (!r.ok || j?.ok === false) {
        throw new Error(j?.error || "Falha no import");
      }
      toast({
        title: "Sucesso!",
        description: "Transcrição enviada. Redirecionando para a ficha..."
      });

      // Redirect to the FTC form with the ID
      setTimeout(() => {
        window.location.href = `${appBaseUrl}/nova-ficha/${currentFtc}`;
      }, 1000);
    } catch (e: any) {
      console.error("Error sending transcription:", e);
      toast({
        title: "Erro ao enviar",
        description: e.message || String(e),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }
  if (!supported) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Reconhecimento de voz não suportado neste navegador
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant={listening ? "destructive" : "default"}
          onClick={listening ? stop : start}
          disabled={loading}
          className="flex-1"
        >
          {listening ? "Parar Gravação" : "Iniciar Gravação por Voz"}
        </Button>
        
        <Button
          variant="outline"
          onClick={enviar}
          disabled={!text.trim() || loading || !currentFtc}
          className="flex-1"
        >
          {loading ? "Enviando..." : "Enviar para Ficha"}
        </Button>
      </div>

      {text && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Sua transcrição aparecerá aqui..."
          rows={6}
          className="resize-none"
        />
      )}

      {listening && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">
          🎤 Ouvindo... Diga: "ftc início ... cliente: ... peça: ... ftc fim"
        </div>
      )}
    </div>
  );
}