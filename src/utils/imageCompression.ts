/**
 * Utilitários para compressão e otimização de imagens
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Comprime e redimensiona uma imagem mantendo a qualidade
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<{ file: File; preview: string; originalSize: number; compressedSize: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Não foi possível obter contexto do canvas'));
      return;
    }

    img.onload = () => {
      // Calcular novas dimensões mantendo a proporção
      let { width, height } = calculateDimensions(
        img.naturalWidth, 
        img.naturalHeight, 
        opts.maxWidth!, 
        opts.maxHeight!
      );

      // Configurar canvas
      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada com alta qualidade
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob com compressão
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha na compressão da imagem'));
            return;
          }

          // Criar arquivo comprimido
          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, `.${opts.format}`), 
            { 
              type: `image/${opts.format}`,
              lastModified: Date.now()
            }
          );

          // Gerar preview
          const preview = canvas.toDataURL(`image/${opts.format}`, opts.quality);

          resolve({
            file: compressedFile,
            preview,
            originalSize: file.size,
            compressedSize: blob.size
          });
        },
        `image/${opts.format}`,
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar a imagem'));
    };

    // Carregar imagem
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calcula novas dimensões mantendo a proporção
 */
function calculateDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Se a imagem é menor que os limites, manter tamanho original
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calcular proporção
  const aspectRatio = width / height;

  if (width > height) {
    // Paisagem
    width = Math.min(width, maxWidth);
    height = width / aspectRatio;
  } else {
    // Retrato
    height = Math.min(height, maxHeight);
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatCompressionInfo(originalSize: number, compressedSize: number): string {
  const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  const originalMB = (originalSize / (1024 * 1024)).toFixed(1);
  const compressedMB = (compressedSize / (1024 * 1024)).toFixed(1);
  
  return `${originalMB}MB → ${compressedMB}MB (${reduction}% menor)`;
}