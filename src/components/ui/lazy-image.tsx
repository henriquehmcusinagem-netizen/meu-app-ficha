import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  containerClassName?: string;
  showLoader?: boolean;
  threshold?: number;
}

/**
 * Componente de imagem com lazy loading
 * Carrega a imagem apenas quando ela está visível na viewport
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback = '/placeholder-image.svg',
  className,
  containerClassName,
  showLoader = true,
  threshold = 0.1,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para detectar quando a imagem entra na viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: '50px' // Começar a carregar 50px antes de entrar na viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const currentSrc = hasError ? fallback : src;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-muted/50",
        containerClassName
      )}
    >
      {isInView && (
        <>
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              className
            )}
            {...props}
          />

          {/* Loader */}
          {showLoader && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {/* Placeholder quando não está na viewport */}
      {!isInView && (
        <div className="absolute inset-0 bg-muted/30 flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Carregando...</div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook para lazy loading de imagens em lotes
 * Útil para galerias de fotos
 */
interface UseImageBatchLoadingProps {
  images: string[];
  batchSize?: number;
  delay?: number;
}

export function useImageBatchLoading({
  images,
  batchSize = 5,
  delay = 100
}: UseImageBatchLoadingProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [currentBatch, setCurrentBatch] = useState(0);

  const totalBatches = Math.ceil(images.length / batchSize);

  const loadNextBatch = React.useCallback(() => {
    if (currentBatch < totalBatches - 1) {
      setCurrentBatch(prev => prev + 1);
    }
  }, [currentBatch, totalBatches]);

  const preloadImage = React.useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, src]));
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Carregar imagens do batch atual
  useEffect(() => {
    const startIndex = currentBatch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, images.length);
    const batchImages = images.slice(startIndex, endIndex);

    // Carregar imagens com delay entre elas
    batchImages.forEach((src, index) => {
      setTimeout(() => {
        preloadImage(src).catch(console.error);
      }, index * delay);
    });
  }, [currentBatch, images, batchSize, delay, preloadImage]);

  const isImageLoaded = React.useCallback((src: string) => {
    return loadedImages.has(src);
  }, [loadedImages]);

  const shouldShowImage = React.useCallback((src: string, index: number) => {
    const batchIndex = Math.floor(index / batchSize);
    return batchIndex <= currentBatch;
  }, [currentBatch, batchSize]);

  return {
    isImageLoaded,
    shouldShowImage,
    loadNextBatch,
    hasMoreBatches: currentBatch < totalBatches - 1,
    loadedCount: loadedImages.size,
    totalCount: images.length
  };
}

export default LazyImage;