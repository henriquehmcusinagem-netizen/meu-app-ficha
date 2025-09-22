import { useState, useEffect, forwardRef } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { photoCache } from '@/utils/photoCache';

interface SimplePhotoPreviewProps {
  storagePath?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const SimplePhotoPreview = forwardRef<HTMLDivElement, SimplePhotoPreviewProps>(
  ({ storagePath, alt, className = "", onClick }, ref) => {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      if (!storagePath) {
        setHasError(true);
        return;
      }

      // Check cache first
      const cachedUrl = photoCache.get(storagePath);
      if (cachedUrl) {
        setPhotoUrl(cachedUrl);
        return;
      }

      // Load photo directly (small previews should load immediately)
      loadPhotoDirectly();

      async function loadPhotoDirectly() {
        setIsLoading(true);
        try {
          console.log(`📸 Carregando preview direto: ${storagePath}`);

          const { data, error } = await supabase.storage
            .from('ficha-fotos')
            .createSignedUrl(storagePath!, 3600); // 1 hour for preview

          if (error) {
            console.error(`❌ Erro ao carregar preview ${storagePath}:`, error);
            setHasError(true);
            return;
          }

          const url = data?.signedUrl;
          if (url) {
            photoCache.set(storagePath!, url);
            setPhotoUrl(url);
            console.log(`✅ Preview carregado: ${storagePath}`);
          } else {
            setHasError(true);
          }
        } catch (error) {
          console.error(`💥 Exceção ao carregar preview ${storagePath}:`, error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      }
    }, [storagePath]);

    const handleClick = () => {
      if (onClick) {
        onClick();
      }
    };

    // Show loading state
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={`${className} bg-muted flex items-center justify-center cursor-pointer`}
          onClick={handleClick}
        >
          <div className="animate-pulse">
            <Camera className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      );
    }

    // Show error or no storage path
    if (hasError || !storagePath) {
      return (
        <div
          ref={ref}
          className={`${className} bg-muted flex items-center justify-center cursor-pointer`}
          onClick={handleClick}
        >
          <Camera className="h-3 w-3 text-muted-foreground opacity-50" />
        </div>
      );
    }

    // Show actual photo
    if (photoUrl) {
      return (
        <div
          ref={ref}
          className={`${className} overflow-hidden cursor-pointer`}
          onClick={handleClick}
        >
          <img
            src={photoUrl}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => {
              console.warn(`🖼️ Erro ao exibir preview: ${alt}`);
              setHasError(true);
              setPhotoUrl(null);
            }}
          />
        </div>
      );
    }

    // Fallback
    return (
      <div
        ref={ref}
        className={`${className} bg-muted flex items-center justify-center cursor-pointer`}
        onClick={handleClick}
      >
        <Camera className="h-3 w-3 text-muted-foreground" />
      </div>
    );
  }
);

SimplePhotoPreview.displayName = 'SimplePhotoPreview';