import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InputWithVoiceProps extends React.ComponentProps<"input"> {
  onVoiceResult?: (text: string) => void;
}

const InputWithVoice = React.forwardRef<HTMLInputElement, InputWithVoiceProps>(
  ({ className, type, onVoiceResult, ...props }, ref) => {
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
          
          if (onVoiceResult) {
            onVoiceResult(transcript);
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

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          {...props}
        />
        {isSupported && (
          <button
            type="button"
            onClick={startListening}
            disabled={isListening}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-sm hover:bg-muted transition-colors"
            aria-label="Reconhecimento de voz"
          >
            {isListening ? (
              <MicOff className="h-4 w-4 text-destructive animate-pulse" />
            ) : (
              <Mic className="h-4 w-4 text-muted-foreground hover:text-primary" />
            )}
          </button>
        )}
      </div>
    );
  },
);

InputWithVoice.displayName = "InputWithVoice";

export { InputWithVoice };

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}