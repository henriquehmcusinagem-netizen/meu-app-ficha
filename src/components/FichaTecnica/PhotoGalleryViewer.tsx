import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Download, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { Foto } from '@/types/ficha-tecnica';
import { downloadPhoto, printPhoto } from '@/utils/photoHelpers';
import { formatFileSize } from '@/utils/helpers';
import { useToast } from '@/hooks/use-toast';

interface PhotoGalleryViewerProps {
  photos: Array<Foto & { url: string }>;
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function PhotoGalleryViewer({
  photos,
  initialIndex = 0,
  open,
  onClose
}: PhotoGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  const currentPhoto = photos[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setZoom(1);
  }, [photos.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoom(1);
  }, [photos.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    if (!currentPhoto) return;

    try {
      await downloadPhoto(currentPhoto.url, currentPhoto.name);
      toast({
        title: "Download iniciado",
        description: `Baixando ${currentPhoto.name}...`,
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a foto.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!currentPhoto) return;

    printPhoto(currentPhoto.url, currentPhoto.name);
    toast({
      title: "Impressão iniciada",
      description: `Preparando ${currentPhoto.name} para impressão...`,
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, goToNext, goToPrevious]);

  if (!currentPhoto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-[95vh] flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex-1 text-white">
              <h3 className="font-semibold text-lg truncate">{currentPhoto.name}</h3>
              <p className="text-sm text-gray-300">
                {formatFileSize(currentPhoto.size)} • Foto {currentIndex + 1} de {photos.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Photo Area */}
          <div className="flex-1 flex items-center justify-center p-16 overflow-hidden">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                cursor: zoom > 1 ? 'move' : 'default'
              }}
            />
          </div>

          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="text-white hover:bg-white/20 h-8 px-2"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white text-sm px-2 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="text-white hover:bg-white/20 h-8 px-2"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <div className="w-px h-8 bg-white/20" />

              {/* Action Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoom(1);
                    }}
                    className={`
                      relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2
                      transition-all duration-200
                      ${index === currentIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-50 hover:opacity-100'
                      }
                    `}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Keyboard Hints */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
            ESC: Fechar | ← →: Navegar | +/-: Zoom
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
