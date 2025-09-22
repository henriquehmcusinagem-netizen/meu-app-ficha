import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Camera, X, Upload, ZoomIn, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Foto } from "@/types/ficha-tecnica";
import { formatFileSize } from "@/utils/helpers";
import { compressImage, formatCompressionInfo } from "@/utils/imageCompression";
import { SimplePhotoPreview } from "@/components/SimplePhotoPreview";
import { supabase } from '@/integrations/supabase/client';

interface FotoUploadProps {
  fotos: Foto[];
  onAddFoto: (foto: Foto) => void;
  onRemoveFoto: (id: number) => void;
}

export function FotoUpload({ fotos, onAddFoto, onRemoveFoto }: FotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);
  const [selectedFotoUrl, setSelectedFotoUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleOpenFotoModal = async (foto: Foto) => {
    setSelectedFoto(foto);
    setIsDialogOpen(true);

    // Load photo URL if it's a saved photo
    if (foto.storagePath && !foto.preview) {
      try {
        const { data, error } = await supabase.storage
          .from('ficha-fotos')
          .createSignedUrl(foto.storagePath, 3600);

        if (error) {
          console.error('❌ Erro ao carregar foto para modal:', error);
          return;
        }

        if (data?.signedUrl) {
          setSelectedFotoUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('💥 Exceção ao carregar foto para modal:', error);
      }
    } else if (foto.preview) {
      setSelectedFotoUrl(foto.preview);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 FotoUpload - handleFileUpload iniciado');
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      console.log('📸 FotoUpload - Nenhum arquivo selecionado');
      return;
    }

    // Check total photos limit
    if (fotos.length + files.length > 10) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 10 fotos permitidas.",
        variant: "destructive",
      });
      return;
    }

    setIsCompressing(true);
    let processedCount = 0;

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Arquivo inválido",
            description: `${file.name} não é uma imagem válida.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 50MB antes da compressão)
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} é maior que 50MB.`,
            variant: "destructive",
          });
          continue;
        }

        try {
          console.log(`📸 Comprimindo ${file.name}...`);
          
          // Comprimir imagem
          const result = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            format: 'jpeg'
          });

          console.log(`📸 ${file.name} comprimida: ${formatCompressionInfo(result.originalSize, result.compressedSize)}`);

          // Criar objeto Foto
          const foto: Foto = {
            id: Date.now() + Math.random() * 10000,
            file: result.file,
            preview: result.preview,
            name: result.file.name,
            size: result.file.size,
          };

          onAddFoto(foto);
          processedCount++;

          // Toast de sucesso para cada foto
          toast({
            title: "Foto otimizada!",
            description: `${file.name} foi comprimida e adicionada com sucesso.`,
          });

        } catch (compressionError) {
          console.error(`Erro ao comprimir ${file.name}:`, compressionError);
          toast({
            title: "Erro na compressão",
            description: `Falha ao otimizar ${file.name}. Tente novamente.`,
            variant: "destructive",
          });
        }
      }

      if (processedCount > 0) {
        toast({
          title: "Fotos processadas!",
          description: `${processedCount} foto(s) foram otimizadas e adicionadas.`,
        });
      }

    } finally {
      setIsCompressing(false);
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📸 FotoUpload - Botão Adicionar Fotos clicado');
            fileInputRef.current?.click();
          }}
          variant="outline"
          size="sm"
          disabled={fotos.length >= 10 || isCompressing}
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Otimizando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Fotos
            </>
          )}
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
            <p className="text-xs mt-2 opacity-75">
              📸 As fotos são automaticamente otimizadas para carregamento rápido
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer">
                  {foto.preview || foto.storagePath ? (
                    <>
                      {foto.preview && !foto.storagePath ? (
                        // Nova foto com preview
                        <img
                          src={foto.preview}
                          alt={foto.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleOpenFotoModal(foto)}
                        />
                      ) : (
                        // Foto salva com storagePath
                        <SimplePhotoPreview
                          storagePath={foto.storagePath}
                          alt={foto.name}
                          className="w-full h-full"
                          onClick={() => handleOpenFotoModal(foto)}
                        />
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('📸 FotoUpload - Botão zoom clicado:', foto.name);
                          handleOpenFotoModal(foto);
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center bg-secondary cursor-pointer"
                      onClick={() => handleOpenFotoModal(foto)}
                    >
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Foto Salva</p>
                        <p className="text-xs text-muted-foreground font-medium">{foto.name}</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📸 FotoUpload - Botão remover foto clicado:', foto.name);
                    onRemoveFoto(foto.id);
                  }}
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
        
        {/* Dialog controlado por estado */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedFoto(null);
              setSelectedFotoUrl(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            {selectedFoto && (
              <div className="flex flex-col items-center">
                {selectedFotoUrl ? (
                  <img
                    src={selectedFotoUrl}
                    alt={selectedFoto.name}
                    className="max-w-full max-h-[80vh] object-contain"
                    onError={() => {
                      console.error('❌ Erro ao exibir foto no modal:', selectedFoto.name);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[50vh]">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">Carregando foto...</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 text-center">
                  <p className="font-medium">{selectedFoto.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFoto.size)}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}