import { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { useLazyPhotos } from '@/hooks/useLazyPhotos';

interface LazyPhotoProps {
  storagePath?: string;
  alt: string;
  className?: string;
  placeholder?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

export function LazyPhoto({
  storagePath,
  alt,
  className = "",
  placeholder = true,
  onClick
}: LazyPhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const { createLazyLoader, getCachedPhoto, preloadPhoto } = useLazyPhotos();

  useEffect(() => {
    if (!storagePath) {
      setHasError(true);
      return;
    }

    // Check cache first
    const cachedUrl = getCachedPhoto(storagePath);
    if (cachedUrl) {
      setPhotoUrl(cachedUrl);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // Setup lazy loader with intersection observer
    setIsLoading(true);
    const lazyLoader = createLazyLoader(storagePath, (url) => {
      setIsLoading(false);
      if (url) {
        setPhotoUrl(url);
        setHasError(false);
        console.log(`📸 LazyPhoto carregada: ${storagePath}`);
      } else {
        setHasError(true);
        console.warn(`❌ LazyPhoto erro: ${storagePath}`);
      }
    });

    if (imgRef.current) {
      lazyLoader(imgRef.current);
    }
  }, [storagePath, createLazyLoader, getCachedPhoto]);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  // Show loading state
  if (isLoading && !photoUrl) {
    return (
      <div
        ref={imgRef}
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
        ref={imgRef}
        className={`${className} bg-muted flex items-center justify-center cursor-pointer`}
        onClick={handleClick}
      >
        {placeholder && <Camera className="h-3 w-3 text-muted-foreground opacity-50" />}
      </div>
    );
  }

  // Show actual photo
  if (photoUrl) {
    return (
      <div
        ref={imgRef}
        className={`${className} overflow-hidden cursor-pointer`}
        onClick={handleClick}
      >
        <img
          src={photoUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => {
            console.warn(`🖼️ Erro ao exibir foto: ${alt}`);
            setHasError(true);
            setPhotoUrl(null);
          }}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback loading state
  return (
    <div
      ref={imgRef}
      className={`${className} bg-muted flex items-center justify-center cursor-pointer`}
      onClick={handleClick}
    >
      <Camera className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}