import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BotaoVoz() {
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setIsCreatingDraft(true);
      
      // Create draft FTC
      const res = await fetch(
        "https://gobuakgvzqauzenaswow.supabase.co/functions/v1/ftc-rascunho",
        { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar rascunho");
      }
      
      const ftc_id = data.ftc_id;
      console.log("Created FTC draft:", ftc_id);

      // Prepare payload for iOS Shortcut
      const payload = encodeURIComponent(
        JSON.stringify({ 
          ftc_id, 
          user: "usuario",
          timestamp: new Date().toISOString()
        })
      );
      
      const openUrl = encodeURIComponent(
        `${window.location.origin}/nova-ficha/${data.uuid}`
      );

      // Launch iOS Shortcut
      const url = `shortcuts://x-callback-url/run-shortcut?name=FTC%20Gravar&input=text&text=${payload}&x-success=${openUrl}`;
      
      toast({
        title: "Rascunho criado!",
        description: `FTC ${ftc_id} criada. Abrindo gravador de voz...`,
      });

      // Redirect to iOS Shortcut
      window.location.href = url;
      
    } catch (error) {
      console.error("Error creating voice FTC:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o rascunho. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingDraft(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isCreatingDraft}
      className="w-full md:w-auto px-6 py-3 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {isCreatingDraft ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Criando rascunho...
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 mr-2" />
          🎙️ Gravar FTC por Voz
        </>
      )}
    </Button>
  );
}