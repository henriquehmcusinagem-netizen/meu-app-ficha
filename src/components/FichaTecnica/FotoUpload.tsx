import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Foto } from "@/types/ficha-tecnica";
import { formatFileSize } from "@/utils/helpers";

interface FotoUploadProps {
  fotos: Foto[];
  onAddFoto: (foto: Foto) => void;
  onRemoveFoto: (id: number) => void;
}

export function FotoUpload({ fotos, onAddFoto, onRemoveFoto }: FotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Check total photos limit
    if (fotos.length + files.length > 10) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 10 fotos permitidas.",
        variant: "destructive",
      });
      return;
    }

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é uma imagem válida.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} é maior que 5MB.`,
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const foto: Foto = {
          id: Date.now() + Math.random(),
          file,
          preview: e.target?.result as string,
          name: file.name,
          size: file.size,
        };
        onAddFoto(foto);
      };
      reader.readAsDataURL(file);
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          FOTOS ({fotos.length}/10)
        </CardTitle>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          disabled={fotos.length >= 10}
        >
          <Upload className="h-4 w-4 mr-2" />
          Adicionar Fotos
        </Button>
      </CardHeader>
      <CardContent>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {fotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma foto adicionada</p>
            <p className="text-sm">Clique em "Adicionar Fotos" para incluir imagens</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={foto.preview}
                    alt={foto.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveFoto(foto.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p className="truncate" title={foto.name}>{foto.name}</p>
                  <p>{formatFileSize(foto.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}