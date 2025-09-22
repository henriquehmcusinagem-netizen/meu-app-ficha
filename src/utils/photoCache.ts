// Persistent photo cache using sessionStorage
interface CachedPhoto {
  url: string;
  expires: number;
  timestamp: number;
}

const CACHE_KEY = 'ficha_photos_cache';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const MAX_CACHE_SIZE = 100; // Max cached photos

class PhotoCacheManager {
  private memoryCache = new Map<string, CachedPhoto>();
  private initialized = false;

  private init() {
    if (this.initialized) return;

    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Load valid entries from storage
        Object.entries(parsed).forEach(([path, cached]) => {
          const photo = cached as CachedPhoto;
          if (Date.now() < photo.expires) {
            this.memoryCache.set(path, photo);
          }
        });
        console.log(`📸 Cache inicializado com ${this.memoryCache.size} fotos em memória`);
      }
    } catch (error) {
      console.warn('Erro ao carregar cache de fotos:', error);
      sessionStorage.removeItem(CACHE_KEY);
    }

    this.initialized = true;
  }

  get(storagePath: string): string | null {
    this.init();

    const cached = this.memoryCache.get(storagePath);
    if (cached && Date.now() < cached.expires) {
      return cached.url;
    }

    // Remove expired entry
    if (cached) {
      this.memoryCache.delete(storagePath);
      this.persist();
    }

    return null;
  }

  set(storagePath: string, url: string): void {
    this.init();

    const cached: CachedPhoto = {
      url,
      expires: Date.now() + CACHE_DURATION,
      timestamp: Date.now()
    };

    this.memoryCache.set(storagePath, cached);

    // Cleanup old entries if cache is too large
    if (this.memoryCache.size > MAX_CACHE_SIZE) {
      this.cleanup();
    }

    this.persist();
  }

  private cleanup(): void {
    // Remove oldest entries
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE + 10);
    toRemove.forEach(([path]) => {
      this.memoryCache.delete(path);
    });

    console.log(`🧹 Cache cleanup: removeu ${toRemove.length} fotos antigas`);
  }

  private persist(): void {
    try {
      const toStore: Record<string, CachedPhoto> = {};
      this.memoryCache.forEach((cached, path) => {
        toStore[path] = cached;
      });

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.warn('Erro ao persistir cache de fotos:', error);
      // If storage is full, clear it
      try {
        sessionStorage.removeItem(CACHE_KEY);
        this.memoryCache.clear();
      } catch (e) {
        console.error('Erro crítico no cache:', e);
      }
    }
  }

  clear(): void {
    this.memoryCache.clear();
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
    console.log('🗑️ Cache de fotos limpo');
  }

  has(storagePath: string): boolean {
    return this.get(storagePath) !== null;
  }

  size(): number {
    this.init();
    return this.memoryCache.size;
  }

  getStats(): { size: number; memoryUsage: string } {
    this.init();
    const size = this.memoryCache.size;

    let memoryUsage = '0KB';
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        const bytes = new Blob([stored]).size;
        memoryUsage = bytes < 1024
          ? `${bytes}B`
          : bytes < 1024 * 1024
            ? `${Math.round(bytes / 1024)}KB`
            : `${Math.round(bytes / (1024 * 1024))}MB`;
      }
    } catch (error) {
      // Ignore
    }

    return { size, memoryUsage };
  }
}

export const photoCache = new PhotoCacheManager();