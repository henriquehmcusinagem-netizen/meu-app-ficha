import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { photoCache } from '@/utils/photoCache';

// Loading state cache
const loadingCache = new Set<string>();

export function useLazyPhotos() {
  const [loadingPhotos, setLoadingPhotos] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const getCachedPhoto = useCallback((storagePath: string): string | null => {
    return photoCache.get(storagePath);
  }, []);

  const loadPhoto = useCallback(async (storagePath: string): Promise<string | null> => {
    // Check cache first
    const cachedUrl = getCachedPhoto(storagePath);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Check if already loading
    if (loadingCache.has(storagePath)) {
      // Wait for ongoing request
      return new Promise((resolve) => {
        const checkCache = () => {
          const url = getCachedPhoto(storagePath);
          if (url || !loadingCache.has(storagePath)) {
            resolve(url);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Mark as loading
    loadingCache.add(storagePath);
    setLoadingPhotos(prev => new Set(prev).add(storagePath));

    try {
      console.log(`📸 Carregando foto lazy: ${storagePath}`);

      const { data, error } = await supabase.storage
        .from('ficha-fotos')
        .createSignedUrl(storagePath, 14400); // 4 horas

      if (error) {
        console.error(`❌ Erro ao carregar foto ${storagePath}:`, error);
        return null;
      }

      const url = data?.signedUrl;
      if (url) {
        // Cache successful result
        photoCache.set(storagePath, url);
        console.log(`✅ Foto lazy carregada: ${storagePath}`);
        return url;
      }

      return null;
    } catch (error) {
      console.error(`💥 Exceção ao carregar foto ${storagePath}:`, error);
      return null;
    } finally {
      loadingCache.delete(storagePath);
      setLoadingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(storagePath);
        return newSet;
      });
    }
  }, [getCachedPhoto]);

  const createLazyLoader = useCallback((
    storagePath: string,
    onLoad: (url: string | null) => void
  ) => {
    return (element: HTMLElement | null) => {
      if (!element || !storagePath) return;

      // Check if already cached
      const cachedUrl = getCachedPhoto(storagePath);
      if (cachedUrl) {
        onLoad(cachedUrl);
        return;
      }

      // Create intersection observer if needed
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const path = entry.target.getAttribute('data-storage-path');
                if (path) {
                  observerRef.current?.unobserve(entry.target);
                  loadPhoto(path).then(onLoad);
                }
              }
            });
          },
          {
            rootMargin: '50px', // Start loading 50px before visible
            threshold: 0.1
          }
        );
      }

      // Add storage path as data attribute
      element.setAttribute('data-storage-path', storagePath);

      // Start observing
      observerRef.current.observe(element);
    };
  }, [getCachedPhoto, loadPhoto]);

  const preloadPhoto = useCallback(async (storagePath: string): Promise<string | null> => {
    return loadPhoto(storagePath);
  }, [loadPhoto]);

  const isPhotoLoading = useCallback((storagePath: string): boolean => {
    return loadingPhotos.has(storagePath);
  }, [loadingPhotos]);

  const clearCache = useCallback(() => {
    photoCache.clear();
    loadingCache.clear();
    setLoadingPhotos(new Set());
  }, []);

  return {
    createLazyLoader,
    preloadPhoto,
    getCachedPhoto,
    isPhotoLoading,
    clearCache
  };
}