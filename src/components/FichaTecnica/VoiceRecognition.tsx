import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecognitionProps {
  fieldId: string;
  onResult?: (text: string) => void;
}

export function VoiceRecognition({ fieldId, onResult }: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = async () => {
    if (!isSupported) {
      toast({
        title: "Não suportado",
        description: "Reconhecimento de voz não é suportado neste navegador.",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Escutando...",
          description: "Fale agora para preencher o campo.",
        });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Update the field directly
        const field = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement;
        if (field) {
          field.value = transcript;
          field.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (onResult) {
          onResult(transcript);
        }

        toast({
          title: "Texto reconhecido",
          description: transcript,
        });
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Erro",
          description: "Erro no reconhecimento de voz. Tente novamente.",
          variant: "destructive",
        });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o reconhecimento de voz.",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={startListening}
      disabled={isListening}
      className="flex-shrink-0"
    >
      {isListening ? (
        <MicOff className="h-4 w-4 text-destructive" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}