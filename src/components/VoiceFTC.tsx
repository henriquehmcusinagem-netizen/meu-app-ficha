import React, { useEffect, useRef, useState } from "react";

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
  appBaseUrl = window.location.origin,
}: Props) {
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
    if (!SR) return;

    const r = new SR();
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = true; // mostramos parcial em tempo real, sem duplicar

    let finalTranscript = "";
    let lastFinalChunk = "";

    r.onresult = (e: any) => {
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

    r.onend = () => setListening(false);

    recogRef.current = r;
    setSupported(true);
  }, []);

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
      const id = await ensureDraft();
      setText("");
      recogRef.current?.start();
      setListening(true);
      alert(
        `Gravando…\nDiga com marcadores: "ftc início … ftc fim".\nEx.: cliente: BTP; solicitante: Leonardo; peça: eixo teste; processo: torno grande 3 horas; pintura: não.`
      );
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }

  function stop() {
    recogRef.current?.stop();
    setListening(false);
  }

  async function enviar() {
    if (!currentFtc) return alert("Crie o rascunho primeiro.");
    if (!text.trim()) return alert("Sem texto capturado.");
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

      window.location.href = `${appBaseUrl}/nova-ficha/${currentFtc}`;
    } catch (e: any) {
      alert("Erro ao enviar: " + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {!supported && (
        <div className="text-sm text-red-600">
          Seu navegador não suporta captura por voz. Use Safari no iPhone.
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={listening ? stop : start}
          className={`px-5 py-3 rounded-lg text-white font-semibold ${
            listening ? "bg-red-600" : "bg-indigo-600"
          }`}
          disabled={!supported || loading}
        >
          {listening ? "■ Parar" : "🎙️ Falar FTC"}
        </button>

        <button
          onClick={enviar}
          className="px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
          disabled={!text.trim() || loading}
          title="Envia a transcrição para preencher a FTC"
        >
          ✅ Enviar para a Ficha
        </button>
      </div>

      <textarea
        className="w-full min-h-[120px] p-3 rounded border"
        placeholder='Diga: "ftc início … cliente: … peça: … processo: torno grande 3 horas … ftc fim"'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {currentFtc && (
        <div className="text-xs text-gray-500">FTC rascunho: {currentFtc}</div>
      )}
    </div>
  );
}