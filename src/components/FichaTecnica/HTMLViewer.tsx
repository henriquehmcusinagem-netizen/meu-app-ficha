import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function HTMLViewer() {
  const { filePath } = useParams<{ filePath: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
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
  }, [filePath]);

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
      className="w-full min-h-screen bg-background"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}