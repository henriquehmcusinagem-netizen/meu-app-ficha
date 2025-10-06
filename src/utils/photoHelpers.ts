import { supabase } from '@/integrations/supabase/client';
import { Foto } from '@/types/ficha-tecnica';

/**
 * Escape HTML special characters to prevent XSS
 * @param str - String to escape
 * @returns Escaped string safe for HTML attributes
 */
function escapeHtml(str: string): string {
  const htmlEscapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '\n': '&#10;',
    '\r': '&#13;'
  };
  return str.replace(/[&<>"'\n\r]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Escape JavaScript string literals (for use inside JS strings)
 * @param str - String to escape
 * @returns Escaped string safe for JavaScript strings
 */
function escapeJs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Generate signed URL for a photo stored in Supabase
 * @param storagePath - Path to the file in Supabase storage
 * @param expiresIn - URL expiration time in seconds (default: 24 hours)
 * @returns Signed URL or null if error
 */
export async function getPhotoSignedUrl(
  storagePath: string,
  expiresIn: number = 86400 // 24 hours (increased from 1 hour for better UX)
): Promise<string | null> {
  try {
    console.log('🔗 Gerando signed URL para:', storagePath);

    const { data, error } = await supabase.storage
      .from('ficha-fotos')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error('❌ Erro ao gerar signed URL:', error);
      return null;
    }

    if (!data?.signedUrl) {
      console.warn('⚠️ Signed URL vazia retornada para:', storagePath);
      return null;
    }

    console.log('✅ Signed URL gerada com sucesso:', {
      path: storagePath,
      urlLength: data.signedUrl.length,
      expiresIn: `${expiresIn}s (${expiresIn / 3600}h)`
    });

    return data.signedUrl;
  } catch (error) {
    console.error('💥 Exceção ao gerar signed URL:', error);
    return null;
  }
}

/**
 * Get all photos with signed URLs for a ficha
 * @param fotos - Array of Foto objects
 * @returns Array of photos with resolved URLs
 */
export async function getPhotosWithUrls(fotos: Foto[]): Promise<Array<Foto & { url: string }>> {
  console.log('📸 Processando fotos:', {
    total: fotos.length,
    fotos: fotos.map(f => ({ name: f.name, hasPreview: !!f.preview, hasStoragePath: !!f.storagePath }))
  });

  const photosWithUrls: Array<Foto & { url: string }> = [];

  for (const foto of fotos) {
    let url: string | null = null;

    // Priority: preview (new photos) > storagePath (saved photos)
    if (foto.preview) {
      console.log(`📷 Usando preview para: ${foto.name}`);
      url = foto.preview;
    } else if (foto.storagePath) {
      console.log(`🗄️ Gerando signed URL para: ${foto.name} (path: ${foto.storagePath})`);
      url = await getPhotoSignedUrl(foto.storagePath);
    }

    if (url) {
      console.log(`✅ URL obtida para: ${foto.name} (${url.substring(0, 50)}...)`);
      photosWithUrls.push({ ...foto, url });
    } else {
      console.warn(`⚠️ Foto sem URL disponível: ${foto.name}`, {
        hasPreview: !!foto.preview,
        hasStoragePath: !!foto.storagePath,
        storagePath: foto.storagePath
      });
    }
  }

  console.log('📊 Resultado final:', {
    totalProcessadas: fotos.length,
    comURL: photosWithUrls.length,
    semURL: fotos.length - photosWithUrls.length
  });

  return photosWithUrls;
}

/**
 * Download photo from URL
 * @param url - Photo URL
 * @param filename - Desired filename for download
 */
export async function downloadPhoto(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('❌ Erro ao baixar foto:', error);
    throw error;
  }
}

/**
 * Print a single photo
 * @param url - Photo URL
 * @param photoName - Photo name for the title
 */
export function printPhoto(url: string, photoName: string): void {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    console.error('❌ Não foi possível abrir janela de impressão');
    return;
  }

  // Escape special characters to prevent JavaScript injection
  const escapedName = escapeHtml(photoName);
  const escapedUrl = escapeHtml(url);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Imprimir Foto - ${escapedName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #ffffff;
          padding: 20px;
        }

        .photo-container {
          max-width: 100%;
          text-align: center;
        }

        img {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .photo-info {
          margin-top: 20px;
          font-family: 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
          color: #333;
        }

        .photo-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        @media print {
          body {
            padding: 0;
          }

          .photo-info {
            display: none;
          }

          img {
            max-height: 100vh;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="photo-container">
        <img src="${escapedUrl}" alt="${escapedName}" onload="window.print();">
        <div class="photo-info">
          <div class="photo-name">${escapedName}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Generate HTML for photo gallery section
 * @param fotos - Array of photos with URLs
 * @returns HTML string for photo gallery
 */
export function generatePhotoGalleryHTML(fotos: Array<Foto & { url: string }>): string {
  if (!fotos || fotos.length === 0) {
    return '';
  }

  const photoItems = fotos.map((foto, index) => `
    <div class="photo-item" onclick="openPhotoModal(${index})">
      <img src="${foto.url}" alt="${escapeHtml(foto.name)}" loading="lazy">
      <div class="photo-caption">${escapeHtml(foto.name)}</div>
    </div>
  `).join('');

  const modalPhotos = fotos.map((foto, index) => `
    <div class="modal-photo" id="modal-photo-${index}" style="display: ${index === 0 ? 'flex' : 'none'};">
      <img src="${foto.url}" alt="${escapeHtml(foto.name)}">
      <div class="modal-photo-info">
        <div class="modal-photo-name">${escapeHtml(foto.name)}</div>
        <div class="modal-photo-actions">
          <button onclick="downloadModalPhoto('${escapeJs(foto.url)}', '${escapeJs(foto.name)}')" class="modal-btn">
            📥 Baixar Foto
          </button>
          <button onclick="printModalPhoto('${escapeJs(foto.url)}', '${escapeJs(foto.name)}')" class="modal-btn">
            🖨️ Imprimir Foto
          </button>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!-- Seção de Fotos -->
    <div class="section photo-section">
      <div class="section-title">📸 Fotos do Projeto (${fotos.length})</div>
      <div class="photo-gallery">
        ${photoItems}
      </div>
    </div>

    <!-- Modal de Fotos -->
    <div id="photoModal" class="photo-modal" onclick="closePhotoModalOnBackdrop(event)">
      <button class="modal-close" onclick="closePhotoModal()">&times;</button>

      ${fotos.length > 1 ? `
        <button class="modal-nav modal-nav-prev" onclick="changePhoto(-1)">‹</button>
        <button class="modal-nav modal-nav-next" onclick="changePhoto(1)">›</button>
      ` : ''}

      <div class="modal-content">
        ${modalPhotos}
      </div>

      ${fotos.length > 1 ? `
        <div class="modal-counter">
          <span id="currentPhotoIndex">1</span> / ${fotos.length}
        </div>
      ` : ''}
    </div>

    <script>
      let currentPhotoIndex = 0;
      const totalPhotos = ${fotos.length};

      function openPhotoModal(index) {
        currentPhotoIndex = index;
        showPhoto(currentPhotoIndex);
        document.getElementById('photoModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      function closePhotoModal() {
        document.getElementById('photoModal').style.display = 'none';
        document.body.style.overflow = 'auto';
      }

      function closePhotoModalOnBackdrop(event) {
        if (event.target.id === 'photoModal') {
          closePhotoModal();
        }
      }

      function changePhoto(direction) {
        currentPhotoIndex = (currentPhotoIndex + direction + totalPhotos) % totalPhotos;
        showPhoto(currentPhotoIndex);
      }

      function showPhoto(index) {
        document.querySelectorAll('.modal-photo').forEach((photo, i) => {
          photo.style.display = i === index ? 'flex' : 'none';
        });

        const counterElement = document.getElementById('currentPhotoIndex');
        if (counterElement) {
          counterElement.textContent = index + 1;
        }
      }

      function downloadModalPhoto(url, filename) {
        fetch(url)
          .then(response => response.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          })
          .catch(error => console.error('Erro ao baixar foto:', error));
      }

      function printModalPhoto(url, photoName) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Escape to prevent injection
        const escapedName = photoName.replace(/'/g, "\\\\'").replace(/"/g, '\\\\"').replace(/\n/g, '\\\\n');
        const escapedUrl = url.replace(/'/g, "\\\\'").replace(/"/g, '\\\\"');

        const htmlContent = \`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <title>Imprimir - \${escapedName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              @media print { img { box-shadow: none; } }
            </style>
          </head>
          <body>
            <img src="\${escapedUrl}" alt="\${escapedName}" onload="window.print();">
          </body>
          </html>
        \`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }

      // Keyboard navigation
      document.addEventListener('keydown', function(event) {
        const modal = document.getElementById('photoModal');
        if (modal.style.display === 'flex') {
          if (event.key === 'Escape') {
            closePhotoModal();
          } else if (event.key === 'ArrowLeft') {
            changePhoto(-1);
          } else if (event.key === 'ArrowRight') {
            changePhoto(1);
          }
        }
      });
    </script>
  `;
}

/**
 * Generate CSS styles for photo gallery
 * @returns CSS string for photo gallery styles
 */
export function getPhotoGalleryCSS(): string {
  return `
    /* Photo Gallery Styles */
    .photo-section {
      margin-top: 32px;
      page-break-inside: avoid;
    }

    .photo-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .photo-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      background: #f8f9fa;
      border: 1px solid #e1e5e9;
    }

    .photo-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      color: white;
      padding: 12px 8px 8px;
      font-size: 0.75rem;
      text-align: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .photo-item:hover .photo-caption {
      opacity: 1;
    }

    /* Photo Modal Styles */
    .photo-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-photo {
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .modal-photo img {
      max-width: 85vw;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    .modal-photo-info {
      text-align: center;
      color: white;
    }

    .modal-photo-name {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .modal-photo-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .modal-btn {
      padding: 10px 20px;
      background: white;
      color: #000;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .modal-btn:hover {
      background: #f0f0f0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
    }

    .modal-close {
      position: absolute;
      top: 20px;
      right: 30px;
      font-size: 48px;
      color: white;
      background: none;
      border: none;
      cursor: pointer;
      z-index: 10000;
      line-height: 1;
      padding: 0;
      width: 48px;
      height: 48px;
      transition: transform 0.2s;
    }

    .modal-close:hover {
      transform: rotate(90deg);
    }

    .modal-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      font-size: 48px;
      padding: 12px 20px;
      cursor: pointer;
      z-index: 10000;
      transition: background 0.2s;
      border-radius: 4px;
      line-height: 1;
    }

    .modal-nav:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .modal-nav-prev {
      left: 20px;
    }

    .modal-nav-next {
      right: 20px;
    }

    .modal-counter {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .photo-gallery {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }

      .modal-nav {
        font-size: 36px;
        padding: 8px 12px;
      }

      .modal-close {
        font-size: 36px;
        width: 36px;
        height: 36px;
        top: 10px;
        right: 10px;
      }
    }

    /* Print styles */
    @media print {
      .photo-modal {
        display: none !important;
      }

      .photo-gallery {
        grid-template-columns: repeat(2, 1fr);
        page-break-inside: avoid;
      }

      .photo-item {
        page-break-inside: avoid;
      }

      .photo-caption {
        opacity: 1;
        background: rgba(0, 0, 0, 0.7);
      }
    }
  `;
}
