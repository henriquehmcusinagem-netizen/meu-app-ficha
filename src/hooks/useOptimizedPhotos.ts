import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PhotoCache {
  url: string;
  expires: number;
}

const urlCache = new Map<string, PhotoCache>();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export function useOptimizedPhotos() {
  const [isLoading, setIsLoading] = useState(false);

  const getCachedPhotoUrl = useCallback((storagePath: string): string | null => {
    const cached = urlCache.get(storagePath);
    if (cached && Date.now() < cached.expires) {
      return cached.url;
    }
    urlCache.delete(storagePath);
    return null;
  }, []);

  const preloadPhotos = useCallback(async (storagePaths: string[]): Promise<Map<string, string>> => {
    const urlMap = new Map<string, string>();

    // Separate cached and uncached paths
    const uncachedPaths = storagePaths.filter(path => !getCachedPhotoUrl(path));

    if (uncachedPaths.length === 0) {
      // All URLs are cached
      storagePaths.forEach(path => {
        const cachedUrl = getCachedPhotoUrl(path);
        if (cachedUrl) {
          urlMap.set(path, cachedUrl);
        }
      });
      return urlMap;
    }

    setIsLoading(true);

    try {
      // Batch load uncached URLs
      const urlPromises = uncachedPaths.map(async (path) => {
        try {
          const { data, error } = await supabase.storage
            .from('ficha-fotos')
            .createSignedUrl(path, 7200); // 2 hours

          if (error) {
            console.error(`Failed to load photo ${path}:`, error);
            return { path, url: null };
          }

          return { path, url: data?.signedUrl || null };
        } catch (err) {
          console.error(`Exception loading photo ${path}:`, err);
          return { path, url: null };
        }
      });

      const results = await Promise.all(urlPromises);

      // Cache successful results
      results.forEach(({ path, url }) => {
        if (url) {
          urlCache.set(path, {
            url,
            expires: Date.now() + CACHE_DURATION
          });
          urlMap.set(path, url);
        }
      });

      // Add already cached URLs
      storagePaths.forEach(path => {
        if (!urlMap.has(path)) {
          const cachedUrl = getCachedPhotoUrl(path);
          if (cachedUrl) {
            urlMap.set(path, cachedUrl);
          }
        }
      });

    } catch (error) {
      console.error('Batch photo loading failed:', error);
    } finally {
      setIsLoading(false);
    }

    return urlMap;
  }, [getCachedPhotoUrl]);

  const getOptimizedPhotoUrl = useCallback((storagePath: string): string | null => {
    return getCachedPhotoUrl(storagePath);
  }, [getCachedPhotoUrl]);

  const clearCache = useCallback(() => {
    urlCache.clear();
  }, []);

  return {
    preloadPhotos,
    getOptimizedPhotoUrl,
    clearCache,
    isLoading
  };
}