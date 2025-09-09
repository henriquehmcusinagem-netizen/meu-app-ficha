import { FichaSalva, FormData, Material, Foto, Calculos } from '@/types/ficha-tecnica';

const STORAGE_KEY = 'fichas_tecnicas_salvas';
const MAX_FICHAS = 50;

// Generate UUID
function generateId(): string {
  return 'ficha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get all saved fichas
export function carregarFichasSalvas(): FichaSalva[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao carregar fichas salvas:', error);
    return [];
  }
}

// Save a ficha
export function salvarFicha(
  formData: FormData,
  materiais: Material[],
  fotos: Foto[],
  calculos: Calculos,
  numeroFTC: string,
  fichaId?: string
): { success: boolean; id?: string; error?: string } {
  try {
    const fichas = carregarFichasSalvas();
    const now = new Date().toISOString();
    
    // Create resumo
    const resumo = {
      cliente: formData.cliente,
      servico: formData.servico,
      quantidade: formData.quantidade,
      valorTotal: calculos.materialTodasPecas
    };

    // Convert fotos to metadata only
    const fotosMetadata = fotos.map(foto => ({
      id: foto.id,
      name: foto.name,
      size: foto.size,
      type: foto.file?.type || 'image/jpeg'
    }));

    const ficha: FichaSalva = {
      id: fichaId || generateId(),
      numeroFTC,
      dataCriacao: fichaId ? fichas.find(f => f.id === fichaId)?.dataCriacao || now : now,
      dataUltimaEdicao: now,
      status: formData.desenho_finalizado === 'SIM' ? 'finalizada' : 'rascunho',
      formData,
      materiais,
      fotos: fotosMetadata,
      calculos,
      resumo
    };

    // Update or add ficha
    if (fichaId) {
      const index = fichas.findIndex(f => f.id === fichaId);
      if (index !== -1) {
        fichas[index] = ficha;
      } else {
        fichas.push(ficha);
      }
    } else {
      fichas.push(ficha);
    }

    // Maintain max limit
    if (fichas.length > MAX_FICHAS) {
      fichas.sort((a, b) => new Date(b.dataUltimaEdicao).getTime() - new Date(a.dataUltimaEdicao).getTime());
      fichas.splice(MAX_FICHAS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(fichas));
    return { success: true, id: ficha.id };
  } catch (error) {
    console.error('Erro ao salvar ficha:', error);
    return { success: false, error: 'Erro ao salvar ficha. Verifique o espaço de armazenamento.' };
  }
}

// Load a specific ficha
export function carregarFicha(id: string): FichaSalva | null {
  try {
    const fichas = carregarFichasSalvas();
    return fichas.find(f => f.id === id) || null;
  } catch (error) {
    console.error('Erro ao carregar ficha:', error);
    return null;
  }
}

// Delete a ficha
export function excluirFicha(id: string): boolean {
  try {
    const fichas = carregarFichasSalvas();
    const filtered = fichas.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Erro ao excluir ficha:', error);
    return false;
  }
}

// Validate required fields (validation disabled - allow saving partial forms)
export function validarCamposObrigatorios(formData: FormData, materiais: Material[]): string[] {
  // No validation - users can save partially filled forms
  return [];
}

// Check storage quota
export function checkStorageQuota(): { available: boolean; usage: number } {
  try {
    const testKey = '__storage_test__';
    const testValue = new Array(1024).join('a'); // 1KB test
    
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    
    // Calculate approximate usage
    let usage = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        usage += localStorage[key].length + key.length;
      }
    }
    
    return { available: true, usage };
  } catch (error) {
    return { available: false, usage: -1 };
  }
}