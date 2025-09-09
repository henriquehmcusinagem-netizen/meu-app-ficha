// Generate next FTC number from database
export async function getNextFTCNumber(): Promise<string> {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    const { data, error } = await supabase
      .rpc('get_next_ftc_number');

    if (error) {
      console.error('Erro ao gerar número FTC:', error);
      // Fallback: generate based on current year + timestamp
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-3);
      return `${year}${timestamp}`;
    }
    
    return data || `${new Date().getFullYear()}001`;
  } catch (error) {
    console.error('Erro ao buscar próximo número FTC:', error);
    // Fallback: generate based on current year + timestamp
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-3);
    return `${year}${timestamp}`;
  }
}

export function getCurrentDate(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  
  return `${day}/${month}/${year}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}