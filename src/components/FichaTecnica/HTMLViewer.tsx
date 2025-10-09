import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function HTMLViewer() {
  const params = useParams();
  const location = useLocation();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Com splat route (*), o path vem como params["*"] ou pegamos do pathname
    const filePath = params["*"] || location.pathname.replace('/view-html/', '');

    if (!filePath) {
      setError('Arquivo não encontrado');
      setLoading(false);
      return;
    }

    const loadHTMLContent = async () => {
      try {
        const decodedPath = decodeURIComponent(filePath);

        const { data, error } = await supabase.storage
          .from('ficha-fotos')
          .download(decodedPath);

        if (error) {
          throw error;
        }

        const htmlText = await data.text();
        setHtmlContent(htmlText);
      } catch (err) {
        console.error('Erro ao carregar HTML:', err);
        setError('Não foi possível carregar o conteúdo');
      } finally {
        setLoading(false);
      }
    };

    loadHTMLContent();
  }, [params, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando ficha técnica...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">Erro</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        if (node && htmlContent) {
          // Limpar conteúdo anterior
          node.innerHTML = '';

          // Criar um template temporário para parsear o HTML
          const template = document.createElement('template');
          template.innerHTML = htmlContent;

          // Adicionar todo o conteúdo
          node.appendChild(template.content.cloneNode(true));

          // Executar scripts manualmente (React não executa scripts via dangerouslySetInnerHTML)
          const scripts = node.querySelectorAll('script');
          scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');

            // Copiar atributos
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });

            // Copiar conteúdo
            newScript.textContent = oldScript.textContent;

            // Substituir script antigo pelo novo (para forçar execução)
            oldScript.parentNode?.replaceChild(newScript, oldScript);
          });

          // ✅ DISPARAR DOMContentLoaded após scripts serem executados
          // Isso garante que funções de pré-preenchimento sejam executadas
          setTimeout(() => {
            const event = new Event('DOMContentLoaded');
            document.dispatchEvent(event);
            console.log('🔄 DOMContentLoaded disparado manualmente pelo HTMLViewer');
          }, 100);
        }
      }}
      className="w-full min-h-screen bg-background"
    />
  );
}